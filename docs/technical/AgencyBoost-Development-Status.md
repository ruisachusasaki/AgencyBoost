# Agency Boost Platform Development
**Project Sponsor:** Joe Hupp  
**Date:** March 2026 (Updated)

---

## 1. Current Problem(s) or Situation

The current operational setup relies on fragmented tools, creating scalability issues and inefficiencies for managing a growing client base.

- **Core Issue (Internal):** Lack of a scalable, centralized internal management tool and CRM capable of supporting a growing client base (10+ clients). The current system lacks centralized note-taking and management capabilities.
- **Operational Bottleneck:** Reliance on manual processes and external, separate platforms (ClickUp, GoHighLevel) creates friction in workflows (e.g., managing tasks and client data across two separate systems).
- **Technical Challenge:** The current staging environment (Replit) is not suitable for high-volume production use, requiring a robust plan for long-term data storage (Audit Logs, 1v1 notes) to prevent system slowdowns.

---

## 2. Project Description & Goals

This project involves developing the internal AgencyBoost platform to serve as a centralized CRM, task management system, and knowledge base, with a secondary goal of making it a paid product for other agencies.

### A. Project Description (Solution Summary)

The project requires the new developer (Rui) to take over and build out core features for internal operational support and transition the platform to a production-ready environment. Functionality needs to be flexible enough to support external, white-labeled agency users.

### B. Key Goals and Success Metrics

| Business Objective | Goal / Requirement | Metric |
|---|---|---|
| Primary Goal (Internal) | Create a single tool that replaces the functionalities of ClickUp and serves as the primary CRM. | Milestone: All Media Optimizer employees use AgencyBoost for 1v1 notes and tasks, ceasing use of ClickUp. |
| Secondary Goal (External) | Build the functionality to support hundreds of external, paying agency users (White-Labeling). | Metric: Sub-account management and payment processes implemented (similar to GoHighLevel). |
| Data Integrity | Develop a strategy for long-term storage of high-volume data (Audit Logs, 1v1 notes). | Deliverable: Storage solution (e.g., AWS S3 or dedicated database) implemented and functional for records over 90 days. |
| Integration | Complete critical integrations to centralize operations. | Deliverable: Full Google Calendar/Gmail integration and External Task Creation API built. |

---

## 3. Project's Implementation Phases

The phases are currently focused on transitioning development and establishing the production environment.

| Phase | Duration (Estimated) | Objective |
|---|---|---|
| Phase 1: Transition & Scoping | 1 Week | Rui to review all current functionality and Joe to finish scoping remaining tasks. |
| Phase 2: Core Feature Delivery | 15 weeks | Implement key features like Google Integration, Sub-Account Management, and Long-Term Data Storage. |
| Phase 3: Production Build-Out | 2-3 weeks | Establish the production environment (likely AWS) and define the Staging/Production deployment pipeline. |
| Phase 4: Cleanup & Launch | 2 weeks | Purge legacy ClickUp tasks and formally launch the AgencyBoost platform internally. |

---

## 4. Milestone(s) for each Phase

### Phase Milestones & Deliverables

**Phase 1 Milestone (Transition):**
- Deliverable (Joe): Complete Loom video walkthrough of the platform and finalize scoping for all open tasks. **DONE**

**Phase 2 Milestone (Core Feature Delivery):**
- Deliverable (Rui): Implement key features like Google Integration, Sub-Account Management, and Long-Term Data Storage. ClickUp Task.

**Phase 3 Milestone (Production Build-Out):**
- Deliverable (Rui): Provide initial assessment/plan for pushing the platform to production.
- Deliverable: Defined Staging and Production environments; API built to support external task creation (Airtable/Carpe Diem).

**Phase Milestones (General Deliverables):**
- Full Sub-Account Management UI developed.
- ~~AI Chatbot (OpenAI) integrated for quick brand/client FAQ access.~~ **DONE** - AI Assistant with Knowledge Base indexing implemented.
- Permissions logic fully defined and functional across all user roles.

---

## 5. Key Risks

| Title | Impact | Description |
|---|---|---|
| Long-Term Data Storage | High | Failure to implement scalable storage for 1v1 and Audit Logs could lead to system slowdowns. |
| Pricing/Tiering Structure | High | Need to define pricing tiers and usage limits (e.g., Mailgun/Twilio usage) for external sub-accounts. |
| Permissions Logic Failure | High | Permissions logic (Manager vs. PM access) must be fully verified and corrected before launch. |

---

## 6. Completed Features (Since Original Document)

The following features have been implemented and are working:

