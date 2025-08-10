# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed specifically for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance, leveraging modern web technologies.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- Basic session-based structure with plans for future enhancement.
- Role-based access control system with predefined roles (Admin, Manager, User, Accounting) and granular permissions (view, create, edit, delete, manage) across modules (clients, projects, campaigns, tasks, invoices, leads, workflows, social_media, reports, settings, staff, roles).

### Component Architecture
- **Layout System**: Responsive sidebar navigation with mobile-first design
- **UI Components**: Radix UI primitives
- **Form Components**: Reusable, entity-specific forms
- **Dashboard Components**: Modular widgets for metrics

### Development and Build Process
- **Development**: Hot module replacement with Vite
- **Type Checking**: Strict TypeScript configuration
- **Build Process**: Separate client and server builds with ESM
- **Database Management**: Drizzle migrations for schema version control

### Key Features Implemented
- **Data Persistence**: Client records are permanently stored in PostgreSQL.
- **Roles & Permissions**: Comprehensive role-based access control with database integration and API.
- **Pagination**: Complete pagination system for clients with dropdown options (20, 50, 100 items per page), page navigation controls, and item counters. Also implemented for Custom Fields directory.
- **Client Management**: Full CRUD operations with custom field integration, contact owner assignment, and admin-only deletion capabilities.
- **Audit Logs**: Comprehensive system activity tracking with admin interface and detailed logging.
- **Table Sorting**: Complete sorting functionality for clients table with visual up/down arrow indicators, supporting all columns except Actions. Includes proper data type handling for names, dates, contact owners, and custom field values.
- **CSV Import/Export**: Full CSV import and export capabilities for clients with field mapping, validation, error handling, and audit logging.
- **Custom Field Management**: Drag-and-drop reordering for folders and fields, with dedicated edit pages.
- **Staff Management**: Full CRUD operations for staff, including profile image uploads and advanced fields.
- **Settings Management**: A comprehensive settings section with 10 specialized configuration areas: Business Profile, My Profile, Staff, Support, Roles & Permissions, Integrations, Custom Fields, Tags, Products, and Audit Logs.
- **Campaign Template Management**: WYSIWYG editor for email and SMS templates, with folder organization and dynamic merge tags.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migration and schema management

### UI and Styling
- **Radix UI**: Accessible headless UI components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

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