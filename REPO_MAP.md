# REPO_MAP.md — AgencyBoost

Detailed orientation map for the codebase. Read after [CLAUDE.md](./CLAUDE.md). Source of truth for long-form context is `shared/schema.ts` (models) + `server/routes.ts` (endpoints) + `replit.md` (feature narrative).

Sizes noted below are approximate and mostly useful as a signal of "don't read end-to-end":
- `server/routes.ts` — **~47,000 lines, ~988 Express route registrations**
- `server/storage.ts` — **~10,700 lines** (DB access facade)
- `shared/schema.ts` — **~6,100 lines, 232 `pgTable` definitions**
- `server/index.ts` — **~2,760 lines** (boot, startup migrations, trigger seeding)
- `client/src/App.tsx` — **~1,060 lines** (route table)

---

## Folder tree

Generated files (`node_modules/`, `dist/`, `migrations/meta/`, `attached_assets/`) and scratch files are omitted.

```
AgencyBoost/
├── CLAUDE.md                  Brain-file orientation (this session's policy).
├── REPO_MAP.md                You are here.
├── replit.md                  Long-form feature + architecture narrative; living spec.
├── package.json               Scripts, deps. No test runner configured.
├── package-lock.json
├── tsconfig.json              Strict TS, noEmit, paths: @/* → client/src, @shared/* → shared.
├── vite.config.ts             Vite config; root is client/, build out is dist/public.
├── tailwind.config.ts
├── postcss.config.js
├── drizzle.config.ts          Drizzle-kit config; schema = shared/schema.ts, out = migrations/.
├── components.json            shadcn/ui generator config.
├── .replit                    Replit deployment + workflow config. Two-process prod.
├── .gitignore                 Minimal (node_modules, .DS_Store, server/public, *.tar.gz).
│
├── client/                    Vite root.
│   ├── index.html
│   ├── public/                Static assets served verbatim.
│   └── src/
│       ├── main.tsx           App bootstrap; mounts providers.
│       ├── App.tsx            ~1060-line route table wiring all pages.
│       ├── index.css          Tailwind layer + CSS variables (theme tokens).
│       ├── contexts/          ThemeContext, TimerContext, MeetingTimerContext.
│       ├── hooks/             use-has-permission, use-voip, use-business-timezone,
│       │                      use-custom-field-merge-tags, use-mobile, use-toast.
│       ├── lib/               queryClient (TanStack Query), utils (cn, formatPhoneNumber,
│       │                      date/week helpers).
│       ├── pages/             60+ top-level pages; see "Pages" section below.
│       │   ├── settings/      25 Settings sub-pages (staff, roles, integrations, etc.).
│       │   ├── hr/            HR sub-pages (OnboardingChecklist, OnboardingDashboard).
│       │   ├── training/      LMS sub-pages (courses, lessons, analytics).
│       │   ├── client-portal/ Public-facing client portal (login + dashboard).
│       │   └── solutions/     Marketing pages (one per feature area).
│       └── components/        ~74 top-level components + these subfolders:
│           ├── ui/            54 shadcn/ui primitives (button, dialog, …).
│           ├── widgets/       41 dashboard widgets (MRR, leads, tasks, …).
│           ├── forms/         16 form shells (client, lead, task, job application…).
│           ├── hr/            14 HR components (offboarding, expense forms, org chart…).
│           ├── onboarding/    9 onboarding checklist UI pieces.
│           ├── settings/      6 settings-specific sub-components.
│           ├── dashboard/     5 legacy dashboard widgets (being migrated to widgets/).
│           ├── layout/        header, sidebar, main-layout.
│           ├── signing/       Signature capture + signing states.
│           ├── voip/          Twilio Voice SDK UI (dialer, active call).
│           ├── icagreement/   IC agreement editor + placeholder toolbar.
│           ├── applications/  Offer panel, SendOfferModal, SignedDocumentModal.
│           ├── marketing/     Landing/solutions page components.
│           ├── admin/         impersonation-banner, login-as-dropdown.
│           ├── client-portal/ assets-section (client-facing view).
│           ├── training/      ThumbnailUpload.
│           └── forms/         (covered above)
│
├── server/                    Express API.
│   ├── index.ts               Boot entry (dev). Defines `initializeApp()` + `getApp()`;
│   │                          runs startup migrations + trigger seeding before listen.
│   ├── prodEntry.ts           Prod-only proxy + health-check process. Spawns appWorker.
│   ├── appWorker.ts           Prod-only worker; calls initializeApp() then signals ready.
│   ├── routes.ts              ~47k-line `registerRoutes(app)`; ALL API endpoints live here.
│   ├── storage.ts             ~10.7k-line facade over Drizzle (storage.getFoo, createBar…).
│   ├── storage-simple.ts      Older/partial facade (being retired).
│   ├── storage-clean.ts       Placeholder stub.
│   ├── db.ts                  pg.Pool + drizzle() binding.
│   ├── vite.ts                Dev-only: mounts Vite middleware + serves static in prod.
│   │
│   ├── auth.ts                Email/password auth (local passport strategy, bcrypt).
│   ├── replitAuth.ts          Replit OIDC passport strategy.
│   ├── googleAuth.ts          Google OAuth strategy (distinct from Calendar).
│   ├── encryption.ts          AES encryption service for DB-stored integration secrets.
│   ├── objectAcl.ts           ACL rules for object-storage uploads.
│   ├── objectStorage.ts       Replit Object Storage / GCS client wrapper.
│   │
│   ├── googleCalendar*.ts     13 files for Google Calendar sync (see below).
│   ├── calendarEventsRoute.ts Standalone calendar events router.
│   ├── stripe.ts              Stripe client lookup + async config getters; webhook helpers.
│   ├── slack-service.ts       Slack Web API helpers + workflow integration.
│   ├── fathomService.ts       Fetches Fathom meeting recordings.
│   ├── notification-service.ts DB-backed notifications + Mailgun email + Twilio SMS dispatch.
│   │
│   ├── workflow-engine.ts     ~38k: trigger/action evaluator + variable interpolation.
│   ├── taskGenerationEngine.ts ~14.5k: generates tasks from product task templates.
│   ├── description-template-engine.ts Templated descriptions for generated tasks.
│   ├── assignment-rule-engine.ts Evaluates task intake assignment rules.
│   ├── ai-assistant.ts        OpenAI KB-aware chat with conversation history.
│   ├── recurringTaskService.ts Background: spawns recurring task instances.
│   ├── proposalReminderService.ts Background: sends proposal reminders.
│   ├── longRunningTimerService.ts Background: alerts/auto-stops stale timers.
│   ├── weeklyHoursCheckService.ts Background: alerts on low weekly hours.
│   ├── permissionAuditService.ts Logs every permission change.
│   ├── oneOnOneMeetingService.ts HR 1-on-1 meeting lifecycle + calendar sync.
│   ├── seed-description-templates.ts One-off seeders (run via tsx).
│   ├── seed-intake-questions.ts
│   ├── proposalRoutes.ts      ~75k: proposals sub-router (signing, payment, webhooks).
│   ├── testGoogleCalendar.ts  Dev-only harness.
│   ├── debug-storage.js       Scratch; can ignore.
│   │
│   ├── services/              Domain services (preferred pattern for new work).
│   │   ├── leadConversionService.ts  Transactional idempotent lead→client converter.
│   │   ├── onboardingSpawnService.ts Spawns checklists on staff create.
│   │   ├── onboardingLmsSyncService.ts Auto-completes checklist items from LMS.
│   │   ├── onboardingNotificationService.ts Day-unlock + behind-schedule alerts.
│   │   ├── hiredNotificationService.ts Processes scheduled_hired_emails queue.
│   │   └── assetDefaultsSeeder.ts Seeds default asset types/statuses.
│   ├── lib/
│   │   └── roles-permissions-csv.ts CSV import/export for bulk role mgmt.
│   └── migrations/
│       └── migrate-permissions.ts Script to migrate legacy permission keys.
│
├── shared/                    Imported by both sides via @shared/*.
│   ├── schema.ts              232 pgTable defs + insert Zod schemas + exported TS types.
│   ├── constants.ts           JOB_APPLICATION_STAGES and other enums.
│   ├── permission-templates.ts ~64k: canonical permission catalog (dot-notation keys).
│   ├── role-templates.ts      Role presets (Admin/Manager/User/Accounting).
│   ├── widget-permissions.ts  Per-widget access rules for dashboards.
│   └── utils/
│       ├── csvExport.ts       Shared CSV generator.
│       └── healthAnalysis.ts  Client health score computation.
│
├── migrations/                Drizzle-kit output.
│   ├── 0000_peaceful_monster_badoon.sql  Initial schema snapshot.
│   └── meta/                  Drizzle snapshots + journal.
│
├── scripts/
│   ├── build.sh               Full prod build (frontend + dist/index.js + appWorker + prodEntry).
│   ├── post-merge.sh          Git post-merge hook (see .replit [postMerge]).
│   ├── migrate-prod-time-entries.ts Migrates legacy tasks.time_entries jsonb → table.
│   └── migrate-prod-time-entries.sql
│
├── docs/                      Existing + new (see "Documentation" below).
│
└── <root-level noise>         login-page.png, cookies.txt, fix-syntax.tmp,
                               test-sync.js, test_import*.csv — safe to ignore.
```

