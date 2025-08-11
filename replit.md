# AgencyFlow CRM System

## Overview
AgencyFlow is a comprehensive Customer Relationship Management (CRM) system designed specifically for marketing agencies. Its primary purpose is to provide a complete solution for managing clients, projects, campaigns, leads, tasks, and invoices. It includes integrated reporting capabilities and offers a responsive interface for tracking business operations and campaign performance, leveraging modern web technologies.

## Recent Changes (August 2025)
- **Smart Lists Enhancement**: Implemented comprehensive tab-based Smart Lists interface with advanced permission system, supporting personal, shared, and universal visibility levels with multi-user collaboration capabilities. Successfully enhanced filtering system to work with actual custom field data - dropdown fields now show predefined options from custom field definitions instead of requiring manual text entry, significantly improving user experience and data accuracy. Added intelligent overflow navigation system with "More" dropdown to handle 10+ smart lists without wrapping or cluttering the interface.
- **Product Bundles System**: Redesigned bundles architecture where base bundles define product collections (1 unit each) and client-specific quantities are stored per client. This provides maximum flexibility with cleaner base bundle management.
- **Client Product Management**: Enhanced client detail pages with role-based delete permissions (Admin, Accounting, Manager) for products and bundles, plus automatic cost calculation display. Implemented accordion-style bundle expansion with client-specific quantity customization and automatic cost recalculation.
- **Product Architecture Simplification**: Completed removal of price field from entire system architecture, focusing exclusively on cost tracking. Eliminated Revenue, Profit, and Margin calculations from bundle displays to align with agency business model where Client Profitability = Client MRR - Total Product/Bundle Costs.
- **Usage Tracking Optimization**: Removed unused "Usage" column from Products table and added real-time client usage tracking for Bundles. Backend now calculates active client counts from clientBundles table, providing accurate bundle utilization metrics in Settings > Products & Services.
- **Owner Assignment & Followers**: Implemented client ownership and followers functionality with search-based assignment dialogs. Contact owners and followers are displayed in client headers with clickable names for easy assignment/editing. Both features use backend PUT endpoints for reliable data persistence.
- **DND (Do Not Disturb) System**: Implemented comprehensive communication control system with four levels: "DND All Channels" (blocks everything), individual controls for Emails, Text Messages, and Calls & Voicemails. The system prevents sending communications when DND settings are active, includes visual indicators in Quick Actions section, and provides warning messages. Critical feature that ensures app CANNOT send unwanted communications when DND is enabled. Enhanced with comprehensive audit logging that tracks WHO made changes, WHAT was changed (enabled/disabled), and detailed action descriptions for compliance tracking.
- **Enhanced Client Detail Layout**: Successfully implemented optimized 3-column layout using 7-column CSS grid (2-3-2 distribution) with equal-width left and right sections and moderately wider middle section. Resolved infinite render loop issues through useMemo optimization for stable dependency management. User feedback: "Perfect" - layout provides ideal balance for content organization.
- **Notes System Enhancement**: Completed comprehensive notes functionality with database persistence, formatting preservation, expand/collapse text capabilities, and admin-only edit/delete permissions. Successfully resolved dynamic height matching issues by implementing fixed-height approach (600px) with internal scrolling instead of complex left-column height tracking. User feedback: "That looks great" - provides reliable scrolling behavior without layout conflicts.
- **Bundle UI Refinement**: Removed "Custom" badge from bundle products when quantities are customized to prevent layout displacement of Unit Price and Qty badges. Maintained all bundle functionality including expansion/collapse, quantity editing, and cost display. User feedback: "Looks great, thanks!" - improved visual consistency in product listings.

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
- **Smart Lists System**: Advanced filtering with tab-based interface similar to Custom Fields page, featuring comprehensive permission system (personal, shared, universal visibility), multi-user collaboration with staff selection, visual indicators for list types, and automatic migration of legacy data.
- **Enhanced Client Product Display**: Complete product and bundle management in client detail pages with cost visibility, role-based deletion controls, visual distinction between products and bundles (Package icons, teal styling), automatic calculation of bundle costs from component products with quantities, and accordion-style bundle expansion showing detailed product breakdown for account manager visibility.
- **Bundle Architecture Success**: Successfully implemented and deployed collection-based bundle system (August 2025) with positive user feedback. Base bundles now cleanly define product collections while client-specific quantities provide maximum customization flexibility.

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