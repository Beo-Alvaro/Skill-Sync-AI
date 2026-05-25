# SkillSync AI

AI Upwork Job Matching Assistant for freelancers.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS with shadcn-style primitives
- Supabase Auth and PostgreSQL
- Playwright scraper module
- Manual job import mode (JSON)
- Gemini or OpenAI insight enrichment with deterministic fallback
- Docker-ready build

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in Supabase credentials and configure either Gemini or OpenAI for AI insights.
3. Apply `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor or through Supabase CLI.
4. Install dependencies with `npm install`.
5. Run the app with `npm run dev`.

For Gemini:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

For OpenAI:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
```

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
