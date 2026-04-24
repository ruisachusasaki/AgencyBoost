# Plan: [SHORT DESCRIPTIVE TITLE]

> Copy this template to `docs/plans/YYYY-MM-DD-short-title.md` when starting a new plan.
> Fill in the sections top-to-bottom. Sections marked *(filled in later)* stay empty until execution begins.

---

## Goal

*One or two sentences. What does success look like? Be specific enough that you'd know it was achieved without having to re-read the plan.*

---

## Context

*Why are we doing this now? What changed, what triggered it, what does the user/business want? Link to the ticket, Slack thread, or conversation that kicked this off. Include any prior attempts or alternatives that were already ruled out — don't make a future reader re-discover them.*

---

## Affected files

*Which files, tables, or modules are in scope? Be explicit — vague scope is where plans go off the rails. Use `path:line` where helpful.*

- `path/to/file.ts` — what changes
- `shared/schema.ts:1234` — which table/column
- _(…)_

---

## Proposed approach

*The "how" in plain language. One or two paragraphs, or a numbered walkthrough. Describe the shape of the change — new functions, modified endpoints, new columns, migration order — without pasting actual code. A future reader should be able to sanity-check the direction in under 30 seconds.*

---

## Risks & edge cases

*What could go wrong? Concurrency, migrations on live data, permission edge cases, webhook retries, idempotency, race conditions, legacy key formats, deploy ordering, silently-breaking-prod-because-`dist/`-wasn't-rebuilt, etc. Be honest — if you don't list it here, it will bite you later.*

- _Risk:_ …
  - _Mitigation:_ …

---

## Open questions

*Things you want the human to confirm before (or during) execution. If the answer changes the plan meaningfully, flag it here so it doesn't get forgotten mid-implementation.*

- [ ] …
- [ ] …

---

## Implementation steps

*Ordered, checkable list. Each step should be small enough to review in one sitting. Include DB changes, server changes, client changes, and verification in whatever order the dependency graph demands.*

1. [ ] …
2. [ ] …
3. [ ] …
4. [ ] Manual QA: *(steps to click through to verify)*
5. [ ] If `server/**` changed: run `bash scripts/build.sh` before publish.

---

## Status *(filled in during/after execution)*

*One of:* `Draft` · `Approved, not started` · `In progress` · `Blocked` · `Done` · `Abandoned`

---

## What actually happened *(filled in after execution)*

*A short retro. What did we do vs. what we planned? What surprised us? What follow-up work did it expose? This section is the one that makes future plans smarter — don't skip it even when the plan went smoothly.*

- **Deviations from plan:** …
- **Surprises / new info learned:** …
- **Follow-up work created:** …
- **Files ultimately touched:** …
