# AgencyBoost CRM System

## Overview
AgencyBoost is a comprehensive CRM system designed for marketing agencies. Its primary purpose is to enhance operational efficiency and oversight across various agency functions. Key capabilities include streamlined management of clients, projects, campaigns, leads, tasks, and invoices. The system incorporates features such as client asset approval workflows, robust automation, detailed sales reporting, and a responsive user interface to support agency growth and productivity.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.
UX Organization: Project Templates integrated as tabs under Projects section rather than separate navigation.
Checkbox Design: Bulk action checkboxes should be square, task completion checkboxes should be circular.
Filter Preferences: Simplified filtering with only essential filters (search and department, not position) for time off reports.
Settings Organization: Removed Settings > Support section (old ticketing system feature no longer needed).
Color Scheme Consistency: ALWAYS maintain the primary teal theme color (`hsl(179, 100%, 39%)` / `#00C9C6`) throughout ALL features. Replace any blue buttons, accents, or styling with the primary theme color to ensure visual consistency across the entire application.
Super Admin: Joe Hupp is the super admin with full access to all features including all staff compensation data. In dev environment: joe@themediaoptimizers.com. In production/live environment: joe@boostmode.com.
Salary/Compensation: All admins can view and edit salary data for any staff member (no hierarchy restriction). Salary data is hidden from non-admin users across all API endpoints.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API.
- **Database**: PostgreSQL with Drizzle ORM.

### UI/UX Decisions
- Responsive design leveraging Radix UI, shadcn/ui, and Tailwind CSS.
- Dark/Light Mode with localStorage persistence and system preference detection.
- Component-scoped CSS using design system variables.

