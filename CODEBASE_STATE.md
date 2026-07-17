# CFDT Codebase State Verification

**Generated:** 2026-07-17  
**Repository:** johnc0601-glitch/CFDT  
**Default Branch:** main  
**Last Verified:** 2026-07-16T11:41:34Z

---

## Repository Access Verified ✓

This document confirms the **current, verified state** of the codebase. Share this with ChatGPT as your baseline for continued development.

### Technology Stack
- **Runtime:** Next.js 16.2.10 with React 19.2.4
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + PostCSS
- **CMS:** Sanity.io (headless content platform)
- **Backend:** Supabase 2.110.3
- **Image Viewers:** OpenSeadragon 5.0.1 (deep zoom), PDF.js 6.1.200 + pdf-lib 1.17.1

---

## Project Structure

```
app/                    Next.js 16 App Router (server components)
├── page.tsx            Home page (counties, stats, featured projects)
├── layout.tsx          Root layout with fonts and metadata
├── counties/           County-specific project views
├── projects/[slug]     Individual project detail pages
├── search/             Search interface
├── map/                Map view placeholder
├── meetings/           Meetings listing
├── developers/         Developer directory
├── admin/              Admin workspace
└── api/                API routes

components/             110+ React components (reusable UI library)
├── ProjectDashboard.tsx        Master project view (16KB)
├── GraphicViewer.tsx           OpenSeadragon image viewer with zoom
├── HiltonBluffsHero.tsx         Special project hero section
├── HiltonBluffsPlat.tsx         Plat/plan switcher (9KB)
├── HiltonBluffsPlanButton.tsx   Interactive plan selector (8.4KB)
├── Timeline.tsx                Approval timeline with status badges
├── MediaGallery.tsx            Photo/graphic carousel
├── DocumentList.tsx            Project documents display
├── MeetingList.tsx             Meeting information
├── MapExplorer.tsx             Map placeholder
├── SearchBox.tsx               Search input component
├── ProjectGraphics.tsx          Graphics gallery orchestrator
├── ApprovalTimeline.tsx         Timeline component
├── Header.tsx                  Global header/nav
├── Footer.tsx                  Global footer
├── MobileNav.tsx               Mobile navigation
└── [80+ other specialized UI components]

lib/                    Business logic and utilities
├── queries.ts          Sanity GROQ queries (all data fetching)
├── countyWorkflows.ts  County approval processes (7.4KB)
├── sanity.ts           Sanity client initialization
├── stats.ts            Project aggregation calculations
├── seo.ts              SEO helpers (metadata generation)
├── countyDirectory.ts  County reference data
└── moduleManifest.ts   Module configuration

types/                  TypeScript interfaces
├── project.ts          Core project interface (35+ fields)
├── projectDocument.ts  Document type
├── projectMedia.ts     Graphics/images type
├── projectUpdate.ts    News/update type
├── meeting.ts          Meeting type
└── projectIntake.ts    New project intake type

styles/                 CSS and Tailwind configuration
├── globals.css         Global styles
└── [component CSS modules]

public/                 Static assets (favicon, images, etc.)
supabase/              Supabase database schema configuration
templates/             Reusable content templates
docs/                  Documentation

site.config.ts         Central site configuration (counties, nav)
package.json           Dependencies (Next.js, React, Sanity, etc.)
package-lock.json      Locked dependency versions
tsconfig.json          TypeScript compiler configuration
next.config.ts         Next.js configuration
postcss.config.mjs     PostCSS/Tailwind config
eslint.config.mjs      ESLint rules
```

---

## Feature Completeness Status

### ✅ Complete & Deployed
- **Home page** with county browse cards, stats dashboard, featured projects grid
- **Individual project detail pages** (`/projects/[slug]`) with all sections:
  - Project graphics gallery (with deep zoom viewer)
  - Documents and PDFs
  - Approval timeline
  - Project updates/news feed
  - Meeting history
