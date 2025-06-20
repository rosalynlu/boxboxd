# Replit.md - Boxboxd (F1 Racing Social Platform)

## Overview

Boxboxd is a social platform for Formula 1 racing enthusiasts, inspired by Letterboxd but designed specifically for F1 races. Users can rate races, create watchlists, follow other users, and discover popular races through a modern, dark-themed interface.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom F1-themed color palette
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Database Schema
- **Users**: Profile management with F1 preferences and onboarding status
- **Races**: F1 race information with circuits and metadata
- **Circuits**: Racing venue information
- **Ratings**: User race ratings and reviews
- **Social Features**: Watchlists, follows, likes, and user lists
- **Sessions**: Authentication session storage

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- User onboarding flow for F1 preferences
- Protected routes with authentication middleware

### Data Management
- Drizzle ORM with PostgreSQL dialect
- Type-safe database operations with Zod validation
- Sample data initialization for development
- Database migrations support

### User Interface
- Dark theme optimized for F1 branding (racing red accent)
- Responsive design with mobile-first approach
- Component library with consistent design system
- Form handling with React Hook Form and Zod validation

### Social Features
- User profiles with F1 preferences
- Race rating system with reviews
- Watchlist functionality
- User following system
- Activity feeds and discovery

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth, creating sessions stored in PostgreSQL
2. **Onboarding Flow**: New users complete F1 preference setup before accessing main application
3. **Race Discovery**: Users browse races with filtering, search, and popularity-based recommendations
4. **Social Interactions**: Users rate races, manage watchlists, and follow other users
5. **Real-time Updates**: TanStack Query manages cache invalidation and optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React routing
- **express**: Node.js web framework

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Authentication
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect client
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit modules
- **Database**: PostgreSQL 16 provisioned via Replit
- **Development Server**: Vite dev server with Express API
- **Hot Reload**: Vite HMR with error overlay

### Production Build
- **Frontend Build**: Vite production build to `dist/public`
- **Backend Build**: ESBuild bundle to `dist/index.js`
- **Deployment**: Replit Autoscale with HTTP/HTTPS support
- **Environment**: Production Node.js with optimized builds

### Configuration
- **Port Mapping**: Internal 5000 → External 80
- **Environment Variables**: Database URL, session secrets, Replit auth
- **Static Assets**: Served from `dist/public` directory

## Changelog

```
Changelog:
- June 20, 2025. Initial setup
- June 20, 2025. Updated onboarding flow:
  * Updated F1 teams list (replaced AlphaTauri with Racing Bulls, Alfa Romeo with Sauber, added Cadillac)
  * Changed favorite driver selection from text input to dropdown with 2025 F1 drivers
  * Fixed username validation with real-time availability checking
  * Improved username field with lowercase conversion and character restrictions
  * Added visual feedback for username validation status
- June 20, 2025. Comprehensive profile page redesign:
  * Removed favorites section and moved team/driver info as icons under username
  * Added Edit Profile functionality with username, bio, website, team/driver selection
  * Replaced stats section with inline counts (watched, reviewed, followers, following)
  * Added follow/unfollow functionality for other users
  * Implemented favorites section for liked races with reordering capability
  * Created comprehensive lists system with public/private settings and cover photos
  * Renamed watchlist to "To Watch" section
  * Enhanced activity feed to track all user actions (reviews, watches, list changes)
  * Added reviews section showing all past user reviews with ratings
- June 20, 2025. Enhanced race features and platform improvements:
  * Implemented half-star rating system (0.5-5.0 scale) for more precise reviews
  * Added watched/unwatched functionality to track viewing status
  * Enhanced race detail page with collapsible race results and medal emojis
  * Updated home page with Recent Races section instead of Popular This Week
  * Improved activity feed to show user's own activity plus followed users
  * Added comprehensive review editing with watched status tracking
  * Updated database schema to support watched field in ratings
  * Added similar races suggestions based on tags and circuits
  * Implemented drag-free race reordering with up/down arrow buttons
  * Enhanced race search with sorting by date and rating
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```