### Technical Implementations
- **Authentication & Authorization**: Replit OIDC Auth + email/password login, multi-user support, session management, and role-based access control (Admin, Manager, User, Accounting) with a hierarchical permission system. Permission keys use dot-notation format (e.g., `settings.staff.view`, `settings.leads.manage`). A migration map in `use-has-permission.ts` handles old-format keys (e.g., `settings.view_general_settings`) → new-format translation for backward compatibility. All 18 settings sub-routes in App.tsx use specific permission keys matching their corresponding tile in settings.tsx. The `RequirePermission` component always falls through to legacy permissions when granular permissions don't match.
- **Data Management**: Relational schema, standard CRUD operations, audit logs, sorting, pagination, CSV import/export, and custom fields with optional placeholder text and tooltip text (displayed as info icon with hover text on client detail page).
- **Google Calendar Integration**: Per-user two-way sync with Google Calendar API, including availability blocking and workflow triggers.
- **Business Timezone**: Account-level timezone setting.
- **Business Profile**: Account-level business settings with query cache invalidation after save to prevent stale data display.
- **Task Management**: Hierarchical sub-tasks, scheduling, dependencies, recurring tasks, bulk actions. Features a section-based task intake form, templated description generation, and automatic assignment. Product-to-task mapping supports automated task generation on lead conversion, with a robust task generation engine handling variable interpolation (including custom field merge tags), quantity modes, and idempotency. Task generation engine now expands bundles and packages to find product-level task mapping templates. Merge tags in task mapping templates are searchable and include both native fields (8) and all custom fields from Settings > Custom Fields.
- **Communication**: Smart Lists, Email/SMS, Twilio-based VoIP calling, document management, notes, calendar, and unified templating. **Mailgun Integration**: API key stored encrypted; `EncryptionService.decrypt()` used before initialization. `reinitializeIntegrations()` method on NotificationService, called after Mailgun settings save.
- **Stripe Integration**: Admins can enter/update Stripe API keys (Secret Key, Publishable Key, Webhook Secret) directly from Settings > Integrations UI. Keys are encrypted and stored in `stripe_integrations` table. Falls back to environment variables if no DB config exists. Supports connect, disconnect, test connection, and key update flows. All Stripe calls use async DB-backed functions: `getStripeAsync()`, `isStripeConfiguredAsync()`, `getStripePublishableKey()`, `getStripeWebhookSecret()`. Both webhook URLs supported: `/api/stripe/webhook` and `/api/webhooks/stripe`. Webhook handler is fully async with `constructWebhookEvent`.
- **Automation System**: API-driven, database-backed workflow engine supporting triggers, actions, conditional evaluation, and variable interpolation, including Zapier-like Slack integration.
- **Client Management**: Team assignment, health scoring, asset approval workflows with annotation, customizable views, billing, and bulk actions. **Client Custom Field Sync**: When Email, Phone, First Name, or Last Name custom fields are updated in the Contact tab, values sync back to core `clients` table columns (`email`, `phone`, `name`), ensuring consistency across client list, proposals, and all other views.
- **HR Features**: Time off requests, job application forms, expense reports, 1-on-1 meeting tracker, performance reports, interactive organization chart, and New Hire Onboarding Checklists (template builder with drag-and-drop day/item management, KB article and training course linking, spawn service for auto-creating checklists on staff creation, new hire view under HR > Onboarding Checklist tab with day-by-day checklist, progress tracking, circular checkboxes, day unlock logic for calendar/completion modes, optimistic UI updates, manager dashboard under HR > Onboarding with stats cards, filterable table, detail drawer with item toggle and status management, LMS auto-sync that auto-completes training_course checklist items when the linked course is completed in the LMS, background notification service with daily day-unlock alerts and behind-schedule manager alerts with configurable settings under HR Settings > Onboarding Alerts tab, and completed checklist archive on staff profile page with read-only detail dialog). Includes PX Meetings for collaborative team meetings. **IC Agreement & Job Offers**: IC agreement template builder under HR Settings with rich text editor, placeholder toolbar (9 dynamic fields), and active template management. Send Offer flow: selecting "Send Offer" status on an applicant opens a modal (compensation, type, start date, custom terms), creates a job offer with server-side placeholder population, generates signing token, and emails the signing link. Public signing page at `/sign-offer/:token` with typed/drawn signature support and decline option. OfferStatusPanel in applicant sidebar shows offer status, signing link, resend, and timeline. All public sign/decline operations are transactional. Tables: `ic_agreement_templates`, `job_offers`, `offer_signatures`, `offer_status_log`. Application stages: `send_offer`, `offer_accepted`, `offer_declined`, `hired`.
- **Sales Reports**: Pipeline and Sales Rep Reports with date range filtering.
- **Onboarding Contracting & Payment (Quotes as Proposals)**: Quotes function as proposals. Upon "sent" status, a public link is generated and emailed to clients for review, digital signing, and payment (Stripe via CardElement or ACH). A Stripe webhook handles payment confirmation, triggering lead-to-client conversion, deal creation, product transfer, onboarding task generation, and **client onboarding token generation**. Proposal branding is customizable. **Dynamic Billing**: Build Fee is a user-editable field on the quote form (`quotes.build_fee` column) — the sales rep enters the retail build fee directly (e.g., $10,000). If set, it overrides calculated one-time costs as the `oneTimeCost`. Monthly Fee (clientBudget — the client's monthly fee, NOT `monthlyCost` which is internal fulfillment cost) set up as Stripe Subscription. Sales rep selects billing mode when sending: "trial" (30-day trial before monthly billing) or "immediate" (first month charged with build fee). Webhook creates subscription after build fee payment succeeds. Customer ID prioritizes payment intent's customer over stored quote customer. Public proposal shows clear breakdown of build fee vs monthly fee with billing mode explanation. Subscription lifecycle tracked via `stripeSubscriptionId`, `subscriptionStatus`, and `stripeCustomerId` on the quotes table. **Payment Flow**: Race condition fixed — Thank You page no longer overridden by stale refetch when webhook hasn't processed yet. Thank You page text: "Start Your Onboarding" button, "Next Step" heading. **Signed PDF**: Merge tags fully replaced using client and business data lookups. Quote item names resolved via product/bundle/package table joins (no `name` field on `quoteItems`).
- **Client Onboarding Form**: Configurable multi-step onboarding form for new clients. Settings > Clients > "Client Onboarding Form" tab with Form Fields and Branding & Style sub-tabs. Form fields are pulled from Custom Fields (Settings > Custom Fields), organized into drag-and-drop steps with required/optional toggle. Public multi-step form at `/client-onboarding/:token` with progress stepper (like Proposal interface). Submitted values map directly to client's `customFieldValues` in the database. Schema: `client_onboarding_form_config` table (steps jsonb, branding jsonb). Clients table has `onboarding_token` and `onboarding_completed` columns. Token auto-generated during quote fulfillment. Proposal Thank You page shows "Start Your Onboarding" button (under "Next Step" heading) linking to the form.
- **Sales Settings**: Dynamic minimum margin threshold configuration for quotes. Proposal email template customization (subject line, header, greeting, intro text, 3 steps, button text, closing text) with merge tags (`{{clientName}}`, `{{proposalName}}`) and live preview under Settings > Sales > Email Template tab.
- **Custom Service Agreement**: Per-quote custom agreement support. By default, all quotes use the global Terms & Conditions from Settings > Sales. In the Edit Quote dialog, a "Use Custom Agreement" button opens a rich text editor pre-loaded with the default terms. Custom agreements are stored in `quotes.custom_agreement` and used on the public proposal/signup page instead of the default when present. Merge tags work in custom agreements.
- **Quotes Management**: Table-based layout with sortable columns (One-Time Cost, Monthly Cost separated), inline status updates, and low margin highlighting.
- **Lead Management**: Customizable lead source options.
- **Product Packages**: Allows creating packages of bundles and individual products with configurable quantities, including build fees, monthly retail prices, and profit margin calculations.
- **Quote to Client Products Transfer**: Automatic transfer of accepted quote products/bundles/packages to the client. Shared `convertLeadToClient(leadId, triggeredBy, options?)` service in `server/services/leadConversionService.ts` provides transactional, idempotent lead-to-client conversion with full quote item migration. Supports triggers: `'online_proposal'`, `'manual'`, `'ach_signing'`. Leads schema tracks conversion state: `isConverted`, `convertedAt`, `clientId`, `convertedBy`.
- **Job Application Form**: Configurable public careers page at `/careers`. Settings > HR Settings > "Job Application Form" tab with two sub-tabs: Form Fields (drag-and-drop field editor) and Branding & Style (company logo, primary color, page text, apply button text, success messages, "Why Work With Us" section with 3 customizable benefits). Branding stored as jsonb in `job_application_form_config` table. The public careers page dynamically renders using saved branding settings. Logo upload reuses the onboarding logo upload endpoint.
- **Predictive Hiring Alerts**: Staffing capacity prediction with configurable alerts.
- **Team Workload Reports**: Analytics for staff workload.
- **Activity & Comments**: Global timer, activity logging, and a threaded comments system with @mentions and emoji picker.
- **Time Entry Editing**: Admins and managers can edit time entries.
- **Long-Running Timer Alerts**: Background service for timers exceeding a threshold.
- **Weekly Hours System Alerts**: Background service notifies managers/admins if team members log fewer than a configurable threshold of hours weekly.
- **File & Media**: Advanced uploads, inline display, voice recording, secure object storage, and collaborative annotation.
- **Knowledge Base**: Notion-like platform with categories, hierarchy, RBAC, search, draft/published workflow, version history, and auto-generated Table of Contents.
- **AI Assistant**: OpenAI-powered chat widget indexing Knowledge Base content for quick answers with conversation history and source citations.
- **User Preferences**: Per-user view customization for column visibility and widths.
- **Notification System**: Database-backed system with bell icon and @mention detection.
- **User Profile Settings**: Rich text editor for email signatures.
- **Multi-Dashboard System**: Users can create multiple named dashboards with tab-based navigation.
- **Dashboard Widgets**: Customizable dashboards with drag-and-drop widget management and real-time data.
- **Global Search**: Intelligent search across clients, leads, and tasks.
- **Ticketing System**: Admin-only bug report and feature request tracking with CRUD, comments, status lifecycle, priority levels, type classification, response time analytics, screenshot uploads, Loom video field, automatic routing rules (with source-based matching), source tracking (`source` column — "AgencyBoost" for internal, form name for external), embeddable ticket intake forms (via Custom Forms system with field builder at Settings > Tickets > Forms tab), public ticket form page (`/public/ticket-form/:shortCode`), and Kanban view with drag-and-drop status updates.
- **Call Center Time Tracking**: Simplified clock-in/clock-out interface for call center staff, with client selection, weekly summaries, client switching, and a dedicated "Call Center Cost" report.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle Kit**: Database migration and schema management.

### UI and Styling
- **Radix UI**: Accessible headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **shadcn/ui**: Reusable UI components.

### Development Tools
- **Vite**: Build tool and development server.
- **ESBuild**: Fast JavaScript bundler.
- **TanStack Query**: Server state management.

### Form and Validation
- **React Hook Form**: Performant form library.
- **Zod**: TypeScript-first schema validation.
- **Hookform Resolvers**: Integration between React Hook Form and Zod.

### Date and Utility Libraries
- **Date-fns**: Date utility library.
- **Class Variance Authority**: Utility for component variants.
- **clsx**: Conditional className utility.

### Session Management
- **Connect PG Simple**: PostgreSQL session store for Express.
- **Express Session**: Session middleware.