- **Component library** 110+ reusable React components
- **Sanity CMS integration** with type-safe GROQ queries for all data types
- **Global navigation** (Header, Footer, MobileNav)
- **Project graphics viewer** using OpenSeadragon for high-zoom images
- **SEO setup** (sitemap.ts, robots.ts, metadata generation)
- **Special project handling** (Hilton Bluffs with custom hero, plat viewer, plan button)
- **County-specific views** and workflows documentation
- **Styling** fully built with Tailwind CSS 4 + component-level CSS modules

### ⚠️ Partial / Incomplete
- **Admin workspace** (`components/AdminPanel.tsx`) — structure exists, CRUD functionality not implemented
- **Map page** (`/app/map`) — uses MapPlaceholder component, no real map integration yet
- **Meetings page** (`/app/meetings`) — components exist, page routing may need completion
- **Search page** (`/app/search`) — SearchBox component complete, full-page integration incomplete
- **Project intake workflow** — types and queries exist, UI not fully built

### ❌ Not Yet Implemented
- Full project search functionality across all fields
- Real interactive map (Leaflet, Mapbox, or similar)
- Admin CRUD operations (create/edit/delete projects)
- Project intake form and workflow
- Developer filtering and comparison tools
- User authentication for admin panel

---

## Key Entry Points

### For Understanding Data Flow
1. **Home page:** `app/page.tsx` — Shows how to fetch and display projects
2. **Data fetching:** `lib/queries.ts` — All Sanity GROQ queries
3. **Type safety:** `types/project.ts` — Core data shape
4. **Master component:** `components/ProjectDashboard.tsx` — How to orchestrate related data

### For Adding Features
1. **New pages:** Create in `app/[feature]/page.tsx`
2. **New components:** Add to `components/` folder
3. **New queries:** Add to `lib/queries.ts` with corresponding types
4. **New types:** Add to `types/` folder
5. **Styling:** Use Tailwind CSS or component CSS modules

---

## Environment Setup

### Required for Local Development
```bash
npm install
```

### Local Development Server
```bash
npm run dev
```
Opens http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## Environment Variables Required

The app requires a `.env.local` file (not committed to repo) with:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-05-03
SANITY_API_TOKEN=<your-token>
```

**Status:** Repo is configured for Sanity CMS. No credentials are stored in the repository.

---

## How to Verify This Is Correct

```powershell
# Windows PowerShell
cd C:\CFDT
git status                    # Should show "On branch main" and "up to date"
npm install
npm run dev
```

Then visit http://localhost:3000. You should see:
- Home page with 4 county cards
- Stats grid showing project counts
- Featured projects section
- Recent updates feed

---

## For ChatGPT: How to Use This Document

**Share this file with ChatGPT along with:**

> "I've verified the current state of my CFDT repository. Use this CODEBASE_STATE.md as your baseline. When you make code changes:
>
> 1. Reference specific file paths from the structure above
> 2. Check lib/queries.ts to understand how data is fetched
> 3. Reference types/*.ts for data shapes
> 4. Use existing component patterns as templates
> 5. Ask me for specific file contents if you need verification"

**Then ask ChatGPT to:**
- Build the search page
- Implement the map view
- Create admin CRUD operations
- Or whatever feature you want next

ChatGPT can now reference this document to avoid conflicts and understand the actual codebase structure.

---

## Next Steps for Development

**Recommended priorities:**
1. **Search page** (SearchBox component exists → integrate into `/app/search/page.tsx`)
2. **Map page** (replace MapPlaceholder with real Leaflet/Mapbox integration)
3. **Admin CRUD** (build forms to create/edit/delete projects in Sanity)
4. **Project intake** (UI for the intake workflow)

---

## Document History

- **2026-07-17:** Initial verification and documentation

---

**Last Updated:** 2026-07-17  
**Status:** Ready for ChatGPT integration