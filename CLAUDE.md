# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"The Gradient" - An AI/ML focused blog built with Next.js 16, deployed as a static site to GitHub Pages. The blog supports both local markdown files and Supabase-hosted content.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build static export to ./out directory
npm run lint     # Run ESLint
```

## Architecture

### Data Flow
Posts come from two sources merged in `src/lib/posts.js`:
1. **Local markdown files** in `/posts/*.md` (files starting with `_` are ignored)
2. **Supabase database** (`posts` table) - takes priority over local files with same ID

Markdown content is processed with `gray-matter` (frontmatter) and `remark`/`remark-html` (rendering).

### Routing Structure
- `/` - Homepage with all posts grid (client-side, fetches from Supabase)
- `/[slug]/` - Individual post pages (statically generated)
- `/section/[category]/` - Category pages (Classic, Trend, Guide, News)
- `/admin/` - CMS with markdown editor, image uploads, and post management

### Key Files
- `src/lib/posts.js` - Post fetching logic with Supabase/local file merging
- `src/lib/supabase.js` - Supabase client initialization
- `src/app/[slug]/page.js` - Post detail with SEO, related posts, reading time
- `src/app/admin/page.js` - Full CMS with sidebar, media manager, live preview

### Static Export Configuration
`next.config.mjs` exports as static site with:
- `output: 'export'` - Static HTML export
- `trailingSlash: true` - URLs end with `/`
- `images: { unoptimized: true }` - Required for static export

### Post Frontmatter Schema
```yaml
title: "Post Title"
date: "YYYY-MM-DD"
tag: "Classic" | "Trend" | "Guide" | "News"
summary: "Brief description"
image: "/images/cover.jpg"  # optional
```

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages. The site is served at `https://minyoungci.github.io`.

## Supabase Schema

The `posts` table expects: `id` (slug), `title`, `date`, `tag`, `summary`, `content`, `image`

Images are stored in Supabase Storage bucket named `images`.
