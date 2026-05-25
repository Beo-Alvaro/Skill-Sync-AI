# SkillSync AI

AI Upwork Job Matching Assistant for freelancers.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS with shadcn-style primitives
- Supabase Auth and PostgreSQL
- Playwright scraper module
- OpenAI insight enrichment with deterministic fallback
- Docker-ready build

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in Supabase credentials and optionally `OPENAI_API_KEY`.
3. Apply `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor or through Supabase CLI.
4. Install dependencies with `npm install`.
5. Run the app with `npm run dev`.

## Architecture

The codebase is structured as a modular monolith:

- `app`: routes, layouts, and API handlers
- `components`: reusable UI and dashboard features
- `services`: business logic for profile, search, scraping, matching, insights, and rate limiting
- `repositories`: persistence-only Supabase access
- `lib`: framework clients, validation, and config
- `types`: DTOs and domain types
- `utils`: pure helpers, error handling, logging, sanitization, and scoring

The scraper is behind a `JobScraper` interface so it can later move into a dedicated worker or be replaced by a compliant data provider.
