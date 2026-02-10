# AgencyBoost CRM - Complete Feature Documentation

*Last updated: February 10, 2026*

AgencyBoost is a comprehensive CRM platform built specifically for marketing agencies. It brings together client management, sales, project tracking, HR operations, automation, and communication tools into a single, modern interface. This document covers every feature, integration, and functionality available in the platform.

---

## Table of Contents

1. [Dashboard & Navigation](#1-dashboard--navigation)
2. [Client Management](#2-client-management)
3. [Sales & Quotes](#3-sales--quotes)
4. [Lead Management](#4-lead-management)
5. [Task Management](#5-task-management)
6. [Campaigns](#6-campaigns)
7. [Invoices](#7-invoices)
8. [Calendar & Scheduling](#8-calendar--scheduling)
9. [Communication](#9-communication)
10. [Automation & Workflows](#10-automation--workflows)
11. [HR / People Experience (PX)](#11-hr--people-experience-px)
12. [Training](#12-training)
13. [Knowledge Base](#13-knowledge-base)
14. [AI Assistant](#14-ai-assistant)
15. [Reports & Analytics](#15-reports--analytics)
16. [Tool Directory](#16-tool-directory)
17. [Notifications](#17-notifications)
18. [Global Search](#18-global-search)
19. [Settings & Administration](#19-settings--administration)
20. [Integrations](#20-integrations)
21. [User Roles & Permissions](#21-user-roles--permissions)

---

## 1. Dashboard & Navigation

### Multi-Dashboard System
- Create multiple named dashboards, each with its own set of widgets
- Tab-based navigation to switch between dashboards
- Management dialog to rename, reorder, or delete dashboards
- The default dashboard is always pinned in the first position

### Dashboard Widgets
Customizable drag-and-drop widgets organized into categories:

- **Activity & Alerts**: My Mentions, System Alerts
- **HR & Team**: Pending Time Off Requests, Who's Off Today/This Week, New Job Applications, Onboarding Queue, Pending Expense Reports, Team Capacity Alerts, Team Birthday/Anniversary Calendar, Training Completion Status
- **Calendar & Appointments**: Today's Appointments, Upcoming Appointments, Appointment No-Shows, Overdue Appointments
- **Custom Data Widgets**: Real-time data from clients, tasks, leads, sales, and more

### Dark / Light Mode
- Toggle between dark and light themes
- Preferences saved to localStorage and persist across sessions
- Automatically detects system preference on first visit

### Responsive Design
- Mobile-first layout using a responsive sidebar
- 3-column layouts on desktop, collapsible on smaller screens
- Intelligent tab overflow menus that adapt to screen size

---

## 2. Client Management

### Client Profiles
- Full client profiles with company information, contacts, and billing details
- Customizable column views so each user can see the data most relevant to them
- Bulk actions: delete, update status, add/remove tags, add to workflows, export
- CSV import/export for bulk data management
- Custom fields for additional data tracking

### Client Team Assignment
- Drag-and-drop interface to assign staff members to client accounts
- Visual team roster on each client profile

### Client Health Scoring
- Weekly health scores with customizable date ranges
- Four scoring dimensions: Goals (Above/On Track/Below), Fulfillment (Early/On Time/Behind), Relationship (Engaged/Passive/Disengaged), Client Actions (Early/Up to Date/Late)
- Weekly Recap, Opportunities, and Solutions text fields for context
- Historical health score tracking with date range and status filters
- Paginated score history

### Asset Approval Workflow
- Upload client assets (images, documents, designs) for review
- Collaborative annotation tools to mark up assets with feedback
- Approval/rejection workflow with status tracking

### Billing Information
- Store and manage client billing details
- Integration with quotes and invoices

### Smart Lists
- Create filtered views of clients based on custom criteria
- Save and name lists for quick access
- Share lists with specific team members
- Ownership controls (only creators can delete)

### Communication History
- Full audit trail of all emails, SMS messages, and phone calls per client
- Sender/agent name displayed on each entry for accountability
- Recent Activity tab showing chronological interactions

---

## 3. Sales & Quotes

### Pipeline Management
- Visual pipeline view with customizable stages
- Deal tracking with value, probability, and expected close date
- Pipeline analytics and reporting

### Quotes
- Modern table-based quote layout with sortable columns
- Inline status updates (Draft, Sent, Accepted, Rejected)
- Low margin highlighting when quotes fall below the configured threshold
- Pagination for large quote lists
- Action buttons for quick operations

### Quote-to-Client Product Transfer
- When a quote is accepted, products and bundles are automatically transferred to the client's product list
- No manual re-entry needed

### Sales Targets
- Set monthly revenue targets
- Track progress against targets in real time

### Sales Settings
- Configurable minimum margin threshold for quotes
- Commission settings

---

## 4. Lead Management

### Lead Tracking
- Full lead profiles with contact information, source, and status
- Customizable pipeline stages
- Conversion tracking from lead to client

### Lead Sources
- Fully customizable lead source options (e.g., Website, Referral, Social Media, etc.)
- Managed through Settings > Leads

### VoIP Calling
- Browser-based calling powered by Twilio
- Click-to-call directly from lead profiles
- Call logging with duration and notes
- Multiple phone numbers supported

---

## 5. Task Management

### Task List & Views
- Table view with sortable, resizable columns
- Column visibility and width preferences saved per user (drag-to-resize)
- Filtering by status, priority, assignee, category, tags, and more
- Bulk actions: update status, reassign, delete, add tags

### Task Detail
- Rich task editing with status, priority, due date, assignee, and description
- Activity log tracking all changes
- Threaded comments with @mentions and emoji picker
- File attachments

### Sub-Tasks & Dependencies
- Hierarchical sub-task structure (tasks can have child tasks)
- Task dependencies to enforce order of completion
- Dynamic project progress calculated from sub-task completion

### Task Intake Form
- Section-based, wizard-style form for creating new tasks
- 23 sections covering Task Basics, Department Selection (Creative/DevOps/Data), and department-specific sub-sections
- 111 questions with 180 answer options
- 5 trigger questions that drive conditional visibility (department, creative_type, devops_type, data_type, priority_level)
- Conditional section/question visibility using JSON rules
- Auto-generated task descriptions from intake answers using a template engine with `{{variable}}`, `{{#if}}`, and `{{#each}}` syntax
- Configurable in Settings > Tasks > Intake Form

### Assignment Rules
- Automatic task routing based on intake form answers
- Rules evaluate conditions against answers (supports array/multi-select, equals, contains, in operators)
- Role-based assignment maps positions to staff members
- Catch-all rules for unmatched conditions
- Priority ordering (lower number = higher priority)
- Categories and tags auto-applied based on rules
- Configured in Settings > Tasks > Assignment Rules

### Recurring Tasks
- Set any task (including personal tasks) to repeat automatically
- Repeat interval: every X days, weeks, or months
- Three frequency options:
  1. **No End Date** — repeats indefinitely
  2. **After X Occurrences** — stops after a set number of repeats
  3. **End on Specific Date** — stops on a chosen date
- On-demand generation: the next occurrence is created when the current one is completed, not bulk-generated upfront

### Time Tracking
- Global timer accessible from any page
- Start/stop/pause timer on any task
- Manual time entry
- Timesheet view showing hours by day, week, or custom range
- Admins and managers can edit time entries for any user in the "All Users" view
- Clickable time cells with hover pencil icon for quick editing

---

## 6. Campaigns

### Campaign Management
- Create and manage marketing campaigns
- Associate campaigns with clients
- Track campaign status and progress

---

## 7. Invoices

### Invoice Management
- Create and send invoices to clients
- Track invoice status (Draft, Sent, Paid, Overdue)
- Associate invoices with clients and projects
- Line items with quantities, rates, and totals
- Invoice history and payment tracking

---

## 8. Calendar & Scheduling

### Internal Calendar
- Built-in AgencyBoost calendar for scheduling meetings, appointments, and events
- Default calendars for Anniversaries and Birthdays (auto-generated from staff records)
- Event creation with title, date, time, duration, and attendees

### Google Calendar Integration
- Per-user OAuth 2.0 connection to Google Calendar
- Two-way sync: changes in AgencyBoost reflect in Google Calendar and vice versa
- Incremental sync for efficiency (only syncs changes since last sync)
- Background sync running automatically every 2 minutes
- Contact creation from calendar attendees
- Availability blocking
- Sync preferences and event caching

### Business Timezone
- Account-level timezone setting ensures all date calculations are consistent
- Timezone-aware helper functions used across the app
- Lightweight API endpoint and React hook for frontend access

---

## 9. Communication

### Email
- Email templates with dynamic merge tags (e.g., `{{client_name}}`, `{{today_date}}`)
- Send emails directly from client profiles
- Powered by Mailgun integration
- Communication history logged per client

### SMS
- SMS messaging powered by Twilio
- Send from client or lead profiles
- Dynamic merge tags support
- Delivery tracking

### VoIP Calling
- Browser-based phone calls via Twilio
- Click-to-call from lead and client profiles
- Call recording and duration logging
- Multiple Twilio phone numbers can be configured

### Smart Lists
- Segment clients based on filters for targeted communication
- Use lists for bulk email or SMS campaigns

### Document Management
- Upload and attach documents to clients, tasks, and projects
- Inline media display for images, PDFs, and other file types
- Voice recording capability

### Notes
- Add internal notes to clients, leads, and tasks
- Notes are visible to authorized team members

---

## 10. Automation & Workflows

### Workflow Engine
- GoHighLevel-style automation builder
- Database-backed, API-driven workflow engine
- 25+ trigger definitions and 13+ action types
- Conditional evaluation with variable interpolation
- Visual workflow builder interface

### Trigger Types
Workflows can be triggered by events such as:
- Client created, updated, or deleted
- Lead status changed
- Task completed or status changed
- Form submitted
- Calendar event created
- Time-based triggers
- Slack events (message received, reaction added, bot mentioned, channel created)

### Action Types
Available actions include:
- Send email or SMS
- Create task
- Update client or lead fields
- Add/remove tags
- Move pipeline stage
- Slack actions (send message, send DM, add reaction, create channel, set topic, create reminder)
- Wait/delay
- Conditional branching

### Slack Integration
- Full Zapier-like Slack support
- 6 action types: Send Message, Send DM, Add Reaction, Create Channel, Set Topic, Create Reminder
- 4 trigger types: Message Received, Reaction Added, Bot Mentioned, Channel Created
- Uses Slack Events API webhook with signature verification
- Configured in Settings > Integrations

---

## 11. HR / People Experience (PX)

The PX section provides comprehensive human resources management. Tabs appear in this order: Dashboard, Staff Directory, Org Chart, 1v1 Meetings, Meetings, Time Off, Who's Off, Approvals, Job Openings, Applications, Onboarding Submissions, Expense Report, Expense Submissions, Offboarding Form, Offboarding Submissions, Reports.

### Dashboard
- Overview metrics for managers and admins
- Quick access to pending actions

### Staff Directory
- Complete team roster with profiles
- Filterable by department, position, and status
- Visible to all users (no role restrictions)

### Organization Chart
- Interactive org chart built with ReactFlow
- Dagre layout algorithm for automatic positioning
- Department color-coding for visual grouping
- Search functionality to locate team members
- Position-only structure builder for planning

### 1v1 Meetings
- Manager-to-staff one-on-one meeting tracker
- Meeting recording links
- Position-specific KPI tracking with performance metrics
- Two-tab navigation within each meeting
- Private notes for sensitive discussions
- Internal calendar integration, with optional Google Calendar sync
- **On-demand recurring**: When the current meeting is finished, the next occurrence is automatically created. Meetings are not bulk-generated in advance.
- **Delete series**: Option to delete a single meeting or the entire recurring series

### 1v1 Performance Reports
- Aggregated KPI performance across all 1v1 meetings
- Filtering, search, and sorting
- Role-based access control

### PX Meetings (Team Meetings)
- Team meeting feature for managers and admins
- 5 customizable segments:
  1. What's Working / KPIs
  2. Sales Opportunities
  3. Areas of Opportunities
  4. Action Plan
  5. Action Items
- Multi-attendee support
- Meeting recording links
- Recurring meetings: weekly, biweekly, or monthly with optional end date
- **On-demand recurring**: Next meeting instance is only created when the current one is finished
- **Push-to-next**: Generates the next meeting on-demand if it doesn't exist yet
- Start/Finish timer to track actual meeting duration
- Convert action items directly into tasks
- **Filters**: Current/Past filter (defaults to Current), My Meetings filter, client filter, tag filter, search
- **Pagination**: 10 meetings per page with navigation controls
- **Delete series**: Option to delete a single meeting or the entire recurring series
- Standardized duration options: 15 min, 30 min, 45 min, 1 hour, 1.5 hours, 2 hours

### Time Off Management
- Submit time off requests with type, dates, and reason
- Simplified global time off types (configured in Settings > PX Settings)
- Customizable time off policies
- Manager/admin approval workflow
- Time Off Calendar ("Who's Off") showing who is out on any given day

### Job Openings & Applications
- Create job openings with descriptions and requirements
- Application forms for candidates
- Application review and status tracking
- Watchers can follow specific applications

### Onboarding
- Onboarding form submissions from new hires
- Track onboarding progress

### Offboarding
- Offboarding form builder and submission tracking
- Manage offboarding checklist and documentation

### Expense Reports
- Staff can submit expense reports
- Configurable form fields for expense details
- Manager/admin review and approval of submissions
- Expense Submissions view for reviewing all submitted reports

### Predictive Hiring Alerts
- Staffing capacity prediction based on current workload
- Configurable alert thresholds
- Proactive notifications when hiring may be needed

---

## 12. Training

### Course Management
- Create training courses with structured lessons
- Organize courses by topic and department
- Course detail pages with lesson listings and progress tracking

### Lesson Management
- Create, edit, and manage individual lessons within courses
- Rich content editor for lesson material
- Lesson ordering and sequencing

### Training Analytics
- Track course completion rates and progress
- View analytics on team training engagement
- Identify knowledge gaps and training needs

### Permissions
- Role-based access control for training content
- Permission module: `training` with view and manage actions

---

## 13. Knowledge Base

### Notion-like Article Platform
- Create and organize articles into categories with hierarchy
- Rich text editor for content creation
- Draft/Published workflow with version history
- Auto-generated sticky Table of Contents for long articles
- Breadcrumb navigation for easy orientation
- Related articles suggestions

### Search
- Enhanced search across all articles
- Keyword matching with relevance ranking

### Permissions
- Role-based access control per category and per article
- Category-level and article-level permission modals
- Restrict visibility by role or specific users

---

## 14. AI Assistant

### OpenAI-Powered Chat Widget
- Floating chat interface in the bottom-right corner of the application
- Indexes Knowledge Base content (SOPs, Playbooks, internal documentation)
- Provides quick answers to team questions based on your organization's content
- Keyword-based article search
- Conversation history maintained during the session
- Source citations linking back to the original Knowledge Base articles
- Configured in Settings > AI Assistant

---

## 15. Reports & Analytics

### Sales Reports
- **Pipeline Report**: Visual breakdown of deals by stage, value, and probability
- **Sales Rep Report**: Individual performance metrics per sales representative
- Date range filtering for all reports

### Timesheet Reports
- Hours tracked by user, client, and category
- Daily, weekly, and custom date range views
- Role-based access (admins/managers can view all users)
- Export capabilities

### Team Workload Reports
- Comprehensive analytics showing staff workload distribution
- Identify over- and under-utilized team members
- Capacity planning data

### 1v1 Performance Reports
- Aggregated KPI data from one-on-one meetings
- Track performance trends over time
- Filter by team member, department, or date range

---

## 16. Tool Directory

### Internal Tool Listings
- Directory of tools and resources used by the agency
- Searchable catalog
- Quick access links

---

## 17. Notifications

### Notification System
- Database-backed notification system
- Bell icon in the header showing unread notification count
- @mention detection in comments and notes
- Notification settings panel to customize preferences
- My Mentions dashboard widget

---

## 18. Global Search

### Intelligent Cross-Module Search
- Search across clients, leads, and tasks from a single search bar
- Debounced input for performance
- Real-time results as you type
- Type-specific icons to distinguish result types (client, lead, task)
- Direct navigation to the selected result

---

## 19. Settings & Administration

The Settings section contains 18 configuration areas, each with its own dedicated page. Access to each area is controlled by granular permissions.

### 19.1 Business Profile
- Upload and manage company logo
- Edit basic company information (name, email, phone, website)
- Manage address information
- This information is used across the platform (e.g., in email templates, invoices)

### 19.2 My Profile
- Update personal information (name, email, profile photo)
- Rich text email signature editor using TipTap with full HTML formatting support
- Personal preferences and notification settings

### 19.3 Staff
- View and manage all team members
- Add new staff members with role assignment
- Edit staff profiles, positions, and departments
- Deactivate or remove staff accounts
- Staff detail pages with comprehensive information

### 19.4 PX Settings
- **Time Off Types**: Create and manage time off categories (e.g., Vacation, Sick Leave, Personal Day)
- Simplified global types with customizable settings
- **Time Off Policies**: Configure accrual rules, carry-over limits, and approval requirements

### 19.5 Clients
- Configure client-related settings
- Manage client status options
- Client management preferences

### 19.6 Sales
- **Minimum Margin Threshold**: Set the minimum acceptable margin percentage for quotes. Quotes below this threshold are highlighted with a warning.
- Commission structure settings
- Sales calculation preferences

### 19.7 Leads
- **Lead Source Options**: Fully customizable list of lead sources (e.g., Website, Referral, Cold Call, Social Media, Partner, Event)
- Add, edit, or remove lead sources
- These options appear in lead creation forms throughout the platform

### 19.8 Roles & Permissions
- **Create Custom Roles**: Define new roles beyond the defaults (Admin, Manager, User, Accounting)
- **Granular Permission Assignment**: Toggle individual permissions on/off for each role
- Permissions organized by module (13 modules: clients, sales, tasks, leads, campaigns, workflows, calendar, hr, training, knowledge_base, reports, settings)
- Each permission follows the hierarchical format: `module.tab.action` (e.g., `clients.list.view`, `tasks.templates.manage`)
- Role templates provide pre-configured defaults
- Admin role automatically receives all permissions

### 19.9 Permission Audit
- Track all permission changes with timestamps
- View role assignment history
- Audit who changed what permissions and when
- Essential for compliance and security oversight

### 19.10 Calendar Settings
- Configure calendar availability for booking
- Set working hours and blocked time slots
- Booking page configuration

### 19.11 Integrations
Four integration categories, each with connect/disconnect, configure, and test capabilities:

- **Google Calendar**: OAuth 2.0 connection for two-way calendar sync. Per-user setup with sync preferences.
- **Twilio SMS & VoIP**: Configure Twilio credentials for SMS messaging and browser-based phone calls. Manage multiple phone numbers. Test connection.
- **Slack**: Connect to Slack workspace for automation triggers and actions. Configure bot permissions and channel access.
- **Mailgun**: Set up Mailgun for transactional email delivery. Configure sending domain and API credentials. Test email delivery.

### 19.12 AI Assistant
- Configure the AI Assistant's knowledge base indexing
- Teach the assistant about your agency's specific setup, processes, and terminology
- Control which Knowledge Base articles are indexed
- Test the assistant's responses

### 19.13 Custom Fields
- Create custom data fields for clients, leads, and other entities
- Supported field types: text, number, date, dropdown, multi-select, checkbox
- Fields appear automatically in the relevant forms and profiles

### 19.14 Tags
- Create and manage system-wide tags
- Tags can be applied to clients, tasks, leads, and other entities
- Color coding for visual organization
- Synced between task-level tags and system-level tags

### 19.15 Products
- **Product Catalog**: Create and manage your products and services
- Set pricing, descriptions, and categories
- **Product Bundles**: Group products together into bundles (collection-based architecture)
- Bundle pricing and configuration
- Products used in quotes and client accounts

### 19.16 Tasks
Six configuration tabs:

- **Statuses**: Define custom task statuses (e.g., Open, In Progress, Review, Completed)
- **Priorities**: Configure priority levels (e.g., Low, Medium, High, Urgent)
- **Categories**: Create task categories for organization
- **Workflows**: Define task workflow rules and transitions
- **Intake Form**: Full intake form builder with sections, questions, answer options, conditional visibility rules, description templates, and drag-and-drop ordering
- **Assignment Rules**: Configure automatic task assignment based on intake form answers. Set conditions, role-based routing, priority ordering, and auto-tagging.

### 19.17 Workflows (Automation Triggers)
- View and manage all automation trigger definitions
- Configure which events can start workflows
- Enable/disable specific triggers
- See which workflows use each trigger

### 19.18 Audit Logs
- Complete system activity trail
- Track all user actions: logins, data changes, permission modifications, deletions
- Filterable by user, action type, and date range
- Essential for accountability and compliance

---

## 20. Integrations

AgencyBoost connects with the following external services:

### Google OAuth 2.0
- Primary authentication method
- Secure login with Google accounts
- Multi-user support with automatic migration from previous auth systems

### Google Calendar
- Per-user OAuth 2.0 connection
- Two-way event sync with incremental updates
- Background sync every 2 minutes
- Contact creation from calendar attendees
- Event caching for performance

### Twilio
- **SMS**: Send and receive text messages from client/lead profiles
- **VoIP**: Browser-based phone calls with click-to-call
- Multiple phone number management
- Call logging and recording

### Slack
- Workspace connection via OAuth
- 6 automation action types (Send Message, Send DM, Add Reaction, Create Channel, Set Topic, Create Reminder)
- 4 automation trigger types (Message Received, Reaction Added, Bot Mentioned, Channel Created)
- Slack Events API webhook with signature verification

### Mailgun
- Transactional email delivery
- Custom sending domain configuration
- Email template support with merge tags
- Delivery status tracking

### OpenAI
- Powers the AI Assistant chat widget
- Indexes Knowledge Base content for intelligent Q&A
- Conversation history and source citations

---

## 21. User Roles & Permissions

### Default Roles
- **Admin**: Full access to all features and settings. Automatically bypasses all permission checks.
- **Manager**: Team oversight with access to reports, approvals, and team management. Can manage meetings, time off approvals, and view team data.
- **User**: Standard access for day-to-day operations. Can manage their own tasks, time entries, and personal data.
- **Accounting**: Financial access for invoicing, expense reports, and sales data.

### Permission Architecture
- **13 permission modules**: clients, sales, tasks, leads, campaigns, workflows, calendar, hr, training, knowledge_base, reports, settings
- **Hierarchical format**: `module.tab.action` (e.g., `reports.sales.export`, `hr.px_meetings.view`)
- **Three enforcement levels**:
  1. **Module-level**: Controls access to entire pages/sections
  2. **Tab/section-level**: Controls visibility of tabs within a module
  3. **Action-level**: Controls specific actions like edit, delete, export
- Custom roles can be created with any combination of permissions
- Permission changes are tracked in the Permission Audit log
- Bulk import/export of permissions via CSV

### Per-User View Customization
- Each user can customize which columns they see in table views
- Column widths are saved per user
- Preferences persist across sessions

---

## Appendix: Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TanStack Query, Wouter |
| UI Components | Radix UI, shadcn/ui, Tailwind CSS, Lucide React |
| Forms | React Hook Form, Zod validation |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Authentication | Google OAuth 2.0 |
| File Storage | Object Storage (cloud-based) |
| Email | Mailgun |
| SMS/Voice | Twilio |
| Chat/Automation | Slack API |
| AI | OpenAI API |
| Calendar | Google Calendar API |
| Rich Text | TipTap Editor |
| Org Chart | ReactFlow with Dagre layout |
| Date Utilities | date-fns |

---

*This document is maintained alongside the AgencyBoost codebase. For technical implementation details, see the [Technical Documentation](technical/) folder. For step-by-step guides, see the [Guides](guides/) folder.*
