# ClipAI - Smart Clipboard Manager

## Overview

ClipAI is an intelligent clipboard management application that uses AI to automatically categorize and decide whether clipboard content should be kept, discarded, or reviewed. The application analyzes pasted content using OpenAI's API and provides enhanced storage with smart categorization.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API for content analysis
- **Development**: Hot reload with Vite middleware integration

### Database Schema
The application uses a single main table `clipboard_items` with the following structure:
- `id`: Auto-incrementing primary key
- `content`: Original clipboard content (required)
- `category`: AI-determined category (work, research, development, personal)
- `aiDecision`: AI recommendation (keep, discard, maybe)
- `aiAnalysis`: AI's reasoning for the decision
- `title`: Generated title for the content
- `enhancedContent`: Cleaned/formatted version
- `summary`: Brief summary for long content
- `sourceUrl`: Extracted URL if present
- `wordCount`: Content word count
- `createdAt`: Timestamp
- `manualOverride`: User override flag

## Key Components

### AI Analysis Service (`server/services/openai.ts`)
- Analyzes clipboard content using OpenAI GPT models
- Categorizes content into work, research, development, or personal
- Makes keep/discard/maybe decisions based on content value
- Extracts URLs, generates titles, and creates summaries
- Provides confidence scores for decisions

### Storage Layer (`server/storage.ts`)
- Abstract storage interface for flexibility
- PostgreSQL database implementation with Drizzle ORM
- Full CRUD operations with optimized queries
- Advanced search with case-insensitive filtering
- Statistics aggregation for dashboard

### Frontend Components
- **Dashboard**: Main application interface with stats and content views
- **Timeline View**: Chronological display of clipboard items
- **Sidebar**: Navigation and category filtering
- **Add Content Modal**: Manual content addition with AI analysis
- **Clipboard Item**: Individual item display with actions

## Data Flow

1. **Content Input**: User adds content via modal or API endpoint
2. **AI Analysis**: Content sent to OpenAI for categorization and decision
3. **Storage**: Analyzed content stored in database with metadata
4. **Display**: Items shown in timeline view with filtering options
5. **User Actions**: Manual overrides, deletions, and decision changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **openai**: Official OpenAI API client
- **express**: Web server framework

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- Uses Vite dev server with HMR
- Express server with middleware integration
- PostgreSQL database (configured via DATABASE_URL)
- OpenAI API integration (requires API key)

### Production Deployment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Runtime**: Node.js with production Express server
- **Database**: PostgreSQL with connection pooling
- **Static Assets**: Served from dist/public directory
- **Platform**: Configured for Replit deployment with autoscale

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `OPENAI_API_KEY`: OpenAI API authentication (required)
- `NODE_ENV`: Environment mode (development/production)

## Changelog

Changelog:
- June 17, 2025. Initial setup with React frontend and Express backend
- June 17, 2025. Added PostgreSQL database with Drizzle ORM integration
- June 17, 2025. Implemented full navigation system with Settings and Categories views
- June 17, 2025. Database schema deployed and populated with sample data
- June 17, 2025. Fixed all functionality including dark mode implementation
- June 17, 2025. Completed comprehensive testing and OpenAI API integration
- June 17, 2025. Implemented animated clipboard preview with smooth transitions using Framer Motion

## User Preferences

Preferred communication style: Simple, everyday language.