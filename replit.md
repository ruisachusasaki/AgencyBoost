# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance. The project aims to provide a complete, modern CRM solution for marketing agencies, enhancing efficiency and operational oversight.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query, Wouter, React Hook Form with Zod.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design.
- **Database**: PostgreSQL with Drizzle ORM.

### Key Features and Design Patterns
- **Data Models**: Comprehensive relational schema for Clients, Projects, Campaigns, Leads, Tasks, and Invoices.
- **Authentication & Authorization**: Session-based authentication with role-based access control (Admin, Manager, User, Accounting) and granular permissions. Includes modern CRM roles like Sales Representative, Marketing Specialist, Customer Success, Operations, Sales Manager, Data Analyst, with comprehensive permission systems (action-based, data access levels, field-level security) and real-time validation.
- **UI/UX**: Responsive sidebar navigation, mobile-first design, optimized 3-column layouts, Radix UI primitives, shadcn/ui components, and Tailwind CSS for styling. Includes enhanced visual design for elements like pipeline views.
- **Data Management**: Full CRUD operations for core entities, comprehensive audit logs, table sorting, pagination, CSV import/export.
- **Customization**: Custom Field Management with drag-and-drop reordering, and Marketing Template Management with WYSIWYG editor and dynamic merge tags.
- **Advanced Features**: Smart Lists for advanced filtering, enhanced Client Product Display for product/bundle management, comprehensive Email and SMS communication with DND system, Document Management with secure handling and object storage integration, Notes System, and robust Calendar Management with staff assignment, filtering, and appointment scheduling.
- **Form Builder**: Drag-and-drop form builder with live preview, extensive styling controls, integration with custom fields, and folder navigation.
- **Data Integrity**: System designed to ensure data consistency, standardizing on staff table IDs and resolving storage layer issues. All core entities (Projects, Leads, Tasks, Invoices, Social Media, Workflows, Tags, SMS Templates) are persisted in PostgreSQL.
- **Unified Template System**: Email and SMS template systems are unified between Marketing and Client communication sections, using dynamic database-driven components.
- **Lead Management Enhancement**: Includes a rebuilt leads page with proper layout and overflow controls, comprehensive staff assignment system, and enhanced lead card interactions. Staff profile images are displayed on lead cards with fallback to initials.
- **Appointment Booking System**: Fully functional appointment booking for leads, integrated into the main calendar with visual differentiation, filtering capabilities, and complete CRUD operations for both lead and client appointments. Lead appointments display with purple badges and route to correct deletion endpoints.
- **Task Management System**: Complete task creation and management with comprehensive inline editing capabilities. Features include staff assignment dropdown, dual date handling (start date and due date), priority system with colored flag indicators (red=urgent, yellow=high, blue=normal, gray=low), time estimation and tracking with start/stop functionality, and database schema enhancements. All task detail fields support inline editing without requiring "Edit Task" button - users can directly modify status, assignee, dates, priority, time estimates, and descriptions with automatic saving. Enhanced 4-row structured layout with Icon, Label, Field format for optimal user experience. Description field includes smart truncation with "Show more/Show less" functionality for long content, click-to-edit interface, and keyboard shortcuts (Escape to cancel, Ctrl+Enter to save).
- **Activity Logging System**: Comprehensive task activity tracking with database persistence and visual timeline display. Automatically logs all task modifications including status changes, assignee assignments, date modifications, priority adjustments, and time tracking updates. Features real-time activity feed with chronological ordering, user attribution, visual icons, and color-coded priority indicators. Activities are displayed in the task detail sidebar with proper formatting for dates, staff names, and priority levels.
- **Comments System with Threading**: Comprehensive commenting system with nested replies, @mention notifications, and threaded conversations. Comments support replies with visual differentiation, proper indentation, and maintain notification functionality for mentions in both top-level comments and replies.

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