# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance. The project aims to provide a complete, modern CRM solution for marketing agencies, enhancing efficiency and operational oversight with a focus on business vision and market potential.

## Recent Changes (August 27, 2025)
- **Knowledge Base System**: ✅ COMPLETED - Full-featured Knowledge Base with categorized articles, social interactions, and advanced content management
- **Category Management**: ✅ COMPLETED - Complete category creation system with hierarchical structure, custom icons, and color coding
- **Robust Icon Picker**: ✅ COMPLETED - Advanced icon selection interface with search functionality, categorized browsing, and visual grid display of all available Lucide React icons
- **Backend API Integration**: ✅ COMPLETED - Full REST API implementation for Knowledge Base with categories, articles, permissions, bookmarks, likes, comments, and views

## Previous Changes (January 27, 2025)
- **Client Team Assignment Feature**: ✅ COMPLETED - Successfully implemented comprehensive team assignment functionality with 10 specific positions (Setter, BDR, Account Manager, Media Buyer, CRO Specialist, Automation Specialist, Show Rate Specialist, Data Specialist, SEO Specialist, Social Media Specialist)
- **Profile Image Enhancement**: ✅ COMPLETED - Fixed profile image display to show actual profile images for all staff members by checking both profileImage and profileImagePath fields  
- **UX Improvements**: ✅ COMPLETED - Removed redundant "Current Team Members" section and increased main tab window height to 600px for optimal viewing of all positions
- **Database Integration**: ✅ COMPLETED - Created client_team_assignments table with proper foreign key relationships and constraints
- **Search Field Bug Fix**: ✅ COMPLETED - Fixed Settings > Staff > Staff Directory search field that only allowed typing one letter at a time by implementing debounced search (300ms delay) to prevent rapid API calls on every keystroke

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.
UX Organization: Project Templates integrated as tabs under Projects section rather than separate navigation.
Checkbox Design: Bulk action checkboxes should be square, task completion checkboxes should be circular.
Filter Preferences: Simplified filtering with only essential filters (search and department, not position) for time off reports.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design.
- **Database**: PostgreSQL with Drizzle ORM.

### Key Features and Design Patterns
- **Data Models**: Comprehensive relational schema for Clients, Projects, Campaigns, Leads, Tasks, and Invoices.
- **Dynamic Project Progress**: Project completion calculated automatically based on task completion status, displayed with progress bars.
- **Authentication & Authorization**: Session-based authentication with role-based access control (Admin, Manager, User, Accounting) and granular permissions (Sales Representative, Marketing Specialist, Customer Success, Operations, Sales Manager, Data Analyst). Unified staff-user system for notifications.
- **UI/UX**: Responsive sidebar navigation, mobile-first design, optimized 3-column layouts, Radix UI primitives, shadcn/ui components, and Tailwind CSS for styling. Includes enhanced visual design for elements like pipeline views.
- **Data Management**: Full CRUD operations for core entities, comprehensive audit logs, table sorting, pagination, CSV import/export.
- **Customization**: Custom Field Management with drag-and-drop reordering, and Marketing Template Management with WYSIWYG editor and dynamic merge tags.
- **Advanced Features**: Smart Lists for filtering, enhanced Client Product Display, comprehensive Email and SMS communication with DND system, Document Management with secure handling, Notes System, robust Calendar Management.
- **Hierarchical Sub-Task System**: ClickUp-style functionality supporting up to 5 levels of task nesting, expandable/collapsible tree views, comprehensive task management with visual hierarchy indicators, and proper progressive indentation.
- **Task Dependencies System**: Comprehensive business rule enforcement supporting Finish to Start, Start to Start, Finish to Finish, and Start to Finish dependency types with real-time validation and visual icons.
- **ClickUp-Style Recurring Task System**: Full scheduling capabilities (Daily, Weekly, Monthly, Yearly) with multiple end conditions, automatic generation of new task instances upon completion of the previous task, and completion-triggered automation.
- **Comprehensive Bulk Actions System**: Checkbox-based selection for tasks with "Select All" and bulk toolbar for Delete, Assignee, Status, Due Date, and Priority operations, including permissions checking and audit logging.
- **Task Status Visibility Controls**: Inline multi-select dropdown for showing/hiding completed and cancelled tasks.
- **Form Builder**: Drag-and-drop form builder with live preview, extensive styling controls, integration with custom fields, and folder navigation.
- **Data Integrity**: Ensures data consistency, standardizing on staff table IDs. All core entities are persisted in PostgreSQL.
- **Unified Template System**: Email and SMS template systems unified between Marketing and Client communication sections.
- **Lead Management Enhancement**: Rebuilt leads page with proper layout, overflow controls, staff assignment system, and enhanced lead card interactions.
- **Appointment Booking System**: Fully functional appointment booking for leads and clients, integrated into the main calendar with visual differentiation and CRUD operations.
- **Task Management System**: Complete task creation and management with comprehensive inline editing capabilities (staff assignment, dates, priority, time estimation, description).
- **Professional Task Table Interface**: ClickUp-style table view with hierarchical sub-task display, toggle functionality, drag-and-drop column reordering (Task Name protected), sortable columns, and comprehensive task deletion.
- **Global Timer System**: Professional-grade ClickUp-style timer with React Context state management, header bar indicator, and cross-navigation persistence.
- **Activity Logging System**: Comprehensive task activity tracking with database persistence and visual timeline display, logging all task modifications and time estimate changes.
- **Comments System with Threading**: Comprehensive commenting system with nested replies, @mention notifications with keyboard navigation, and threaded conversations. Includes emoji picker.
- **Advanced File Upload and Media System**: Complete multimedia support for task comments including inline image display, browser-based voice recording (MediaRecorder API), file attachments with type detection, secure object storage integration, and inline HTML5 audio players.
- **Image Annotation System**: Fully functional collaborative feedback system for uploaded images and PDFs with @mention functionality, real-time annotation display, and complete CRUD operations.
- **Enhanced HR Date Picker UX**: Time Off Request form with controlled date picker state for automatic closing and smart month navigation.
- **Optimized HR Filter Layout**: Department and position filters sized appropriately for longer department names without text overflow.
- **Job Application Form Configuration System**: Fully functional drag-and-drop form editor in Settings > HR Settings with backend persistence, auto-save functionality (1-second debounce), field reordering protection for system fields, and seamless form field management with database storage in `job_application_form_config` table.
- **Public Job Application System**: Complete external applicant functionality with public careers page (/careers), customizable job application form with dynamic custom fields, proper database foreign key relationships, and successful form submission handling with custom field data persistence.
- **Knowledge Base System**: Comprehensive Notion-like documentation platform with categorized content management, hierarchical article organization, advanced social features (likes, bookmarks, comments with @mentions), role-based access control, search functionality, and rich content editing capabilities.
- **Advanced Icon Selection**: Professional icon picker component with search functionality, categorized browsing (9 categories including Most Used, Navigation, Actions, Communication), visual grid display, and integration with complete Lucide React icon library.

### CSS Architecture Guidelines
- **Problem**: Broad CSS selectors cause styling issues.
- **Solution**: Component-scoped CSS with design system variables.
- Use CSS custom properties for consistent design tokens.
- Target specific component containers.
- Avoid universal selectors and overly broad rules.
- Preserve semantic circular elements.
- Always scope CSS changes to specific component containers to prevent cross-contamination.

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