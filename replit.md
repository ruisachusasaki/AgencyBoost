# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance. The project aims to provide a complete, modern CRM solution for marketing agencies, enhancing efficiency and operational oversight.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.
UX Organization: Project Templates integrated as tabs under Projects section rather than separate navigation (user feedback: "much better UX").
Checkbox Design: Bulk action checkboxes should be square, task completion checkboxes should be circular (implemented with custom CSS targeting).

## CSS Architecture Guidelines
**Problem**: Broad CSS selectors (like `* { border-radius: 50% !important }`) cause styling issues across unrelated components.
**Solution**: Component-scoped CSS with design system variables.
- Use CSS custom properties for consistent design tokens (--border-radius-sm, --border-radius-md, etc.)
- Target specific component containers (e.g., `.form-builder-container`)
- Avoid universal selectors (`*`) and overly broad rules
- Preserve semantic circular elements (checkboxes, avatars, badges)
- **Status**: Successfully implemented - Form Builder oval containers fixed (August 22, 2025)
- **Critical Bug Fixed**: Form field disappearing issue resolved - server logic now properly handles temporary field IDs when saving custom fields (August 22, 2025)
- **Best Practice**: Always scope CSS changes to specific component containers to prevent cross-contamination

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design.
- **Database**: PostgreSQL with Drizzle ORM.

