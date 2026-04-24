# CLAUDE.md — AgencyBoost

Quick-reference brain file for Claude. For the deep map, see [REPO_MAP.md](./REPO_MAP.md). For current priorities, see [docs/PLANNING_CONTEXT.md](./docs/PLANNING_CONTEXT.md).

## What this app is

**AgencyBoost** is a full-stack CRM/operations platform built for marketing agencies. It bundles together: client & contact management, leads/sales pipeline with quotes-as-proposals (digital signing + Stripe payment), tasks with time tracking, projects and campaigns, HR (time off, job applications, 1-on-1s, onboarding checklists, IC agreements), a knowledge base, internal training/LMS, automation workflows, a ticketing system, a call center timer, a public client portal, and a configurable client-onboarding form. It's a single-tenant deployment per agency (multi-tenant AWS plan exists as a future direction).

## Tech stack

- **Language:** TypeScript end-to-end (strict mode), ESM, Node 20.
- **Frontend:** React 18 + Vite, Wouter (routing), TanStack Query, React Hook Form + Zod, Tailwind CSS + Radix UI + shadcn/ui, Lucide icons, Tiptap + Slate + Quill (rich text), ReactFlow (workflow builder), Recharts (reporting), React Grid Layout (dashboards), Framer Motion, Uppy (uploads).
- **Backend:** Express 4 + `tsx`, custom session/OIDC auth stack (Passport + `openid-client` + `express-session` + `connect-pg-simple`), `multer` for uploads.
- **Database:** PostgreSQL (Neon serverless in Replit), Drizzle ORM + drizzle-zod, `drizzle-kit` for migrations. Single schema file at `shared/schema.ts`.
- **Integrations (keys stored encrypted in DB, env vars as fallback):** Google OAuth + Calendar, Stripe (payments + webhooks + subscriptions), Mailgun (email), Twilio (SMS + VoIP), Slack Web API, Notion, OpenAI (AI assistant + KB indexing), Fathom (meeting recordings), Replit Object Storage (Google Cloud Storage under the hood).
- **Hosting:** Replit VM deployment. Two-process production: `dist/prodEntry.js` (proxy/health-check) spawns `dist/appWorker.js` (actual API). See "Gotchas".

## Top-level folder structure

```
AgencyBoost/
├── client/              React + Vite frontend. Root is client/ per vite.config.ts.
│   ├── index.html       Vite entry.
│   ├── public/          Static assets served verbatim.
│   └── src/             All frontend code. ~50+ pages, settings sub-pages, components, contexts, hooks.
├── server/              Express API server. One giant routes.ts (~47k lines) + storage.ts (~10.7k lines).
│   ├── services/        Domain services (lead conversion, onboarding spawn, hired notifications, etc.).
│   ├── lib/             Small utilities (roles CSV).
│   └── migrations/      Ad-hoc runtime migration scripts.
├── shared/              Code imported by both client and server via @shared/* alias.
│   ├── schema.ts        ~6.1k lines, 232 Drizzle pgTable definitions + Zod insert schemas.
│   ├── constants.ts     Canonical enums (job-application stages, etc.).
│   ├── permission-templates.ts   Permission key catalog (64k).
│   ├── role-templates.ts         Role presets.
│   ├── widget-permissions.ts     Dashboard widget access rules.
│   └── utils/           csvExport, healthAnalysis.
├── migrations/          Drizzle-kit output (generated SQL migrations + meta/).
├── scripts/             build.sh (production), post-merge.sh, one-off SQL.
├── attached_assets/     Dumped screenshots, Replit paste-ins, exported CSVs. Noisy; ignore for code work.
├── dist/                Build output. Committed to git — production uses it directly (see Gotchas).
├── docs/                Human documentation + the new planning/decisions templates.
└── replit.md            Replit-agent-facing living spec. Long-form "what this app does" document.
```

## Path aliases (Vite + tsconfig)

- `@/*`        → `client/src/*`
- `@shared/*`  → `shared/*`
- `@assets/*`  → `attached_assets/*`

## Coding conventions (detectable from the code)

- **TypeScript strict mode everywhere.** `noEmit: true` — `npm run check` = `tsc` for type-checking only.
- **Drizzle, not raw SQL, for 99% of DB work.** `shared/schema.ts` is the single source of truth; `drizzle-zod` generates insert/validation schemas (`insert<Thing>Schema`).
- **Validation at the boundary with Zod.** Route handlers call `insertFooSchema.parse(req.body)`; shared types flow from the schema.
- **Storage layer pattern.** `server/storage.ts` is a thick facade (`storage.getFoo`, `storage.createBar`, etc.) that server routes call instead of talking to Drizzle directly. New DB queries go there.
- **Routing:** client uses Wouter `<Route path=... />`, server uses plain Express — no router files, everything lives in one `registerRoutes(app)` in `server/routes.ts`.
- **Auth/permissions:** dot-notation permission keys (`settings.staff.view`, `settings.leads.manage`). Guard server routes with middleware; guard UI with `<RequirePermission permission="...">` and `<PermissionGate>`. A legacy-key migration map lives in `client/src/hooks/use-has-permission.ts`.
- **Theme:** primary teal is `hsl(179, 100%, 39%)` / `#00C9C6`. Replace stray blue accents with this. Dark/light mode via `ThemeContext` + localStorage.
- **UI primitives:** shadcn/ui (generated into `client/src/components/ui/`, config in `components.json`). Class merging via `cn()` in `client/src/lib/utils.ts` (clsx + tailwind-merge).
- **Checkboxes:** square for bulk selection, circular for task completion. (User preference — documented in `replit.md`.)
- **Server state:** TanStack Query. Shared `queryClient` in `client/src/lib/queryClient.ts`.
- **File names:** kebab-case for pages/components (`enhanced-client-detail.tsx`); PascalCase for a handful of legacy/larger components.
- **Imports:** never reach across `client ↔ server`. Anything both sides need goes in `shared/`.
- **Secrets in the DB are encrypted.** See `server/encryption.ts`; integrations call `EncryptionService.decrypt()` before use.

