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