### Key Features and Design Patterns
- **Data Models**: Comprehensive relational schema for Clients, Projects, Campaigns, Leads, Tasks, and Invoices.
- **Dynamic Project Progress**: Project completion is now calculated automatically based on task completion status. Progress is shown as "X of Y tasks completed" with visual progress bars. The manual progress field has been removed from project forms, and progress updates in real-time as tasks are marked completed. Both project listing and edit pages display live task-based progress calculations.
- **Authentication & Authorization**: Session-based authentication with role-based access control (Admin, Manager, User, Accounting) and granular permissions. Includes modern CRM roles like Sales Representative, Marketing Specialist, Customer Success, Operations, Sales Manager, Data Analyst, with comprehensive permission systems (action-based, data access levels, field-level security) and real-time validation. **Unified Staff-User System**: Notifications now reference staff members directly instead of maintaining separate user/staff tables, reflecting the CRM reality that all staff members are system users.
- **UI/UX**: Responsive sidebar navigation, mobile-first design, optimized 3-column layouts, Radix UI primitives, shadcn/ui components, and Tailwind CSS for styling. Includes enhanced visual design for elements like pipeline views.
- **Data Management**: Full CRUD operations for core entities, comprehensive audit logs, table sorting, pagination, CSV import/export.
- **Customization**: Custom Field Management with drag-and-drop reordering, and Marketing Template Management with WYSIWYG editor and dynamic merge tags.
- **Advanced Features**: Smart Lists for advanced filtering, enhanced Client Product Display for product/bundle management, comprehensive Email and SMS communication with DND system, Document Management with secure handling and object storage integration, Notes System, robust Calendar Management with staff assignment, filtering, and appointment scheduling, **Hierarchical Sub-Task System** with ClickUp-style functionality supporting up to 5 levels of task nesting, expandable/collapsible tree views, comprehensive task management with visual hierarchy indicators, proper progressive indentation (24px per level), breadcrumb navigation (TaskPath component), complete CRUD operations with proper parent-child relationships, and fully functional sub-task creation with form validation and proper inheritance of client/project from parent tasks, **Task Dependencies System** with comprehensive business rule enforcement supporting Finish to Start, Start to Start, Finish to Finish, and Start to Finish dependency types with real-time validation and user-friendly error messages. Features visual dependency icons in both Task Table and Kanban views: Warning triangle (amber) for Finish to Start, Git branch (green) for Start to Start, Target (orange) for Finish to Finish, and Rotate counter-clockwise (purple) for Start to Finish. Icons appear next to task names when dependencies exist and include detailed tooltips showing dependency type and related task information, **ClickUp-Style Recurring Task System** with full scheduling capabilities supporting Daily, Weekly, Monthly, and Yearly frequencies, multiple end conditions (Never, After # occurrences, On specific date), automatic generation of new task instances rather than reopening same task, **on-demand creation that generates the next task instance only when the previous task is completed** (preventing system overload for "never ending" recurring schedules), completion-triggered automation integrated into the task update endpoint, proper end condition enforcement, and scalable architecture that works efficiently for any recurring frequency, **Comprehensive Bulk Actions System** with checkboxes for task selection in table view, "Select All" functionality, and bulk toolbar with 5 operations: Delete (mass deletion with proper cleanup of dependencies and related data), Assignee (bulk reassignment to staff members), Status (bulk status updates), Due Date (bulk due date changes), and Priority (bulk priority updates). System includes proper permissions checking, error handling with partial success reporting, and audit logging for all bulk operations, and **Task Status Visibility Controls** with inline multi-select dropdown for showing/hiding completed and cancelled tasks, positioned next to search bar for optimal UI organization and preventing interface clutter as task volume grows.
- **Form Builder**: Drag-and-drop form builder with live preview, extensive styling controls, integration with custom fields, and folder navigation.
- **Data Integrity**: System designed to ensure data consistency, standardizing on staff table IDs and resolving storage layer issues. All core entities (Projects, Leads, Tasks, Invoices, Social Media, Workflows, Tags, SMS Templates) are persisted in PostgreSQL.
- **Unified Template System**: Email and SMS template systems are unified between Marketing and Client communication sections, using dynamic database-driven components.
- **Lead Management Enhancement**: Includes a rebuilt leads page with proper layout and overflow controls, comprehensive staff assignment system, and enhanced lead card interactions. Staff profile images are displayed on lead cards with fallback to initials.
- **Appointment Booking System**: Fully functional appointment booking for leads, integrated into the main calendar with visual differentiation, filtering capabilities, and complete CRUD operations for both lead and client appointments. Lead appointments display with purple badges and route to correct deletion endpoints.
- **Task Management System**: Complete task creation and management with comprehensive inline editing capabilities. Features include staff assignment dropdown, dual date handling (start date and due date), priority system with colored flag indicators (red=urgent, yellow=high, blue=normal, gray=low), time estimation and tracking with start/stop functionality, and database schema enhancements. All task detail fields support inline editing without requiring "Edit Task" button - users can directly modify status, assignee, dates, priority, time estimates, and descriptions with automatic saving. Enhanced 4-row structured layout with Icon, Label, Field format for optimal user experience. Task title supports direct inline editing with click-to-edit functionality, hover visual feedback, and keyboard shortcuts (Enter to save, Escape to cancel). Description field includes smart truncation with "Show more/Show less" functionality for long content, click-to-edit interface, and keyboard shortcuts (Escape to cancel, Ctrl+Enter to save).
- **Professional Task Table Interface**: ClickUp-style table view with hierarchical sub-task display, toggle functionality for expanding/collapsing nested tasks, comprehensive drag-and-drop column reordering (with Task Name column protected as first position), sortable columns with visual up/down arrows matching system design, and comprehensive task deletion with proper permission handling. Sub-tasks automatically inherit client and project information from parent tasks for consistency. Table features intelligent sorting for all data types (names, dates, priorities, staff assignments) with proper null value handling.
- **Global Timer System**: Professional-grade ClickUp-style timer with React Context state management, header bar indicator, and cross-navigation persistence. Timer survives page navigation and shows compact widget with pulsing icon, elapsed time display, clickable navigation to active task, and checkbox to stop timing. Backend persistence ensures timer recovery on app restart.
- **Activity Logging System**: Comprehensive task activity tracking with database persistence and visual timeline display. Automatically logs all task modifications including status changes, assignee assignments, date modifications, priority adjustments, time tracking updates, and **time estimate changes**. Features real-time activity feed with chronological ordering, user attribution, visual icons, and color-coded priority indicators. Activities are displayed in the task detail sidebar with proper formatting for dates, staff names, priority levels, and human-readable time estimates (e.g., "30 minutes", "2 hours", "1 hour 30 minutes").
- **Comments System with Threading**: Comprehensive commenting system with nested replies, @mention notifications with keyboard navigation (arrow keys and Enter selection), and threaded conversations. Comments support replies with visual differentiation, proper indentation, and maintain notification functionality for mentions in both top-level comments and replies. Emoji picker system uses React Portal for proper positioning and z-index handling, preventing clipping issues within card components.
- **Advanced File Upload and Media System**: Complete multimedia support for task comments including inline image display (JPG, PNG, WebP, GIF, SVG), browser-based voice recording using MediaRecorder API, file attachments with proper type detection, secure object storage integration with ACL policies, and database persistence with proper file associations. Images display as clickable thumbnails, audio files as downloadable attachments with icons, and documents with download functionality. Audio files feature inline HTML5 audio players with full browser controls for immediate playback without requiring downloads.
- **Image Annotation System**: Fully functional collaborative feedback system for uploaded images and PDFs with @mention functionality. Staff can click on any uploaded image or PDF to add, edit, or delete annotations with precise coordinate positioning. Features include real-time annotation display, complete CRUD operations via direct database queries, seamless frontend-backend integration, and support for both task attachments and comment files. The system uses an invisible overlay for PDF annotation clicking to handle iframe click event limitations. **@mention functionality with keyboard navigation (arrow keys and Enter selection) allows team members to be notified about specific annotations, with proper staff-to-users ID mapping for notification delivery**. Enables team collaboration on visual content like ad designs, mockups, creative assets, and document reviews. Database schema optimized to support annotations across multiple file sources without foreign key constraints.

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
```