---

## Pages (`client/src/pages/`)

**Public (unauthenticated) pages:** `landing`, `privacy-policy`, `terms-of-use`, `pricing`, `login`, `forgot-password`, `reset-password`, `careers`, `public-booking`, `booking-embed`, `public-survey`, `public-ticket-form`, `public-proposal`, `sign-offer`, `client-onboarding`, `client-portal/login`, `client-portal/dashboard`, all of `solutions/*`.

**Authenticated app pages:**
- **Home / activity:** `dashboard`, `notifications`, `help-support`
- **CRM:** `clients`, `client-detail`, `enhanced-client-detail` (primary), `enhanced-client-detail-clean` (simplified variant), `leads`, `lead-detail`, `sales` (pipeline/board), `invoices`
- **Work:** `tasks`, `task-detail`, `task-templates`, `workflows`, `workflow-builder`, `reports`
- **Calendar:** `calendar`, `calendar-main`, `calendar-edit`, `calendar-settings`, `onboarding`
- **Campaigns / social:** `campaigns`, `social-media`
- **Forms:** `form-builder`, `survey-builder`, `forms-test`
- **HR:** `hr`, `applicant-detail`, `hr/OnboardingChecklist` (employee view), `hr/OnboardingDashboard` (manager view)
- **Knowledge / training:** `knowledge-base`, `article-view`, `training/*` (course/lesson CRUD + analytics)
- **Tickets:** `tickets`, `ticket-detail`, `ticket-reports`
- **Ops:** `call-center`
- **Settings:** 25 sub-pages under `settings/` — business-profile, my-profile, staff, staff-detail, team-detail, roles-permissions, integrations, custom-fields (+ edit-folder), tags, products, audit-logs, permission-audit, tasks, automation-triggers, sales, ai-assistant, leads, tickets, clients, hr-settings, OnboardingTemplates, ICAgreementTemplates.

