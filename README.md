# Casa dos Escritores

A modern literary platform built with Next.js, designed for writers to publish their work and build a community around digital storytelling.

## Overview

Casa dos Escritores is a full-stack web application that facilitates content creation and community engagement for writers and readers. The platform provides comprehensive content management, user authentication, and social interaction features.

## Technical Stack

### Core Technologies
- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: React 19.1.0
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS 3.4.17
- **Backend**: Supabase (PostgreSQL + Auth + RPC)
- **Editor**: Tiptap 2.11.5 (Rich Text Editor)
- **UI Components**: Lucide React (Icons)

### Development Dependencies
- **Linting**: ESLint 9
- **Styling**: PostCSS, Autoprefixer
- **Build Tools**: TypeScript 5.8.3
- **Utilities**: date-fns, DOMPurify, nanoid

## Architecture

### Application Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── admin/             # Admin panel
│   ├── api/               # API endpoints
│   ├── categories/        # Content categorization
│   ├── dashboard/         # User dashboard
│   ├── notifications/     # Notification system
│   ├── profile/           # User profiles
│   ├── search/            # Search functionality
│   ├── series/            # Series management
│   └── story/             # Story management
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── supabase-client.js # Client-side Supabase
│   ├── supabase-server.js # Server-side Supabase
│   └── utils.js           # Helper functions
└── styles/                # Global styles
```

## Core Features

### Authentication & Authorization
- Supabase Auth integration
- Role-based access control (RBAC)
- Protected routes and middleware
- Session management

### Content Management
- **Stories**: Individual literary works
- **Chapters**: Multi-part story segments
- **Series**: Collections of related content
- Rich text editing with Tiptap
- Content publishing workflow
- Draft and published states

### User Experience
- Responsive design
- Dynamic content discovery
- Category-based navigation
- Search functionality
- User profiles and author pages
- Social interaction (comments, follows)

### Content Discovery
- Featured series
- New releases
- Recent content
- Most commented works
- Featured writers
- Category-based browsing

### Administrative Features
- Content moderation
- User management
- Analytics dashboard
- System monitoring

## Database Schema

The application uses Supabase PostgreSQL with the following core entities:

### Primary Tables
- `profiles` - User profiles and metadata
- `stories` - Individual story content
- `series` - Story collections
- `chapters` - Multi-part content segments
- `comments` - User interactions
- `categories` - Content classification

### Relationships
- One-to-many: Users to Stories/Series
- One-to-many: Series to Chapters
- Many-to-many: Stories to Categories
- One-to-many: Content to Comments

## API Architecture

### Internal APIs (`/api/`)
- Authentication endpoints
- Content CRUD operations
- File upload handling
- Administrative functions

### Supabase Integration
- RPC function calls for complex queries
- Real-time subscriptions
- Row Level Security (RLS) policies
- Edge functions for serverless computing

## Security Implementation

### Authentication Security
- JWT-based session management
- Role-based access control
- Protected API endpoints
- Middleware authentication checks

### Content Security
- Input sanitization with DOMPurify
- XSS protection
- CSRF protection
- SQL injection prevention via Supabase RLS

### Infrastructure Security
- Rate limiting on all endpoints
- File upload validation
- Content Security Policy (CSP)
- Security headers implementation

## Performance Optimization

### Frontend Optimization
- Server-side rendering (SSR)
- Static generation for public content
- Image optimization with Next.js Image
- Component-level code splitting

### Database Optimization
- Indexed queries
- RPC functions for complex operations
- Connection pooling via Supabase
- Optimized data fetching patterns

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Configure environment variables
cp env-template.txt .env.local

# Run development server
npm run dev
```

### Environment Configuration
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Build and Deployment
```bash
# Production build
npm run build

# Start production server
npm run start

# Code linting
npm run lint
```

## Deployment

### Vercel Configuration
The application is optimized for Vercel deployment with:
- Automatic deployments from Git
- Environment variable management
- Edge function support
- Built-in analytics

### Configuration Files
- `vercel.json` - Deployment configuration
- `next.config.mjs` - Next.js optimization settings
- Security headers and CSP configuration

## Monitoring and Analytics

### Application Monitoring
- Error tracking and logging
- Performance metrics
- User analytics
- Security event monitoring

### Business Intelligence
- Content engagement metrics
- User behavior analytics
- Growth tracking
- Platform usage statistics

## Contributing

### Code Standards
- ESLint configuration for code quality
- TypeScript for type safety
- Tailwind CSS for consistent styling
- Component-based architecture

### Development Guidelines
- Follow Next.js best practices
- Implement proper error boundaries
- Use semantic HTML structure
- Maintain accessibility standards

## License

This project is proprietary software. All rights reserved.

---

**Maintainers**: Development Team  
**Last Updated**: January 2025  
**Next.js Version**: 15.2.4  
**Node.js Requirement**: >= 18.0.0
