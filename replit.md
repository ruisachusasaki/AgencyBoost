# AgencyFlow CRM System

## Overview

AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed for marketing agencies. The application provides a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices, with integrated reporting capabilities. Built with modern web technologies, it offers a responsive interface for tracking business operations and campaign performance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with CRUD operations for all entities
- **File Structure**: Modular separation with shared types between frontend and backend

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Schema**: Comprehensive relational schema with foreign key relationships between entities

### Key Data Models
- **Clients**: Customer information with contact details and status tracking
- **Projects**: Client projects with budget, timeline, and progress tracking
- **Campaigns**: Marketing campaigns with performance metrics (impressions, clicks, conversions)
- **Leads**: Sales pipeline management with probability scoring
- **Tasks**: Project task management with assignment and priority levels
- **Invoices**: Financial tracking with payment status and due dates

### Authentication and Authorization
- Currently implements basic session-based structure
- Prepared for future authentication implementation with session middleware

### Component Architecture
- **Layout System**: Responsive sidebar navigation with mobile-first design
- **UI Components**: Comprehensive design system using Radix UI primitives
- **Form Components**: Reusable form components for each entity type
- **Dashboard Components**: Modular dashboard widgets for metrics and overviews

### Development and Build Process
- **Development**: Hot module replacement with Vite dev server
- **Type Checking**: Strict TypeScript configuration across the entire stack
- **Build Process**: Separate client and server builds with ESM modules
- **Database Management**: Drizzle migrations for schema version control

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### UI and Styling
- **Radix UI**: Accessible headless UI components for complex interactions
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Modern icon library for consistent iconography

### Development Tools
- **Vite**: Build tool with React plugin and development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **TanStack Query**: Server state management with caching and synchronization

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type checking
- **Hookform Resolvers**: Integration layer between React Hook Form and Zod

### Date and Utility Libraries
- **Date-fns**: Modern date utility library for date manipulation
- **Class Variance Authority**: Utility for creating component variants
- **clsx**: Conditional className utility for dynamic styling

### Session Management
- **Connect PG Simple**: PostgreSQL session store for Express sessions
- **Express Session**: Session middleware for user state management

## Recent Development Progress

### Critical Database Persistence Fix (Latest - August 2025)
Successfully resolved the major data loss issue that was causing client records to disappear on server restarts:
- **Root Cause Identified**: System was using MemStorage (in-memory storage) instead of PostgreSQL database for client data
- **Database Migration**: Switched storage backend from MemStorage() to DbStorage() with direct PostgreSQL integration
- **Data Persistence**: All client records now permanently stored in database and survive server restarts
- **Contact Owner Display**: Fixed Contact Owner column to show staff member names instead of raw user IDs
- **API Integration**: All CRUD operations now use database with proper error handling and validation
- **Foreign Key Constraints**: Identified and documented contactOwner field references for future user/staff integration
- **Real-time Validation**: Implemented proper database connection testing and error logging
- **Data Recovery**: System now maintains client data integrity across all system operations

### Fully Functional Roles & Permissions System (August 2025)
Successfully implemented a comprehensive role-based access control system with database integration:
- **Database Tables**: Created roles, permissions, and user_roles tables with proper foreign key relationships
- **Default System Roles**: Admin, Manager, User, and Accounting roles with predefined permission sets
- **API Integration**: Complete REST API with CRUD operations for role management (/api/roles endpoints)
- **Granular Permissions**: 12 module permissions (clients, projects, campaigns, tasks, invoices, leads, workflows, social_media, reports, settings, staff, roles) with 5 action types each (view, create, edit, delete, manage)
- **Professional UI**: Role creation/editing with permission matrix, system role protection, user assignment tracking
- **Real-time Updates**: TanStack Query integration for live data synchronization
- **Error Handling**: Comprehensive validation, API error handling, and user feedback
- **Audit Integration**: All role changes automatically logged in audit trail
- **Type Safety**: Full TypeScript implementation with proper schema validation

### Custom Fields Directory Pagination System (August 2025)
Successfully implemented comprehensive pagination for the Custom Fields management interface:
- **Default Pagination**: 10 items per page as the default display setting
- **Flexible Page Sizes**: Dropdown allowing users to select 10, 50, or 100 items per page
- **Smart Navigation**: Previous/Next buttons with intelligent page number display and ellipsis for large datasets
- **Progress Tracking**: "Showing X-Y of Z fields" counter for user orientation
- **Auto-Reset Logic**: Automatically resets to page 1 when changing page size or applying search filters
- **Brand-Consistent Design**: Active page buttons use the #46a1a0 brand color theme
- **Performance Optimized**: Client-side pagination for efficient data handling and smooth user experience

### Complete Audit Logs System for Admin Oversight (August 2025)
Successfully implemented a comprehensive audit logging system for CRM oversight:
- **Database Schema**: Added audit_logs table with complete tracking fields (action, entity details, user attribution, timestamps, IP address, user agent)
- **API Endpoints**: Full REST API for audit logs with filtering by entity, user, and action type
- **Real-time Logging**: Automatic audit trail creation for contact record operations (create, update, delete)
- **Admin Interface**: Professional audit logs dashboard with filtering, search, and detailed activity views
- **Staff Integration**: User filtering dynamically pulls from Settings > Staff for accurate user attribution
- **Security Features**: IP address and user agent tracking for security auditing
- **Data Integrity**: Complete before/after value tracking for updates and detailed change descriptions
- **Professional UI**: Loading states, statistics summary, and clean audit trail display with action badges

