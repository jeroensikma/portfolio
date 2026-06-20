# Portfolio — jeroensikma.com

## Project Overview
Personal portfolio website for Jeroen Sikma. Public-facing site to showcase projects, plus a protected admin panel at `/admin` for content management.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (minimal scroll/page transitions)
- **Backend:** Supabase (auth, PostgreSQL, file storage)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Domain:** www.jeroensikma.com

## Folder Structure
```
src/
├── app/
│   ├── (public)/              # Public route group
│   │   ├── page.tsx           # Home — selected/featured projects
│   │   ├── project/[slug]/    # Project detail / case study
│   │   ├── index/             # Archive of all projects
│   │   └── about/             # About page
│   ├── admin/                 # Protected admin panel
│   │   ├── login/             # Admin login
│   │   ├── projects/          # Project CRUD
│   │   └── layout.tsx         # Auth guard
│   ├── api/                   # API routes
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/                # Shared UI components
├── lib/                       # Utilities, Supabase client, helpers
└── types/                     # TypeScript type definitions
```

## Architecture
- **Pattern:** Component-based with server/client split
- **Auth:** Supabase Auth (single admin user)
- **Data:** Supabase PostgreSQL for projects, awards
- **Storage:** Supabase Storage for images and videos
- **API:** Next.js API routes as proxy to Supabase

## Coding Conventions
- Use `"use client"` only when client interactivity is needed
- Prefer Server Components by default
- Use Tailwind utility classes for styling
- Keep components small and composable
- Use `async/await` for data fetching in Server Components
- TypeScript strict mode

## Commands
- **Dev:** `npm run dev` (from project root)
- **Build:** `npm run build`
- **Lint:** `npm run lint`

## Key Patterns
- Public pages use Server Components for SEO
- Admin pages are Client Components with Supabase auth guard
- Images/videos served from Supabase Storage CDN
- Framer Motion `<AnimatePresence>` for page transitions
- `motion.div` with `whileInView` for scroll animations