## How to run, build, and test

- **Install:** `npm install`.
- **Dev (frontend + backend on port 5000):** `npm run dev` — runs `tsx server/index.ts`; Vite middleware is mounted by `server/vite.ts` in dev.
- **Type-check:** `npm run check`.
- **Push schema changes to DB (dev):** `npm run db:push` — runs `drizzle-kit push` against `DATABASE_URL`. No formal migration files in dev; `drizzle-kit` diffs the schema against the live DB.
- **Production build — USE `bash scripts/build.sh`, not `npm run build`.** See Gotchas.
- **Production run (what Replit does):** `NODE_ENV=production node dist/prodEntry.js`.
- **Tests:** there is **no test runner configured.** No `test` script, no `vitest`/`jest` dep. `test-sync.js` and `test_import*.csv` at the root are one-off scratch files, not a suite. QA is manual via checklists in `docs/qa/`. Do not claim anything is "tested" — there's nothing to run.

## Required environment variables (minimum)

`DATABASE_URL` (required; app crashes on boot without it), `PORT` (defaults 5000), `SESSION_SECRET`, `REPL_ID` / Replit OIDC vars for login. Integration keys (Stripe, Mailgun, Twilio, Google, Slack, OpenAI) are stored encrypted in DB via Settings → Integrations, with env-var fallback. See `replit.md` for the full integration list.

## Gotchas (non-obvious things that will bite you)

1. **Production is TWO processes, and `npm run build` only builds ONE of them.** `dist/prodEntry.js` proxies to `dist/appWorker.js`; the worker is what actually serves the API. `npm run build` rebuilds `dist/index.js` + the frontend but **does not** rebuild `appWorker.js` or `prodEntry.js`. Result: "deployed but broken" — production silently keeps running the last committed worker. **Always run `bash scripts/build.sh` before publishing** any `server/**` change. `.replit` config uses `build = ["echo", "pre-built"]`, meaning Replit does not rebuild on publish; it uses whatever's in `dist/` in git.

2. **`dist/` is committed to git.** It's not in `.gitignore`. If you ever see giant diffs in `dist/`, that's a rebuild, not someone hand-editing compiled code.

3. **`server/routes.ts` is ~47,000 lines and `server/storage.ts` is ~10,700 lines.** These are the mega-files. Editing them requires narrow, targeted edits — don't read them end-to-end. `grep`/`sed -n 'a,bp'` around the feature you're touching.

4. **`shared/schema.ts` has 232 tables in one file (~6,100 lines).** Same rule: navigate by symbol, don't read top-to-bottom. Related tables are grouped but the file is not alphabetized.

5. **Idempotent runtime migrations.** `server/index.ts` runs `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` blocks on boot (e.g., `ensureClientBriefColumns`, `ensureDefaultTemplateColumn`). This is how schema drift is patched in production without a formal migration. If you add a column, follow this pattern OR add a drizzle-kit migration — don't silently rely on one without the other.

6. **Dev DB uses `drizzle-kit push` (no migration files generated in dev flow).** The `migrations/` folder has one generated SQL file. Schema is the source of truth; changes propagate via `npm run db:push`.

7. **Two-process auth:** both Replit OIDC and email/password (`server/auth.ts` + `server/replitAuth.ts` + `server/googleAuth.ts`). Sessions are in Postgres via `connect-pg-simple`.

8. **Super admin is hard-coded by email.** Joe Hupp / `joe@themediaoptimizers.com` has unconditional full access in both dev and prod. Don't remove that check without explicit discussion.

9. **Salary/compensation data is admin-only across ALL endpoints.** If you add a new endpoint that returns staff, strip salary fields for non-admins.

10. **Client custom-field sync:** updating Email/Phone/First Name/Last Name in a client's custom fields writes back to the core `clients` columns. Don't double-write; the storage layer handles it.

11. **Quotes act as proposals** — the domain vocabulary is overloaded. `quotes.build_fee`, `quotes.custom_agreement`, `quotes.stripe_subscription_id` all live on the same table. Proposal public URLs are `/public-proposal/:token`. Onboarding form is `/client-onboarding/:token`. Offer signing is `/sign-offer/:token`.

12. **Route count is ~988.** Before writing a new endpoint, grep for the resource name — it probably already exists.

13. **`attached_assets/` is noise.** Screenshots and pasted logs from Replit. Safe to ignore for code work.

14. **`replit.md` is the living long-form spec.** When features change in non-trivial ways, that file gets updated. It's often richer context than inline comments.

15. **File-access policy in active Claude sessions:** by operator instruction, Claude may only write `CLAUDE.md`, `REPO_MAP.md`, and files under `docs/`. All source changes are described in words and handed to the Replit agent.