### Products & Services Table Sorting with Optimized Layout (August 2025)
Successfully implemented comprehensive table sorting functionality with refined column layouts:
- **Sortable Column Headers**: Added clickable sort arrows to all table columns (Product/Service, Category, Type, Price, Cost, Profit, Margin %, Status)
- **Bi-directional Sorting**: Toggle between ascending and descending order with visual indicators
- **Smart Data Handling**: Proper sorting for text, numbers, calculated fields, and null values
- **Optimized Column Widths**: Fine-tuned layout to prevent text wrapping while maintaining readability
- **Professional UI**: Sort indicators highlight in brand color (#46a1a0) with hover effects
- **Text Truncation**: Long content displays with ellipsis to maintain table structure
- **Responsive Design**: Compact layout fits all columns without horizontal scrolling

### Enhanced Custom Field Management System (August 2025)
Successfully implemented a comprehensive custom field and folder management system with advanced functionality:
- **Folder Reordering**: Complete drag-and-drop system for custom field folders with real-time synchronization
- **Field Reordering**: Individual field reordering within folders using drag-and-drop interface
- **Dedicated Edit Pages**: Converted folder editing from modal to full-page interface for enhanced user experience
- **API Route Optimization**: Fixed routing conflicts by positioning specific endpoints before parameterized routes
- **Database Updates**: Sequential order updates with proper error handling and validation
- **Real-time Synchronization**: Folder and field ordering syncs between Settings > Custom Fields and client detail sidebar
- **User Interface**: Smooth drag-and-drop experience using react-beautiful-dnd with visual grip handles
- **Error Resolution**: Fixed HTTP method mismatches and JSON parsing errors through proper endpoint configuration
- **Technical Implementation**: Complete CRUD operations with PUT /api/custom-field-folders/reorder and PUT /api/custom-fields/reorder endpoints

### Complete Staff Management System with Profile Images (August 2025)
Successfully completed a fully functional Staff Management system with advanced profile functionality:
- **CRUD Operations**: Create, read, update, and delete staff members with comprehensive validation
- **Profile Image Upload**: Secure cloud storage integration with object storage service for staff photos
- **Advanced Profile Fields**: Complete address components, hire date, department dropdown, manager selection, birthdate fields
- **Data Validation**: Proper form validation with TypeScript safety and Zod schema validation
- **Professional UI**: Clean interface matching the #46a1a0 color theme with responsive design
- **Real-time Updates**: Instant UI updates after profile changes using TanStack Query
- **Error Handling**: Robust error handling for uploads, API calls, and form submissions

### Comprehensive Settings Management System (August 2024)
Successfully implemented a complete Settings section with 10 specialized configuration areas:
- **Navigation Design**: Settings item integrated into main navigation section at the bottom of the list
- **Main Settings Dashboard**: Grid-based overview with descriptive cards for each settings area
- **All 10 Settings Pages**: Business Profile, My Profile, Staff, Support, Roles & Permissions, Integrations, Custom Fields, Tags, Products, and Audit Logs
- **Role-Based Access Control**: Admin-only sections clearly marked (Staff, Roles & Permissions, Audit Logs)
- **Professional UI Components**: Consistent design patterns using shadcn/ui components
- **Future-Ready Architecture**: Support system and integrations prepared for upcoming features

### Settings Pages Overview
1. **Business Profile**: Company information, logo upload, timezone, address management
2. **My Profile**: Personal profile with photo, signature, calendar integration
3. **Staff**: User management with role assignment (Admin only)
4. **Support**: Department management, ticket priorities, status configuration
5. **Roles & Permissions**: Custom role creation with granular permission matrix (Admin only)
6. **Integrations**: Google Calendar, Gmail, QuickBooks, Slack connectivity
7. **Custom Fields**: Dynamic field creation with folder organization
8. **Tags**: Color-coded tag management with usage statistics
9. **Products**: Service catalog with pricing and categorization
10. **Audit Logs**: Complete system activity tracking (Admin only)

### Campaign Template Management System
Previously implemented comprehensive email and SMS template management system with:
- **WYSIWYG Editor**: ReactQuill integration for rich text editing
- **Template Organization**: Folder-based system for email/SMS template categorization
- **Dynamic Merge Tags**: 22+ standard contact fields plus unlimited custom fields
- **Template Operations**: Create, edit, duplicate, and delete functionality
- **Custom Fields Integration**: Automatic inclusion of custom fields in merge tag dropdown
- **Professional Design**: Clean UI matching #46a1a0 color theme

### Technical Implementation Details
- **Object Storage Integration**: Secure cloud-based profile image storage with presigned URLs
- **Database Schema**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Architecture**: RESTful endpoints with proper error handling and validation
- **Form Management**: React Hook Form with Zod validation for complex multi-field forms
- **Image Upload Flow**: Client-side upload to cloud storage followed by database path updates
- **Staff Hierarchy**: Manager selection dropdown with proper relationship handling
- **Department Management**: Structured department categorization (Media Buying, Creative, DevOps, etc.)
- **Phone Formatting**: Automatic phone number formatting for better UX
- **Navigation Integration**: Settings positioned in main navigation section at bottom
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Real-time Updates**: TanStack Query for efficient data synchronization and cache invalidation