**Deprecated/legacy files that still exist** (leave alone unless cleaning up): `campaigns-old.tsx`, `leads-old.tsx`, `leads-broken.tsx`, `settings/custom-fields-broken.tsx`, `settings/staff-old.tsx`, `client-detail.tsx` (older version; `enhanced-client-detail.tsx` is primary).

---

## Data models (key tables)

`shared/schema.ts` has 232 tables. Below is the high-signal subset with approximate line numbers for navigation. Every table has `createdAt`; most have `updatedAt`. Primary keys default to UUIDs via `gen_random_uuid()`.

### People & access control

- **`users`** (~L40) — CRM user accounts. `id, firstName, lastName, email (unique), phone, role (Admin/Manager/User/Accounting), status, profileImage, signature, signatureEnabled, lastLogin`.
- **`authUsers`** — Separate auth credentials table (email/password hashes).
- **`staff`** (~L2385) — Employee records (distinct from `users`). UUID PK. `replitAuthSub` links to Replit OIDC. Fields: name, email, phone, roleId, address block, hireDate, startDate, department, position, managerId, birthdate, shirtSize, assignedCalendarId, emergency contact, `annualSalary` (admin-only), `fathomApiKey`, `timeOffPolicyId` (deprecated), `isActive`.
- **`salaryHistory`** — Salary change log, cascaded from staff.
- **`staffLinkedEmails`** — Secondary email aliases staff can receive at.
- **`departments`, `positions`, `positionKpis`, `teamPositions`, `positionDescriptionVersions`** — Org structure + KPI definitions.
- **`roles`, `permissions`, `userRoles`, `granularPermissions`** — RBAC. Dot-notation permission keys.
- **`permissionAuditLogs`, `permissionChangeHistory`** — Every permission change is logged.
- **`orgChartStructures`, `orgChartNodes`, `orgChartNodeAssignments`** — Interactive org chart.

### Clients & contacts

- **`clients`** (~L452) — Central client record. `id, name, email (unique), phone, company, position, status, contactType (lead/client), contactSource, address block, website, notes, tags, contactOwner, profileImage`, billing block (`invoicingContact, invoicingEmail, paymentTerms, upsideBonus`), **8 brief sections** (`briefBackground, briefObjectives, briefBrandInfo, briefAudienceInfo, briefProductsServices, briefCompetitors, briefMarketingTech, briefMiscellaneous`), resource URLs (`growthOsDashboard, storyBrand, styleGuide, googleDriveFolder, testingLog, cornerstoneBlueprint, customGpt`), DND flags (`dndAll, dndEmail, dndSms, dndCalls`), `groupId, roadmap, customFieldValues, followers, clientBrief, lastActivity, isArchived, onboardingToken, onboardingCompleted, onboardingProgress, onboardingCurrentStep, onboardingStartDate, onboardingWeekReleased`.
- **`clientContacts`** — Multiple contacts per client (firstName, lastName, email, phone, title, isPrimary, notes).
- **`clientNotes`** — Admin-locked notes. `isLocked` defaults true after create.
- **`clientTasks`, `clientAppointments`, `clientDocuments`, `clientTransactions`** — Legacy per-client collections.
- **`clientGroups`** — Folder grouping.
- **`clientRoadmapEntries`** — Monthly roadmap content, unique on (clientId, year, month).
- **`clientRoadmapComments`** — Threaded comments with @mentions.
- **`clientPortalUsers`** — Separate login credentials for the client portal.
- **`clientHealthScores`** — Health score snapshots.
- **`clientBriefSections`, `clientBriefValues`** — User-configurable brief sections (see replit.md for `default_template` behavior).
- **`clientAssets`, `clientAssetComments`, `assetTypes`, `assetStatuses`** — Client asset approval workflow with annotation.
- **`clientTeamAssignments`** — Staff-to-client team assignments.
- **`imageAnnotations`** — Annotation layer for approvals.
- **`customFields`, `customFieldFolders`, `customFieldFileUploads`** — User-defined fields. Types: text, multiline, email, phone, dropdown, dropdown_multiple, checkbox, radio, date, url, number, currency, file_upload, contact_card. Each field can have placeholderText + tooltipText.

