# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance, leveraging modern web technologies.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles (confirmed working - user feedback: "LOVE how this functions!!!")

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Design**: RESTful API with CRUD operations
- **File Structure**: Modular, with shared types

### Data Storage Solutions
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Comprehensive relational schema

### Key Data Models
- **Clients**: Contact details and status
- **Projects**: Budget, timeline, progress
- **Campaigns**: Performance metrics (impressions, clicks, conversions)
- **Leads**: Sales pipeline with probability scoring
- **Tasks**: Assignment and priority levels
- **Invoices**: Financial tracking with payment status

### Authentication and Authorization
- Basic session-based structure.
- Role-based access control system with predefined roles (Admin, Manager, User, Accounting) and granular permissions across modules (clients, projects, campaigns, tasks, invoices, leads, workflows, social_media, reports, settings, staff, roles).

### Component Architecture
- **Layout System**: Responsive sidebar navigation with mobile-first design; optimized 3-column layout (2-3-2 CSS grid distribution) for client details.
- **UI Components**: Radix UI primitives
- **Form Components**: Reusable, entity-specific forms
- **Dashboard Components**: Modular widgets for metrics

### Development and Build Process
- **Development**: Hot module replacement with Vite
- **Type Checking**: Strict TypeScript configuration
- **Build Process**: Separate client and server builds with ESM
- **Database Management**: Drizzle migrations for schema version control

### Key Features Implemented
- **Data Persistence**: Client records stored in PostgreSQL.
- **Roles & Permissions**: Comprehensive role-based access control.
- **Pagination**: Implemented for clients and Custom Fields directory.
- **Client Management**: Full CRUD operations with custom field integration, contact owner assignment, and admin-only deletion.
- **Audit Logs**: Comprehensive system activity tracking.
- **Table Sorting**: Full sorting functionality for clients table.
- **CSV Import/Export**: Full CSV import and export for clients with field mapping and validation.
- **Custom Field Management**: Drag-and-drop reordering for folders and fields.
- **Staff Management**: Full CRUD operations for staff, including profile image uploads.
- **Settings Management**: Comprehensive section with configuration areas including Business Profile, Staff, Roles & Permissions, Integrations, Custom Fields, Tags, Products, and Audit Logs.
- **Campaign Template Management**: WYSIWYG editor for email and SMS templates, with folder organization and dynamic merge tags.
- **Smart Lists System**: Advanced filtering with tab-based interface, comprehensive permission system (personal, shared, universal), multi-user collaboration, and intelligent overflow navigation.
- **Enhanced Client Product Display**: Complete product and bundle management in client detail pages with cost visibility, role-based deletion, visual distinction, automatic bundle cost calculation, and accordion-style bundle expansion. Redesigned bundles architecture to be collection-based where base bundles define product collections (1 unit each) and client-specific quantities are stored per client. Removed price field from system, focusing on cost tracking.
- **Communication Systems**: Comprehensive email and SMS functionality with advanced composer features (CC/BCC, WYSIWYG, merge tags, templates, scheduling, character count), matching modal structures, and DND (Do Not Disturb) system for communication control with audit logging.
- **Document Management System**: Comprehensive upload and management with secure handling, supporting 15+ file types, server-side validation, object storage integration, and PostgreSQL tracking.
- **Client Ownership & Followers**: Implemented functionality with search-based assignment and display in client headers.
- **Notes System**: Comprehensive notes functionality with database persistence, formatting, expand/collapse, and admin-only permissions.
- **Calendar Settings**: Design consistency achieved with other settings pages, streamlined tabs to "Calendars" and "Integrations."
- **Calendar Staff Assignment**: Implemented complete staff assignment functionality for calendars with automatic ID mapping between staff and users tables. Fixed validation issues by filtering non-schema fields and preserving required calendar properties during updates.
- **Storage Layer Recovery**: Fixed critical API issue where MinimalStorage implementation was missing required methods, causing clients to appear missing while data remained safely in PostgreSQL. Switched to fully functional DbStorage implementation.
- **User ID Consistency Resolution**: Completed comprehensive schema migration to standardize entire system on staff table IDs. Updated all calendar system tables (calendars, calendar_staff, calendar_availability, calendar_date_overrides, calendar_integrations, calendar_appointments, round_robin_tracking) to use UUID references to staff table. Eliminated dual user/staff ID inconsistencies and established staff table as single source of truth for user management across the application.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migration and schema management

### UI and Styling
- **Radix UI**: Accessible headless UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS

### Development Tools
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript bundler
- **TanStack Query**: Server state management

### Form and Validation
- **React Hook Form**: Performant form library
- **Zod**: TypeScript-first schema validation
- **Hookform Resolvers**: Integration between React Hook Form and Zod

### Date and Utility Libraries
- **Date-fns**: Date utility library
- **Class Variance Authority**: Utility for component variants
- **clsx**: Conditional className utility

### Session Management
- **Connect PG Simple**: PostgreSQL session store for Express
- **Express Session**: Session middleware