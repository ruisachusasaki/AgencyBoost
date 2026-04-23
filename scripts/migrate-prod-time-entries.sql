-- =============================================================================
-- Production migration: legacy tasks.time_entries (JSONB) -> task_time_entries
-- =============================================================================
--
-- WHAT THIS DOES
--   1. Detects whether the legacy `tasks.time_entries` JSONB column still
--      exists. If not, exits cleanly (idempotent / safe to re-run).
--   2. Copies every valid legacy entry into the normalized `task_time_entries`
--      table, preserving original IDs so the operation is replayable.
--   3. Converts legacy duration values from MINUTES to SECONDS:
--        - Real elapsed entries (end_time > start_time) are recomputed from
--          EXTRACT(EPOCH FROM end-start)  (ground truth).
--        - Manual entries (end_time = start_time) are multiplied by 60.
--   4. Recomputes `tasks.time_tracked` aggregates as SUM(duration) over the
--      normalized table for every affected task.
--   5. Drops the legacy `tasks.time_entries` column.
--   6. Prints before/after counts via RAISE NOTICE.
--
--   Everything runs inside a single transaction. If any step fails the entire
--   migration is rolled back and production is left untouched.
--
-- USAGE
--
--   *** ALWAYS BACK UP PRODUCTION FIRST ***
--     pg_dump "$DATABASE_URL" -t tasks -t task_time_entries \
--       -f backup-time-entries-$(date +%Y%m%d-%H%M%S).sql
--
--   Dry run (inspect output, then roll back):
--     psql "$DATABASE_URL" \
--       -v ON_ERROR_STOP=1 \
--       -c "BEGIN;" \
--       -f scripts/migrate-prod-time-entries.sql \
--       -c "ROLLBACK;"
--
--   Real run:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--       -f scripts/migrate-prod-time-entries.sql
--
--   Or use the convenience wrapper:
--     tsx scripts/migrate-prod-time-entries.ts
--
-- WHAT TO LOOK FOR IN THE OUTPUT
--   - "legacy entries found: <N>"   should be ~5,646 in prod, 0 in dev
--   - "rows inserted: <N>"           how many new rows were normalized
--   - "manual rows converted (×60)"  rows where end_time = start_time
--   - "elapsed rows recomputed"      rows where end_time > start_time
--   - "tasks recomputed"             affected tasks with new time_tracked
--   - Final SELECT shows tasks.time_tracked == SUM(duration) for sanity.
--
-- AFTER RUNNING
--   The deploy's destructive `ALTER TABLE tasks DROP COLUMN time_entries`
--   step becomes a no-op (column is already gone), so the deploy is safe.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Phase 0: safety guard. Exit cleanly if the legacy column is already gone.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  legacy_exists BOOLEAN;
  legacy_count  BIGINT := 0;
  ttte_before   BIGINT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'tasks'
      AND column_name = 'time_entries'
  ) INTO legacy_exists;

  SELECT COUNT(*) INTO ttte_before FROM task_time_entries;

  IF NOT legacy_exists THEN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Legacy tasks.time_entries column is already dropped.';
    RAISE NOTICE 'task_time_entries row count: %', ttte_before;
    RAISE NOTICE 'Nothing to do. Exiting (no-op).';
    RAISE NOTICE '====================================================';
    RETURN;
  END IF;

  EXECUTE $count$
    SELECT COUNT(*)
    FROM tasks t,
         LATERAL jsonb_array_elements(COALESCE(t.time_entries, '[]'::jsonb)) e
    WHERE e->>'userId' IS NOT NULL
      AND COALESCE(e->>'startTime','') <> ''
  $count$ INTO legacy_count;

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'BEFORE migration:';
  RAISE NOTICE '  task_time_entries rows : %', ttte_before;
  RAISE NOTICE '  legacy entries to copy : %', legacy_count;
  RAISE NOTICE '====================================================';
END
$$;

-- If the legacy column is gone, the rest of the script is harmless: every
-- statement below is guarded so it does nothing when there is no work.

SAVEPOINT before_insert;

-- ---------------------------------------------------------------------------
-- Phase 1: copy legacy JSONB entries into task_time_entries.
--          Capture inserted IDs so we only convert rows we just inserted
--          (avoids touching any rows already present in seconds).
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE migrated_ids (id VARCHAR PRIMARY KEY) ON COMMIT DROP;

DO $$
DECLARE
  legacy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'tasks'
      AND column_name = 'time_entries'
  ) INTO legacy_exists;

  IF NOT legacy_exists THEN
    RETURN;
  END IF;

  EXECUTE $insert$
    WITH inserted AS (
      INSERT INTO task_time_entries (
        id, task_id, user_id, task_title, user_name,
        start_time, end_time, duration, is_running, source, notes,
        stopped_by, stop_reason, auto_stopped_at, auto_stopped_threshold_hours
      )
      SELECT
        COALESCE(NULLIF(entry->>'id', ''), gen_random_uuid()::varchar),
        t.id,
        entry->>'userId',
        COALESCE(entry->>'taskTitle', t.title),
        entry->>'userName',
        (entry->>'startTime')::timestamp,
        CASE WHEN COALESCE(entry->>'endTime','') <> ''
             THEN (entry->>'endTime')::timestamp END,
        CASE WHEN COALESCE(entry->>'duration','') <> ''
             THEN (entry->>'duration')::int END,
        COALESCE((entry->>'isRunning')::boolean, false),
        COALESCE(NULLIF(entry->>'source', ''), 'legacy'),
        entry->>'notes',
        NULLIF(entry->>'stoppedBy', ''),
        NULLIF(entry->>'stopReason', ''),
        CASE WHEN COALESCE(entry->>'autoStoppedAt','') <> ''
             THEN (entry->>'autoStoppedAt')::timestamp END,
        CASE WHEN COALESCE(entry->>'autoStoppedThresholdHours','') <> ''
             THEN (entry->>'autoStoppedThresholdHours')::int END
      FROM tasks t,
           LATERAL jsonb_array_elements(COALESCE(t.time_entries, '[]'::jsonb)) AS entry
      WHERE entry->>'userId' IS NOT NULL
        AND COALESCE(entry->>'startTime','') <> ''
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    )
    INSERT INTO migrated_ids (id) SELECT id FROM inserted
  $insert$;
