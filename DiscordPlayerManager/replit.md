# Discord Bot Management Dashboard

## Overview

This is a full-stack Discord bot management dashboard that provides real-time monitoring and management of Discord server members. The application features a React frontend with a modern UI, an Express.js backend with WebSocket support, and PostgreSQL database integration. The system allows administrators to view member statistics, search and filter members, and perform moderation actions like kicking members from the Discord server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and uses modern tools for a polished user experience:

- **Framework**: React with TypeScript for type safety and better development experience
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a dark theme design system using CSS custom properties
- **State Management**: TanStack Query (React Query) for server state management with caching and real-time updates
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Real-time Updates**: WebSocket integration for live member status updates

The frontend follows a component-based architecture with reusable UI components, custom hooks for WebSocket communication, and proper separation of concerns between data fetching and presentation.

### Backend Architecture

The backend provides RESTful APIs and real-time communication:

- **Framework**: Express.js with TypeScript for the web server
- **Real-time Communication**: WebSocket server for broadcasting live updates to connected clients
- **Discord Integration**: discord.js library for Discord bot functionality and server management
- **API Design**: RESTful endpoints for member management, statistics, and moderation actions
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

The server architecture separates concerns between Discord bot management, HTTP API routes, WebSocket communication, and data storage abstraction.

### Data Storage Solutions

The application uses a flexible storage approach with PostgreSQL as the primary database:

- **Database**: PostgreSQL for production with proper relational schema design
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Separate tables for Discord members, kick logs, and server statistics
- **Data Validation**: Zod schemas for runtime type checking and data validation
- **Storage Abstraction**: Interface-based storage layer allowing for different implementations (includes in-memory storage for development)

The database schema tracks member information, moderation history, and server analytics with proper foreign key relationships and constraints.

### Authentication and Authorization

Currently, the application appears to be designed for internal use without complex authentication:

- **Session Management**: Basic session handling through Express middleware
- **Access Control**: Role-based permissions through Discord member roles (Admin, Moderator, Member)
- **Security**: CSRF protection and input validation on all API endpoints

### Real-time Features

The application implements real-time updates through multiple channels:

- **WebSocket Server**: Custom WebSocket implementation for broadcasting member join/leave events
- **Discord Bot Events**: Real-time Discord server event handling for member presence and status changes
- **Live Statistics**: Auto-updating server statistics and member counts
- **Fallback Polling**: Query invalidation and refetching as backup for real-time updates

## External Dependencies

### Third-party Services

- **Discord API**: Core integration through discord.js for bot functionality and server management
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless driver

### Key Libraries and Frameworks

- **UI Components**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS for utility-first styling approach
- **Data Fetching**: TanStack Query for intelligent server state management
- **Database**: Drizzle ORM for type-safe database operations
- **Validation**: Zod for schema validation and type inference
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: TypeScript for static typing, tsx for development server

### Development and Deployment

- **Package Management**: npm with lockfile for consistent dependency versions
- **Environment**: Node.js with ES modules for modern JavaScript features
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Replit Integration**: Custom plugins for Replit development environment support