| Feature | Status | Notes |
|---|---|---|
| AI Assistant / Chatbot | **DONE** | OpenAI-powered with Knowledge Base indexing, floating chat widget |
| Slack Integration | **DONE** | 6 actions (Send Message, Send DM, Add Reaction, Create Channel, Set Topic, Create Reminder) + 3 triggers (Message Received, Reaction Added, Channel Created) |
| Google Calendar Integration | **DONE** | Two-way sync, per-user OAuth, event caching, sync preferences |
| Workflow Automation System | **DONE** | Zapier-like engine with 25+ triggers and 13+ action types |
| SMS to Clients | **DONE** | Twilio-based SMS from client detail page |
| VoIP / Browser Calling | **DONE** | Twilio Voice SDK integration for leads |
| Twilio Settings | **DONE** | Configuration available in Settings > Integrations |
| Offboarding Submissions | **DONE** | Filters (Status, Time Frame), Submitted By column, pagination |
| Task Dependencies UI | **DONE** | Task dependency icons and configuration components |
| Knowledge Base | **DONE** | Notion-like with categories, RBAC, version history, ToC |
| IC Agreement & Job Offers | **DONE** | Template builder, send offer flow, public signing page, offer status tracking |
| Lead-to-Client Conversion Service | **DONE** | Shared `convertLeadToClient()` service with transactional, idempotent conversion |
| Client Onboarding Form | **DONE** | Multi-step configurable form, custom fields, token-based public access |
| Stripe DB-backed Integration | **DONE** | Async DB-backed functions (`getStripeAsync`, etc.), dual webhook URLs, fully async webhook handler |
| Task Generation from Bundles/Packages | **DONE** | Engine expands bundles and packages to find product-level task mapping templates |

---

## 7. Remaining Tasks / Open Issues

### Required for V1

| Task | Priority | Status |
|---|---|---|
| Sub-Account Management | High | Not Started |
| Long-Term Data Storage (Audit Logs, 1v1 Notes > 90 days) | High | Not Started |
| Multi Organization Testing (F2) | High | Not Started |
| Production Build-Out (AWS migration) | High | Not Started |
| Mobile Responsive - Everything | High | Partial |
| API to create EXTERNAL tasks in AgencyBoost | Medium | Not Started |

### Required but Not Clear

| Task | Notes |
|---|---|
| Fathom Integration + Automation | Automate 1v1 Meeting Recordings Storage |
| AI Tab for Clients (F2) | Scope unclear |
| Client Portal | Scope unclear |
| Google Console migration (@MO -> @bootstrap) | Configuration task |
| Have company logo show up on external URLs | Branding |

### Bug Fixes / Issues Still Outstanding

| Issue | Area | Status |
|---|---|---|
| Production database missing quantity column | Bundle products display - requires republish | Open |
| Permissions logic needs verification | Manager vs PM access levels | Open |
| Payment flow race condition on Thank You page | Proposals — stale refetch overriding webhook state | **Fixed** |
| Signed PDF merge tags not resolving | Proposals — quote item names missing | **Fixed** |
| Client custom field sync to core columns | Client Management — email/phone/name out of sync | **Fixed** |
| Business Profile stale data after save | Settings — query cache not invalidated | **Fixed** |
| Subscription using wrong cost field | Proposals — was using `monthlyCost` instead of `clientBudget` | **Fixed** |

---

## 8. Estimated Monthly Costs

| Service Component | Path | Estimated Monthly Cost (USD) |
|---|---|---|
| *To be determined* | | |
| **TOTAL ESTIMATED MONTHLY COST** | | |

---

## 9. Notes

- **Design Choice:** Startup sequence has server listen first, then migrations run in background (fixes Cloud Run health checks)
- **Design Choice:** Slack triggers/actions use category "integration" (singular) for UI consistency
- **Design Choice:** Offboarding form uses Popover+Calendar date pickers storing yyyy-MM-dd format
- **UX Preference:** Bulk action checkboxes should be square, task completion checkboxes should be circular
- **Color Scheme:** Primary teal theme color (`hsl(179, 100%, 39%)` / `#00C9C6`) throughout all features
- **Architecture Decision:** All Stripe calls migrated to async DB-backed functions for consistency and reliability
- **Architecture Decision:** Mailgun API key uses EncryptionService for secure storage and decryption at initialization
- **Architecture Decision:** Customer ID resolution prioritizes payment intent's customer over stored quote customer to handle edge cases
- **Architecture Decision:** Task generation engine recursively expands bundles and packages to resolve product-level task mappings

---

*Last Updated: March 2026*