### Products, quotes, billing

- **`products`, `productCategories`** — Product catalog.
- **`productBundles`, `bundleProducts`** — Bundles of products with quantities.
- **`productPackages`, `packageItems`** — Packages of bundles/products.
- **`clientProducts`, `clientBundles`, `clientPackages`** — What's purchased/assigned per client.
- **`productTaskTemplates`** — Maps products → task-generation templates.
- **`clientTaskGenerations`** — Idempotency log for generated tasks.
- **`clientRecurringConfig`** — Per-client recurring settings.
- **`quotes`** (~L302) — Also functions as **proposals** once sent. Key fields: `clientBudget` (client's monthly fee), `desiredMargin, totalCost, buildFee, oneTimeCost, monthlyCost, status` (draft → pending_approval → approved → sent → signed → completed → accepted/rejected), `publicToken, signedAt, signedByName, signedByEmail, signatureData, termsAccepted, termsVersionId, paymentMethod, paymentIntentId, paymentStatus, paidAt, paidAmount, billingMode` (trial/immediate), `stripeSubscriptionId, subscriptionStatus, stripeCustomerId, customAgreement, expiresAt, viewCount, reminderCount`.
- **`quoteItems`** — Line items; one of `productId/bundleId/packageId` is set based on `itemType`. `customQuantities` jsonb for bundle overrides.
- **`salesSettings`** — Global settings; key field `minimumMarginThreshold` (default 35%).
- **`salesTargets`** — Monthly revenue target, unique on (year, month).
- **`capacitySettings`** — Predictive hiring thresholds per department/role.
- **`proposals`, `proposalTerms`** — Proposal templates + terms versioning.
- **`invoices`** (~L1227) — Legacy invoicing entity.
- **`stripeIntegrations`** — Per-deployment Stripe keys (encrypted).

### Leads & pipeline

- **`leads`** (~L812) — `name, email, phone, company, source, status (Open/Lost/Won/Abandon), stageId, value, probability (0-100), notes, assignedTo, lastContactDate, customFieldData, stageHistory, tags, projectedCloseDate, isConverted, convertedAt, clientId, convertedBy`.
- **`leadPipelineStages`** — User-configurable pipeline stages.
- **`leadStageTransitions`** — Every stage move logged (for pipeline analytics).
- **`leadSources`** — Configurable source options.
- **`leadNotes`, `leadAppointments`, `leadNoteTemplates`** — Lead activity.
- **`salesActivities`** — Typed: appointment, pitch, demo, follow_up, proposal_sent. Scheduled/completed timestamps.
- **`deals`** (~L873) — Won opportunities; carries `mrr`, `isRecurring`, `contractTerm`, `startDate`, `endDate`.
- **`smartLists`** — Saved filters across clients/tasks (personal/shared/universal visibility).
- **`roundRobinTracking`** — Round-robin lead assignment state.

### Tasks & time

- **`tasks`** (~L912) — Primary tasks table. Rich fields: `title, description, status (todo/in_progress/completed/cancelled), priority (urgent/high/normal/low), categoryId, workflowId, assignedTo, clientId, projectId, leadId, campaignId, dueDate, startDate, dueTime, timeEstimate` (minutes), `timeTracked` (SECONDS since 2026-04-23; **DEPRECATED column**, reads/writes go to `taskTimeEntries` — see inline comment at L929). **Hierarchy:** `parentTaskId, level (0-5), taskPath` ("/root/sub1/sub2"), `hasSubTasks`. **Recurring:** `isRecurring, recurringInterval, recurringUnit, recurringEndType, recurringEndDate, recurringEndOccurrences, createIfOverdue`. **Client portal:** `visibleToClient, requiresClientApproval, clientApprovalStatus, clientApprovalNotes, clientApprovalDate`. **Integrations:** `fathomRecordingUrl, calendarEventId, oneOnOneMeetingId`. Plus `tags, statusHistory, completedAt, onboardingWeek, sourceTemplateId, generationId`.
- **`taskTimeEntries`** — Normalized one-row-per-timer-entry; canonical source of truth for time tracked.
- **`taskDependencies`** — Blocking/related task relationships.
- **`taskActivities`** — Activity feed per task.
- **`taskComments`, `taskCommentReactions`, `commentFiles`** — Threaded comments with emoji + attachments.
- **`taskAttachments`** — File attachments.
- **`taskStatuses`, `taskPriorities`, `taskCategories`, `taskSettings`** — Configurable option lists.
- **`teamWorkflows`, `teamWorkflowStatuses`** — Custom per-category workflows (board columns).
- **`taskTemplates`** — Saved task scaffolding.
- **`enhancedTasks`** (~L1978) — Legacy richer tasks table (being migrated away from).
- **`taskHistory`** — Immutable change log.
- **`taskIntakeForms, taskIntakeSections, taskIntakeQuestions, taskIntakeOptions, taskIntakeLogicRules, taskIntakeAssignmentRules, taskIntakeSubmissions, taskIntakeAnswers`** — Task intake form builder + conditional logic + auto-assignment.
- **`callCenterTimeEntries`** — Clock-in/out for call center staff.
- **`eventTimeEntries`** — Time entries bound to calendar events.

### HR

- **`timeOffPolicies, timeOffTypes, timeOffRequests, timeOffRequestDays, timeOffBalances`** — Time-off system (types-based; policies are legacy).
- **`jobOpenings`** — Posted roles.
- **`jobApplications`** (~L1144) — Candidate records; stage enum from `shared/constants.ts:JOB_APPLICATION_STAGES`.
- **`applicationStageHistory, jobApplicationComments, jobApplicationWatchers`** — Applicant collaboration.
- **`jobApplicationFormConfig`** — Branding + form fields for public `/careers` page.
- **`jobOffers, offerSignatures, offerStatusLog, icAgreementTemplates`** — IC agreement / offer letter flow with typed/drawn signature.
- **`scheduledHiredEmails`** — Queued welcome emails for Hired applicants; drained by `hiredNotificationService`.
- **`newHireOnboardingFormConfig, newHireOnboardingSubmissions`** — New-hire intake form.
- **`expenseReportFormConfig, expenseReportSubmissions`** — Expense reports.
- **`offboardingFormConfig, offboardingSubmissions`** — Offboarding.
- **`onboardingTemplates, onboardingTemplateItems, onboardingInstances, onboardingInstanceItems`** — New-hire checklist template + per-hire instances.
- **`oneOnOneMeetings, oneOnOneTalkingPoints, oneOnOneWins, oneOnOneObjectives, oneOnOneActionItems, oneOnOneGoals, oneOnOneComments, oneOnOneMeetingKpiStatuses, oneOnOneProgressionStatuses`** — 1-on-1 meeting system.
- **`pxMeetings, pxMeetingAttendees`** — PX collaborative team meetings.
- **`staffIncidents`** — Staff incident log.

### Projects, campaigns, invoices, social

- **`projects`** (~L661), **`campaigns`** (~L675), **`invoices`** (~L1227) — Core delivery entities.
- **`socialMediaAccounts, socialMediaPosts, socialMediaTemplates, socialMediaAnalytics`** — Social scheduling + analytics.

### Communication & templates

- **`emailTemplates, smsTemplates, templateFolders`** — Templates with merge tags.
- **`scheduledEmails`** — Queued outbound emails.
- **`notifications, notificationSettings`** — In-app bell icon notifications + @mention routing.
- **`emailIntegrations, smsIntegrations, calendarIntegrations, aiIntegrations, stripeIntegrations, slackWorkspaces, goHighLevelIntegration`** — All integrations store encrypted credentials.
- **`aiAssistantSettings`** — Custom instructions for the OpenAI assistant.

### Calendars & availability

- **`calendars, calendarStaff, calendarAvailability, calendarDateOverrides, calendarAppointments, appointmentReminders`** — Public booking calendars (per-staff availability, round-robin, overrides).
- **`appointments, leadAppointments, clientAppointments`** — Appointment records for different entity types.
- **`calendarConnections, calendarSyncState, calendarEvents, calendarEventCache`** — Google Calendar two-way sync state + caching.

### Workflows & automation

- **`workflows, workflowExecutions, workflowActionAnalytics, workflowTemplates`** — API-driven workflow engine.
- **`automationTriggers, automationActions`** — Trigger/action catalog.

### Knowledge base, training, surveys, forms, tickets

- **`knowledgeBaseCategories, knowledgeBaseArticles, knowledgeBaseArticleVersions, knowledgeBasePermissions, knowledgeBaseBookmarks, knowledgeBaseLikes, knowledgeBaseComments, knowledgeBaseViews, knowledgeBaseSettings`** — Notion-style KB with RBAC + versioning + search.
- **`trainingCategories, trainingCourses, trainingModules, trainingLessons, trainingEnrollments, trainingProgress, trainingCoursePermissions, trainingQuizzes, trainingQuizQuestions, trainingQuizAttempts, trainingAssignments, trainingAssignmentSubmissions, trainingDiscussions, trainingDiscussionLikes, trainingLessonResources`** — Internal LMS.
- **`surveys, surveyFolders, surveySlides, surveyFields, surveyLogicRules, surveySubmissions, surveySubmissionAnswers`** — Surveys with conditional logic.
- **`forms, formFields, formSubmissions, formFolders`** — Generic form builder.
- **`customForms, customFormFields, customFormSubmissions`** — Ticket-intake custom forms (public embeds).
- **`tickets, ticketComments, ticketAttachments, ticketRoutingRules`** — Internal ticketing with routing rules + Kanban.
- **`clientOnboardingFormConfig`** — Steps + branding for `/client-onboarding/:token`.

### Misc

- **`dashboards, dashboardWidgets, userDashboardWidgets, userViewPreferences`** — Multi-dashboard system with per-user column widths/visibility.
- **`stickyNotes`** — Floating sticky notes widget.
- **`toolDirectoryCategories, toolDirectoryTools`** — Internal tools directory.
- **`auditLogs`** — General-purpose audit trail.
- **`activities, notes, appointments, documents`** — Generic per-entity activity/artifact tables.
- **`sessions`** — Postgres session store (connect-pg-simple).

---

## API routes

All routes live in `server/routes.ts` inside a single `registerRoutes(app)` function (~988 endpoints). Mounted under `/api/*`. Below is the breakdown by top-level resource (counts are GET+POST+PUT+PATCH+DELETE combined):

| Resource | Count | Notes |
|---|---|---|
| `clients` | 80 | Largest surface — notes, contacts, tasks, appts, documents, health, assets, roadmap, products, briefs. |
| `hr` | 52 | Time off, 1-on-1, applications, stages, watchers, onboarding, offers. |
| `integrations` | 48 | Mailgun/Stripe/Twilio/Slack/Google/AI connect/disconnect/test + key update. |
| `training` | 45 | Courses, modules, lessons, quizzes, enrollments, progress, assignments, discussions. |
| `tasks` | 28 | List, CRUD, sub-tasks, time entries, comments, activities, dependencies, templates. |
| `surveys` | 23 | CRUD + slides/fields/logic/submissions. |
| `knowledge-base` | 23 | Articles, categories, comments, views, bookmarks, versions. |
| `staff` | 20 | CRUD + salary + linked emails + incidents. |
| `tickets` | 13 | CRUD + comments + attachments + routing + Kanban moves. |
| `task-intake-forms` / `task-intake` | 26 (13 + 13) | Form builder + submissions. |
| `px-meetings` | 13 | PX meetings + attendees. |
| `client-portal` | 12 | Public-portal auth + task/asset endpoints. |
| `auth` | 12 | Login, logout, register, password reset, session. |
| `reports` | 11 | Sales pipeline, sales reps, team workload, call center, time tracked. |
| `public` | 11 | Public proposal, onboarding, signing, booking, ticket-form endpoints. |
| `leads` | 11 | CRUD + notes + appointments + convert. |
| `call-center` | 11 | Clock in/out, entries, summaries. |
| `onboarding-templates` / `onboarding` | 18 (10 + 8) | New-hire checklist template + instance + logo/file upload. |
| `custom-forms` | 10 | Ticket intake form builder + public submit. |
| `workflows` / `webhooks` | 18 (9 + 9) | Workflow CRUD + Stripe / integration webhooks. |
| `org-chart-structures` / `org-chart-nodes` / `org-structure` | 16 (9 + 6 + 1) | |
| `forms` | 9 | Generic form builder. |
| `tool-directory` | 8 | |
| `team-positions` / `positions` / `departments` | 24 | Org hierarchy. |
| `quotes` | 8 | Plus the larger **proposal** flow lives inside `proposalRoutes.ts`. |
| `product-task-templates` | 8 | |
| `product-packages` / `product-bundles` / `products` | 19 | Catalog CRUD. |
| `team-workflows` | 7 | Board columns. |
| `task-templates` | 7 | |
| `settings` | 7 | General settings. |
| `notifications` | 7 | List, mark read, etc. |
| `job-openings` | 7 | |
| `dashboards` | 7 | Multi-dashboard CRUD. |
| `calendars` | 7 | Booking calendar CRUD. |
| `admin` | 7 | Super-admin utilities (impersonation etc.). |
| `roles` / `permissions` / `user-roles` / `user-permissions` / `user-granular-permissions` | ~15 | RBAC management. |
| `lead-sources` / `lead-note-templates` / `lead-pipeline-stages` | ~15 | |
| `ic-agreement-templates` | 6 | |
| `custom-fields` / `custom-field-folders` | 12 | |
| `automation-triggers` / `automation-actions` | ~12 | |
| `google-calendar` / `google-calendar-events` | ~10 | Two-way sync. |
| ... | | Tail: capacity, business-profile, business-timezone, appointments, assets, annotations, tags, client-brief-sections, survey-images, profile-images, search, health, test. |

**Public (unauthenticated) endpoints** live under `/api/public/*`, `/api/webhooks/*`, plus `/sign-offer/:token`, `/public-proposal/:token`, `/client-onboarding/:token`, `/client-portal/*`, `/careers`, `/public-booking/:slug`. The server also exposes `/health`, `/api/health`, `/_health` (via `prodEntry.js`).

**Webhook endpoints of note:**
- `POST /api/stripe/webhook` and `POST /api/webhooks/stripe` — both supported paths; the handler is async and uses `constructWebhookEvent`.
- `/api/webhooks/mailgun/*` — email bounce/delivery.
- `/api/webhooks/slack/*` — Slack interactions.
- `/api/webhooks/twilio/*` — SMS/voice status callbacks.

---

## External services & integrations

All API keys for these are stored **encrypted in Postgres** (see `server/encryption.ts`); env-var fallback exists. Admins manage them via **Settings → Integrations**.

| Service | Module(s) | Purpose |
|---|---|---|
| **Neon Postgres** | `server/db.ts` | Primary database. `DATABASE_URL` required. |
| **Replit Object Storage (GCS)** | `server/objectStorage.ts`, `server/objectAcl.ts` | File uploads (avatars, docs, assets, branding logos). Bucket defined in `.replit`. |
| **Replit OIDC** | `server/replitAuth.ts` | SSO login via `openid-client`. |
| **Google OAuth** | `server/googleAuth.ts` | Email sign-in with Google. |
| **Google Calendar** | 13 files named `server/googleCalendar*.ts` | Per-user two-way sync, availability blocking, incremental sync, appointment integration, contact creation, OAuth. |
| **Stripe** | `server/stripe.ts`, `server/proposalRoutes.ts` | Proposal payments (card + ACH), subscriptions for recurring monthly fees, webhooks. Per-deployment config. |
| **Mailgun** | `server/notification-service.ts` | Transactional + template email. Key is encrypted in DB; `NotificationService.reinitializeIntegrations()` called after save. |
| **Twilio** | `server/notification-service.ts` + `@twilio/voice-sdk` client-side | SMS sending + browser-based VoIP calling. |
| **Slack** | `server/slack-service.ts`, `@slack/web-api` | Workflow actions + @mentions + channel posts. Zapier-like integration. |
| **OpenAI** | `server/ai-assistant.ts` | KB-indexed chat assistant with conversation history + source citations. |
| **Fathom** | `server/fathomService.ts` | Fetch recording URLs for meetings, attached to tasks. |
| **Notion** | `@notionhq/client` in `package.json` | Currently pulled in but not wired to a visible surface in the route map — grep before assuming usage. |

**Google Calendar file guide (the 13 files):**
- `googleCalendar.ts` — Core client.
- `googleCalendarOAuth.ts`, `googleCalendarOAuthRoutes.ts` — OAuth exchange.
- `googleCalendarSetup.ts` — `setupGoogleCalendar(app)` bootstrap.
- `googleCalendarSync.ts`, `googleCalendarTwoWaySync.ts`, `googleCalendarIncrementalSync.ts`, `googleCalendarBackgroundSync.ts` — Sync variants.
- `googleCalendarAvailability.ts` — Free/busy blocking for booking.
- `googleCalendarAppointmentIntegration.ts` — Map appointments ↔ calendar events.
- `googleCalendarContactCreation.ts` — Auto-create client records from attendees.
- `googleCalendarCreateEvent.ts` — Event creation + 1-on-1 meeting events.
- `googleCalendarDisplay.ts`, `googleCalendarEventsEndpoint.ts`, `googleCalendarUtils.ts` — Read-side + utilities.

---

## Key architectural decisions (inferred)

1. **Monorepo, no workspaces.** Single `package.json` at root, no `pnpm-workspace.yaml` or yarn workspaces. `client/`, `server/`, `shared/` share one `node_modules`. Simple, but bundle hygiene depends on path aliases alone.

2. **Schema-first, not migration-first, in dev.** `shared/schema.ts` is the source of truth; `drizzle-kit push` diffs the schema against the live DB. Only one generated SQL migration lives in `migrations/`. Production drift is patched by idempotent `ALTER TABLE ... IF NOT EXISTS` blocks run on boot in `server/index.ts` (`ensureClientBriefColumns`, `ensureDefaultTemplateColumn`, `refreshJobApplicationStatusTriggerOptions`, `initializeDefaultAutomationTriggers`).

3. **Storage-facade pattern.** All server routes call `appStorage.xxx()` (from `server/storage.ts`), not Drizzle directly. This gives a single place to insert cross-cutting logic (activity logging, permission stripping for salary data, custom-field sync from contact fields back to core client columns). When adding a new DB query, extend this facade unless it's a one-off and small.

4. **One giant `routes.ts`.** There's precedent for splitting (e.g., `proposalRoutes.ts` is separate), but the pattern is not consistently applied. New routes are typically appended to `routes.ts`. Grep by resource before writing; it probably exists.

5. **Typed-contract-by-Zod-generation.** `drizzle-zod`'s `createInsertSchema(table).omit({...}).extend({...})` produces server-side validators that match the DB schema; TypeScript types flow via `typeof table.$inferSelect`. Client components import those types through `@shared/schema`.

6. **Permissions are dot-notation + legacy-translation.** Keys like `settings.leads.manage` are current; older keys like `settings.view_general_settings` are translated by a map in `client/src/hooks/use-has-permission.ts`. UI gates: `<RequirePermission permission="...">` and `<PermissionGate>`. Server middleware mirrors this.

7. **Secrets-in-DB first, env-var fallback.** Pattern: `getXAsync()` reads from DB integration row → decrypts → returns client. Env var is tried only if no DB row exists. This is why Settings → Integrations can reconfigure live without a redeploy.

8. **Two-process production topology.** `prodEntry.js` listens on `PORT` (80/5000), spawns `appWorker.js` on `PORT+1`, proxies when worker is ready, otherwise returns a 3-second auto-refresh HTML stub. If worker crashes, it's respawned after 2s. The consequence: **`npm run build` alone does NOT rebuild the worker** — you must run `bash scripts/build.sh` before any prod deploy that changes server code.

9. **Background services run in-process, not as a separate worker.** `recurringTaskService`, `proposalReminderService`, `longRunningTimerService`, `weeklyHoursCheckService`, `onboardingNotificationService`, `hiredNotificationService`, `googleCalendarBackgroundSync` — all set up timers inside `initializeApp()`. No queue system (BullMQ/Redis) — a restart resets timers; idempotency is handled at the logical level (e.g., `clientTaskGenerations` tracks what's already been generated; `scheduledHiredEmails` uses an atomic claim pattern).

10. **Quotes ARE proposals.** Not a separate `proposals` table; the `quotes` table carries the full proposal lifecycle (public token, signing, Stripe payment, subscription state). There IS a `proposals` table but it's for proposal templates, not active proposal instances. Vocabulary is overloaded — read carefully.

11. **Rich-text editor proliferation.** Tiptap (primary), Slate, and React-Quill all ship. Different components use different editors based on when they were written. Don't assume a single editor — match whatever the surrounding component uses.

12. **Object storage is abstracted.** `server/objectStorage.ts` wraps both local Replit Object Storage and GCS-compatible APIs; Uppy is used client-side with the AWS-S3 strategy because Replit Object Storage exposes an S3-compatible endpoint. Path-based ACLs live in `objectAcl.ts`.

13. **`attached_assets/` is a living paste-in.** Screenshots, Replit logs, CSV samples. Treated as scratch by the team. Not gitignored, but not load-bearing.

14. **`dist/` is committed.** Because `.replit` sets `build = ["echo", "pre-built"]`, Replit uses whatever's in `dist/` at publish time. The build script must be run locally-or-CI before pushing for deploy.

15. **No automated tests.** No Vitest, Jest, Playwright. QA is manual, tracked in `docs/qa/*.md`. `test-sync.js` and `test_import*.csv` are scratch, not a suite. `npm run check` (tsc) is the only automated verification.

---

## Documentation

The existing `docs/` folder is human-written (feature docs, QA, guides):

```
docs/
├── README.md                        Master index.
├── AGENCYBOOST-FEATURES.md          Full feature catalog.
├── guides/                          HOW-TO-BULK-MANAGE-ROLES-PERMISSIONS.md, PERMISSIONS-GUIDE.md.
├── modules/sales/                   Sales module breakdown.
├── modules/tasks/                   Tasks module breakdown.
├── qa/                              Sales_QA_Items.md, Sales_QA_Results.md, Tasks_QA_Items.md.
└── technical/                       Development-Status, MULTI_TENANT_AWS_DEPLOYMENT_PLAN, twilio-voip-setup.
```

The new Claude-facing planning files being added in this session (sibling to `docs/README.md`):

```
docs/
├── PLANNING_CONTEXT.md              Current priorities / constraints / pain points (placeholder).
├── plans/_TEMPLATE.md               Plan template (Goal, Context, Affected Files, Approach, Risks, …).
└── decisions/_TEMPLATE.md           Decision-record template (Date, Decision, Context, Alternatives, …).
```

---

## Navigating the mega-files

When you need to touch `server/routes.ts`, `server/storage.ts`, or `shared/schema.ts`, **do not read them linearly**. Instead:

1. `grep -n "resourceName" server/routes.ts` to find your endpoint block.
2. `grep -n "^export const fooTable" shared/schema.ts` to jump to a table.
3. Use `sed -n 'a,bp'` or `Read` with `offset` + `limit`.
4. Related tables are usually grouped (clients near client-*, tasks near task-*, training* together), but not alphabetized.

Companion files when hunting a feature:
- **Data model?** → `shared/schema.ts`
- **Server endpoint?** → `server/routes.ts` (grep `app.METHOD("/api/...")`)
- **Server DB logic?** → `server/storage.ts` (grep `async getFoo` / `createFoo`)
- **Client page?** → `client/src/pages/*.tsx`
- **Client reusable UI?** → `client/src/components/**`
- **Permission gate?** → `shared/permission-templates.ts` + `client/src/hooks/use-has-permission.ts`
- **Feature narrative / history?** → `replit.md`
