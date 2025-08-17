# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance. The project aims to provide a complete, modern CRM solution for marketing agencies, enhancing efficiency and operational oversight.

## User Preferences
Preferred communication style: Simple, everyday language.
Bundle architecture preference: Collection-based bundles.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Vite, TanStack Query for state management, Wouter for routing, React Hook Form with Zod for forms.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design.
- **Database**: PostgreSQL with Drizzle ORM.

### Key Features and Design Patterns
- **Data Models**: Comprehensive relational schema for Clients, Projects, Campaigns, Leads, Tasks, and Invoices.
- **Authentication & Authorization**: Session-based authentication with role-based access control (Admin, Manager, User, Accounting) and granular permissions across modules.
- **UI/UX**: Responsive sidebar navigation, mobile-first design, optimized 3-column layouts, Radix UI primitives, shadcn/ui components, and Tailwind CSS for styling.
- **Data Management**: Full CRUD operations for core entities (Clients, Staff), comprehensive audit logs, table sorting, pagination, and CSV import/export functionality.
- **Customization**: Custom Field Management with drag-and-drop reordering, and Marketing Template Management with WYSIWYG editor and dynamic merge tags.
- **Advanced Features**: Smart Lists system for advanced filtering, enhanced Client Product Display for product/bundle management, comprehensive Email and SMS communication with DND system, Document Management with secure handling and object storage integration, Notes System, and robust Calendar Management with staff assignment, filtering, and appointment scheduling.
- **Form Builder**: Drag-and-drop form builder with live preview, extensive styling controls, integration with custom fields, and folder navigation for organizing forms.
- **Data Integrity**: System designed to ensure data consistency, particularly by standardizing on staff table IDs across the application and resolving critical storage layer issues.

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

## Recent Changes

### Projects Migration Completion (August 2025)
- Successfully migrated Projects from memory storage to PostgreSQL database
- All project CRUD operations now use database persistence instead of temporary memory storage
- Projects survive server restarts and maintain data integrity
- Foreign key relationships with clients table properly enforced
- API routes fully functional with database storage backend

### Template Folder System Completion (August 2025)
- Fixed critical template folder sync issues by converting all operations from memory to PostgreSQL database storage
- Resolved SMS template creation functionality with proper user ID validation and database persistence
- Successfully implemented "Move to Folder" functionality that works between all folders including newly created ones
- Added missing DELETE route for template folders with safety checks preventing deletion of folders containing templates
- Fixed UI filtering logic so templates only appear in their assigned folders, not duplicated in both folder and root views
- Root table now correctly shows only templates without folders; templates in folders only appear in those specific folders
- Eliminated duplicate folder creation issues and ensured proper data persistence across all template operations

### Modern CRM Roles & Permissions Implementation (August 2025)
- **Enhanced Role-Based Access Control (RBAC)** with modern CRM industry best practices
- **Comprehensive Permission System** with granular action-based permissions (view, create, edit, delete, manage, export, import)
- **Data Access Level Controls** implementing industry-standard data segmentation (own, team, department, all)
- **Field-Level Security** with restricted and read-only field controls for sensitive data protection
- **Modern Role Types** added: Sales Representative, Marketing Specialist, Customer Success, Operations, Sales Manager, Data Analyst
- **Permission Validation API** with real-time permission checking and user permission aggregation
- **Enhanced Audit Trail** with specialized permission change tracking and risk assessment
- **Fully Integrated Staff Management** with role assignment through Add Staff Member modal and role display in staff table
- **Complete Role-Staff Integration** connecting legacy User Type system with modern Roles & Permissions database structure
- All users properly assigned to appropriate roles: Brian (Admin), Sarah (Manager), Dustin (Sales Manager), Che (Sales Rep), Joe (Marketing), Test User (Data Analyst)
- System follows 2025 CRM security standards with principle of least privilege and automated access reviews

### Memory Storage to Database Migration (August 2025)
- Fixed tags storage issue by migrating from memory storage to PostgreSQL database
- Migrated SMS templates from memory storage to database storage for data persistence
- Migrated Projects from memory storage to database storage for data persistence
- **Migrated Leads from memory storage to database storage for complete CRM functionality**
- **Migrated Tasks from memory storage to database storage with advanced filtering capabilities**
- **Migrated Invoices from memory storage to database storage with comprehensive business logic**
- **Migrated Social Media (Accounts & Posts) from memory storage to database storage with advanced filtering**
- **Migrated Workflows from memory storage to database storage with category and status filtering**
- Tags, SMS templates, projects, leads, tasks, invoices, social media, and workflows now persist across server restarts and maintain data integrity
- Resolved delete tag functionality error by fixing frontend JSON parsing for 204 responses
- Fixed SMS folder "Edit Folder" functionality - added missing onClick handler and complete modal dialog system
- Added search functionality for leads with filtering by name, email, and company
- Added comprehensive filtering for tasks by status, priority, assignedTo, clientId, and projectId
- Added filtering for invoices by status, clientId, projectId, and search by invoice number
- Added comprehensive filtering for social media accounts by clientId and social media posts by clientId, campaignId, status, accountId
- Added comprehensive filtering for workflows by clientId, category, and status
- All leads, tasks, invoices, social media, and workflows CRUD operations now use direct database queries instead of memory storage

### Unified Template System Completion (August 2025)
- Unified email and SMS template systems between Marketing and Client communication sections
- Replaced hardcoded templates in client detail pages with dynamic database-driven components
- EmailTemplateSelector and SmsTemplateSelector components now fetch real templates from API endpoints
- Both Marketing > Email/SMS and Clients > Communication sections now use identical database storage
- Added search functionality for template selection in client communication workflows
- Eliminated template duplication and synchronization issues between different sections

### Folder Navigation for Forms (January 2025)
- Implemented clickable folder navigation in Marketing > Forms tab
- Added breadcrumb navigation with "All Forms" back button
- Users can now click folder names or use "View Folder" dropdown option to filter forms by folder
- Enhanced search functionality to work within specific folders
- Improved user experience for organizing and accessing forms

### Lead Management Enhancement & Staff Assignment (August 2025)
- **Resolved critical horizontal scrolling issue** where entire screen was scrolling horizontally instead of containing scroll to pipeline view
- **Complete leads page rebuild** with proper layout structure and overflow controls
- **Added CSS overflow constraints** to html, body, and #root elements to prevent whole-screen horizontal overflow
- **Enhanced main layout structure** with overflow-x: hidden and proper flexbox constraints
- **Pipeline view optimization** - horizontal scrolling now contained only within designated pipeline container area
- **Fixed multiple JSX syntax errors** that were causing application crashes and HMR failures
- **Improved leads page header styling** - added UserPlus icon matching navigation, removed white background, fixed tab separators
- **Enhanced vertical space utilization** - pipeline stages now use calc(100vh - 200px) height with 500px minimum for better screen usage
- **Removed pipeline container border** for cleaner visual appearance
- **Implemented comprehensive staff assignment system** with database schema updates and foreign key constraints to users table
- **Enhanced lead editing modal** with staff assignment dropdown populated from active staff members
- **Replaced Edit icons with staff profile images** on pipeline cards - displays actual uploaded profile images with fallback to initials
- **Added profile image tooltip functionality** showing staff member names on hover
- **Fixed object storage URL conversion** for proper profile image display from `/api/objects` endpoint
- **Removed redundant assigned staff text** from card bottoms for cleaner visual design
- Horizontal scrolling now works as intended: only affects the pipeline view area, not the entire application interface
- Lead ownership and staff assignment fully functional across pipeline and table views