END
$$;

DO $$
DECLARE
  inserted_n BIGINT;
BEGIN
  SELECT COUNT(*) INTO inserted_n FROM migrated_ids;
  RAISE NOTICE 'Phase 1: rows inserted into task_time_entries: %', inserted_n;
END
$$;

SAVEPOINT after_insert;

-- ---------------------------------------------------------------------------
-- Phase 2: unit conversion (legacy minutes -> seconds).
--   Only touches rows we just inserted (tracked in migrated_ids).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  elapsed_n BIGINT;
  manual_n  BIGINT;
BEGIN
  -- 2a. Real elapsed entries: recompute from timestamp delta (ground truth).
  WITH updated AS (
    UPDATE task_time_entries tte
    SET duration = FLOOR(EXTRACT(EPOCH FROM (tte.end_time - tte.start_time)))::int
    WHERE tte.id IN (SELECT id FROM migrated_ids)
      AND tte.end_time IS NOT NULL
      AND tte.start_time IS NOT NULL
      AND tte.end_time > tte.start_time
    RETURNING 1
  )
  SELECT COUNT(*) INTO elapsed_n FROM updated;

  -- 2b. Manual entries (end = start): legacy minutes -> seconds.
  WITH updated AS (
    UPDATE task_time_entries tte
    SET duration = duration * 60
    WHERE tte.id IN (SELECT id FROM migrated_ids)
      AND tte.end_time IS NOT NULL
      AND tte.start_time IS NOT NULL
      AND tte.end_time = tte.start_time
      AND tte.duration IS NOT NULL
      AND tte.duration > 0
    RETURNING 1
  )
  SELECT COUNT(*) INTO manual_n FROM updated;

  RAISE NOTICE 'Phase 2: elapsed rows recomputed: %', elapsed_n;
  RAISE NOTICE 'Phase 2: manual rows converted (x60): %', manual_n;
END
$$;

SAVEPOINT after_convert;

-- ---------------------------------------------------------------------------
-- Phase 3: recompute tasks.time_tracked aggregates for affected tasks.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  recomputed_n BIGINT;
BEGIN
  WITH affected_tasks AS (
    SELECT DISTINCT task_id
    FROM task_time_entries
    WHERE id IN (SELECT id FROM migrated_ids)
  ),
  recomputed AS (
    UPDATE tasks t
    SET time_tracked = COALESCE((
      SELECT SUM(tte.duration)::int
      FROM task_time_entries tte
      WHERE tte.task_id = t.id
        AND tte.is_running = false
        AND tte.duration IS NOT NULL
    ), 0)
    WHERE t.id IN (SELECT task_id FROM affected_tasks)
    RETURNING 1
  )
  SELECT COUNT(*) INTO recomputed_n FROM recomputed;

  RAISE NOTICE 'Phase 3: tasks recomputed: %', recomputed_n;
END
$$;

SAVEPOINT after_recompute;

-- ---------------------------------------------------------------------------
-- Phase 4: drop the legacy column. Idempotent (IF EXISTS).
-- ---------------------------------------------------------------------------
ALTER TABLE tasks DROP COLUMN IF EXISTS time_entries;

DO $$
BEGIN
  RAISE NOTICE 'Phase 4: legacy tasks.time_entries column dropped.';
END
$$;

-- ---------------------------------------------------------------------------
-- Phase 5: post-migration summary + sanity check.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  ttte_after  BIGINT;
  mismatches  BIGINT;
BEGIN
  SELECT COUNT(*) INTO ttte_after FROM task_time_entries;

  SELECT COUNT(*) INTO mismatches FROM (
    SELECT t.id,
           t.time_tracked,
           COALESCE((SELECT SUM(duration)::int
                     FROM task_time_entries tte
                     WHERE tte.task_id = t.id
                       AND tte.is_running = false
                       AND tte.duration IS NOT NULL), 0) AS recomputed
    FROM tasks t
  ) x
  WHERE x.time_tracked IS DISTINCT FROM x.recomputed;

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'AFTER migration:';
  RAISE NOTICE '  task_time_entries rows : %', ttte_after;
  RAISE NOTICE '  aggregate mismatches   : %', mismatches;
  RAISE NOTICE '====================================================';

  IF mismatches > 0 THEN
    RAISE WARNING 'Some tasks.time_tracked values do not match SUM(duration). Investigate before deploy.';
  END IF;
END
$$;

COMMIT;
