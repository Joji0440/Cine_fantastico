# Copilot Instructions for Cine Fantástico

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a modern cinema management system called "Cine Fantástico" built with:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Prisma ORM** for database operations
- **Supabase PostgreSQL** for data storage
- **NextAuth.js** for authentication
- **Zustand** for state management

## Design Guidelines
- Maintain the original "Cine Fantástico" branding with red (#f50b0b) and gold (#af9b28) color scheme
- Use modern, responsive UI components
- Follow clean architecture principles
- Implement proper error handling and validation

## Key Features
- Movie management (CRUD operations)
- User authentication (clients, employees, administrators) 
- Seat reservations with visual seat selection
- Function/showtime management
- Audit logging system
- Dashboard for different user roles
- Reporting and analytics

## Code Standards
- Use TypeScript for all new files
- Follow React Server Components patterns where appropriate
- Use proper error boundaries and loading states
- Implement proper form validation with Zod schemas
- Use Prisma for all database operations
- Follow Next.js 14 App Router conventions

## Database
- Connected to existing Supabase PostgreSQL database
- Use Prisma schema to reflect the existing database structure
- Maintain data integrity and relationships
- No migrations needed - connect to existing tables

## Authentication
- Support multiple user types: cliente, empleado, administrador, gerente
- Use NextAuth.js with proper session management
- Implement role-based access control
- Secure API routes with proper middleware
