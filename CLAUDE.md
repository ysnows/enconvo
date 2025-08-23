# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js website for Enconvo, built with Tailwind CSS and deployed as a static site. The site includes authentication, payment processing via Stripe, and user management features.

## Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

### Alternative Package Manager
This project supports both npm and pnpm (pnpm-lock.yaml present).

## Architecture

### Tech Stack
- **Framework**: Next.js 13.3.0 with React 18
- **Styling**: Tailwind CSS with Headless UI components
- **Authentication**: Supabase Auth
- **Payments**: Stripe integration
- **Database**: Supabase (PostgreSQL)
- **State Management**: React state + Supabase client
- **Deployment**: Static export (out/ directory)

### Key Directories

- `src/pages/` - Next.js pages and API routes
- `src/components/` - Reusable React components and UI components
- `src/lib/` - Shared utilities and configurations
- `src/utils/` - Utility functions including Supabase helpers
- `src/styles/` - Global styles (Tailwind CSS)
- `src/images/` - Static images and assets
- `public/` - Public static assets

### Authentication Architecture

The app uses dual Supabase client setup:
- `src/lib/supabase.js` - Legacy client using `@supabase/auth-helpers-nextjs`
- `src/utils/supabase/client.ts` - New client using `@supabase/ssr`

### Payment Integration

Stripe integration includes:
- Checkout sessions for cloud points purchase
- Customer management with Supabase user linking
- Webhook handling for payment events (`src/pages/api/subscription/webhook.ts`)
- Billing portal management

### Component Structure

- UI components use Tailwind CSS classes
- Form components in `src/components/` for auth flows
- Feature-specific components for different sections
- Radix UI primitives for accessible components

### API Routes

Located in `src/pages/api/`:
- `subscription/` - Stripe payment handling
- `user-info.js` - User data management
- `test.ts` - Testing utilities

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Static Export

The project builds to a static export in the `out/` directory, suitable for deployment on static hosting platforms.