# SkillSync AI Engineering Decision & Development Journal

This document is an internal engineering journal for SkillSync AI. It is not intended to be marketing copy, onboarding documentation, or a polished product spec. Its purpose is to preserve the reasoning behind system decisions: what we believed at the time, what changed, what broke, what we learned, and why the architecture evolved in the direction it did.

SkillSync AI is an AI-powered Upwork job matching platform for freelancers. The system combines Next.js, TypeScript, Supabase, PostgreSQL, Playwright, OpenAI or Gemini-style AI models, n8n workflow automation, and Docker-ready deployment patterns.

The project started as a simple matching assistant. It gradually became a SaaS architecture exercise: authentication, user profiles, scraping, matching, AI explanation, workflow orchestration, rate limiting, database normalization, and future worker separation all became important once the application moved from idea to usable MVP.

---

## 1. Initial Project Idea

The original concept for SkillSync AI was straightforward: help freelancers find better Upwork jobs faster. Many freelancers waste time manually scanning job feeds, reading vague job descriptions, estimating whether a post is worth a proposal, and deciding whether their skills match what the client actually needs.

The first MVP vision was intentionally narrow:

- let a user describe their skills and niche
- search for a target category such as AI automation, n8n, API integration, or GoHighLevel
- collect recent Upwork jobs
- score each job against the user's profile
- explain why a job might be worth applying to

The niche was selected because freelance marketplaces create a high-volume decision problem. The user does not need more jobs; they need better filtering. AI automation and integration work also has messy language. A client may say "connect my CRM to Slack" while the freelancer thinks in terms of n8n, Zapier, webhook handling, REST APIs, OAuth, data mapping, and automation maintenance. That semantic gap made the project a good candidate for AI-assisted matching.

The early assumption was that a basic keyword matching system would be enough for an MVP. That assumption was only partially true. Keyword overlap can identify obvious matches, but it fails when clients describe problems instead of tools. For example, "automate lead routing from Facebook ads into our sales pipeline" may be a strong match for someone skilled in GoHighLevel, webhooks, and Zapier even if the exact words are absent.

This is where the project began evolving. It was no longer just a search UI. It needed a durable profile model, a collection pipeline, a scoring engine, an AI explanation layer, and a way to persist searches and matches over time.

The important early lesson was that the product value was not in scraping alone. Scraping only collects raw opportunity data. The actual product value is interpretation: fit, risk, relevance, timing, missing skills, and whether the job is worth the freelancer's limited proposal energy.

---

## 2. Early Architecture Decisions

The first architecture question was whether to build SkillSync AI as a simple script, a backend API, or a full SaaS application. A script would have validated the scraping and matching concept quickly, but it would not support user profiles, search history, authentication, or a dashboard. A pure backend API would have provided good separation but slowed down MVP delivery because the frontend still needed to exist.

Next.js was selected because it offered a pragmatic middle path:

- App Router for structured application pages
- API routes for backend endpoints
- server-side session checks
- TypeScript across frontend and backend
- simple deployment story
- ability to evolve from modular monolith to separated services later

Alternatives considered:

- Express or Fastify backend plus React frontend: stronger backend separation, but more operational overhead for MVP.
- Python FastAPI backend: attractive for scraping and AI work, but would split language/runtime concerns early.
- A no-code first build: fast for workflows, but poor for durable product architecture and custom matching logic.
- A browser extension: useful for Upwork browsing, but not ideal for centralized job collection, matching history, or SaaS billing later.

Supabase was selected because it reduced infrastructure burden while still providing PostgreSQL, authentication, row-level security, and a path toward production. The project needed real relational modeling, not just document storage. Profiles, searches, jobs, and matches have clear relationships, and PostgreSQL is a natural fit.

Browser automation became necessary because Upwork does not provide a simple public API for this use case. Playwright was chosen because the job collection problem is browser-shaped: dynamic pages, rendered content, selectors, navigation timing, and anti-automation behavior. A simple HTTP fetch approach was considered, but it would likely fail against dynamic marketplace pages.

AI matching was added because deterministic scoring alone could not fully explain job fit. The architecture deliberately avoided letting AI own the entire score. The engineering decision was to keep deterministic scoring as the core and use AI to enrich the explanation. That decision preserves explainability and reduces hallucination risk.

The first major architectural stance was therefore:

- deterministic systems should decide core state
- AI should explain, summarize, and augment
- scraping should be isolated
- persistence should be normalized
- the first deployment should be a modular monolith, not premature microservices

---

## 3. First Major Pivot

The first major pivot was moving away from "search and display jobs" toward a layered matching system.

The original approach treated collection and matching as one flow: search Upwork, parse results, compute a score, display cards. That was attractive because it was simple. It became insufficient once we considered saved profiles, search history, deduplication, match explanations, and future scheduled alerts.

The engineering realization was that scraped jobs are not user-specific, but matches are. A single scraped job may be relevant to many users, while each user's match score and insight should be stored separately. That required separating:

- `scraped_jobs`: source data collected from Upwork
- `searches`: a user's query and search run
- `job_matches`: a user-specific interpretation of a job

This pivot changed the database and service architecture. Instead of treating the scraper as the application, it became one dependency of a search orchestration service.

The second part of the pivot was isolating automation from backend logic. Playwright is inherently fragile. Selectors change, pages load differently, anti-bot systems intervene, and scraping failures should not corrupt business logic. The scraper was placed behind a `JobScraper` interface so the rest of the app only depends on a stable contract:

- input: query and limit
- output: normalized scraped jobs

That decision keeps the matching engine independent from Upwork page structure. It also makes it possible to replace Playwright later with a compliant API, a data partner, RSS-like feed, manual import, or n8n-triggered ingestion without rewriting profile matching.

The project also pivoted from pure static matching to AI-assisted matching. The key insight was that match percentage and match explanation are different responsibilities. The percentage should be deterministic enough to test. The explanation can use AI, but it must be bounded by real profile and job data.

---

## 4. Frontend Engineering Decisions

The frontend started as a basic dashboard idea: login, profile, search, results. The risk was letting each page become a custom island with duplicated form handling, repeated loading states, and inconsistent UI patterns.

Reusable components were introduced early to prevent that drift. The initial UI primitives included button, input, textarea, label, card, and badge components. This was not about building a full design system immediately. It was about creating a consistent surface for a SaaS interface before the dashboard grew.

The routing structure followed the product boundaries:

- `/auth/login`
- `/auth/signup`
- `/dashboard`
- `/api/profile`
- `/api/searches`
- `/api/matches`

The dashboard subroutes for profile, search, and matches redirect back to the main dashboard for now. This keeps the MVP simple while preserving route names that may become full pages later.

State management was intentionally kept local. React state is enough for:

- auth forms
- profile form fields
- search progress
- match list refresh

Global state management was considered but rejected for the MVP. Zustand or Redux would add structure, but at this stage the state graph is shallow and server-backed. The more important architectural boundary is between client interactions and API routes, not between multiple client stores.

One early mistake was underestimating how quickly dashboard UI can become operational software rather than a marketing page. The product is used repeatedly, likely by freelancers scanning opportunities. That means the UI should be dense, scannable, and stable. The design moved toward quiet cards, concise badges, clear match percentages, and restrained visual styling instead of oversized hero sections.

Loading, empty, and error states were added because the dashboard can legitimately have no profile, no matches, scraping failures, auth failures, or AI fallback behavior. The frontend had to represent those states honestly instead of assuming a perfect happy path.

The frontend architecture improved when it stopped trying to be page-centric and became workflow-centric:

- profile setup creates matching context
- search creates a collection and scoring run
- match cards present decision-ready results

---

## 5. Backend Engineering Evolution

Backend responsibilities expanded quickly. The first backend mental model was "API routes call Supabase." That was not enough.

The backend now has several distinct responsibilities:

- authenticate the user
- validate input
- normalize and sanitize profile data
- rate-limit expensive search operations
- create search records
- run the scraper
- persist scraped jobs
- compute deterministic matches
- optionally enrich matches with AI
- persist match results
- expose dashboard data

Putting all of that inside route handlers would have created a monolith in the worst sense: each route would know about validation, Supabase table names, scraping details, AI prompts, and matching math. Service layers were introduced to prevent that.

The backend evolved into:

- route handlers for HTTP concerns
- services for business logic
- repositories for persistence
- utilities for pure helpers
- types for DTOs and domain shapes

This separation matters because each layer changes for different reasons. Route handlers change when HTTP behavior changes. Repositories change when the database schema changes. Matching changes when scoring improves. Scraping changes when Upwork changes. AI insights change when prompt strategy or model provider changes.

Validation improved once it became clear that scraping and AI calls are expensive. Invalid input should fail before creating search jobs or launching browser automation. Zod schemas were introduced for profile and search DTOs.

Error handling also evolved. Initially, it is tempting to return raw errors during development. The API layer now uses a central `handleApiError` helper to distinguish validation errors, application errors, and unexpected server errors. This is still basic, but it creates a reliable pattern for future error reporting.

One debugging discovery was that build-time rendering and runtime Supabase sessions do not mix unless dynamic behavior is explicit. The dashboard and API routes were marked dynamic so production builds do not attempt to prerender auth-dependent pages without environment variables or user context.

---

## 6. Database Design Evolution

The first schema idea was simple: store a user profile as one JSON object and store scraped jobs as another JSON blob. That would have been fast, but it would have limited querying, indexing, deduplication, and later analytics.

The schema evolved toward normalized tables:

- `users`
- `freelancer_profiles`
- `profile_skills`
- `profile_tools`
- `profile_technologies`
- `searches`
- `scraped_jobs`
- `job_matches`

The most important design change was separating profile attributes into related tables instead of storing comma-separated strings. Skills, tools, and technologies need to be searchable, comparable, and eventually embeddable. Normalization keeps those options open.

Another important change was separating scraped jobs from job matches. A scraped job is source data. A match is user-specific interpretation. If those are combined, deduplication becomes difficult and the same job gets stored repeatedly for different users. By separating them, the system can later support:

- job deduplication
- multi-user matching
- source quality analysis
- historical job tracking
- analytics on recurring skills

Indexing was introduced around expected access patterns:

- searches by user and creation time
- scraped jobs by source and source job id
- matches by user and search
- matches by match percentage

The database design anticipates future scaling problems. `scraped_jobs` can grow large if search volume increases. `job_matches` can grow faster because it is per user and per search. This suggests future partitioning or archival strategies around created date, source, and user activity.

Row-level security became part of the schema, not an afterthought. User-owned tables need RLS from the beginning because SaaS data boundaries are foundational. Scraped jobs are more nuanced: they are source data, but users should only see them through their own matches.

---

## 7. AI System Evolution

The first AI idea was to ask a model whether a job matched a freelancer. That approach is attractive but risky. It can produce plausible explanations without stable scoring, and it can hallucinate missing context.

The system evolved toward a hybrid model:

- deterministic scoring calculates match percentage
- AI generates explanation and nuance
- deterministic fallback remains available if the AI provider is unavailable

This decision was made because match scores affect user trust. If the score changes unpredictably between model calls, users cannot learn from it. A deterministic score can be tested and tuned. AI can then explain why the score makes sense, identify missing skills, and estimate fit.

Prompting started as open-ended prose generation. It evolved toward JSON output with specific fields:

- `whyMatches`
- `missingSkills`
- `estimatedFit`
- `difficultyEstimation`

That structure is important because the UI expects durable fields, not arbitrary paragraphs. It also makes fallback behavior easier.

The main AI risks identified were:

- hallucinating skills not present in the job
- overstating fit
- ignoring budget and proposal competition
- producing inconsistent difficulty estimates
- failing to return valid JSON

The mitigation strategy is to keep the model on a short leash. It receives the profile, job fields, and deterministic score. It is not asked to invent the score. It is asked to enrich the explanation.

The next likely evolution is embeddings. Keyword overlap is useful but limited. Embeddings would allow semantic matching between profile capabilities and job intent. For example, "lead routing automation" could match "CRM workflow design" even without shared terms. The architecture leaves room for this by keeping matching inside a dedicated service.

---

## 8. Browser Automation & Scraping Decisions

Playwright was introduced because Upwork job pages are rendered as browser experiences, not simple static documents. A scraping layer needed to handle navigation, page timing, selectors, and dynamic content.

The scraper was deliberately isolated because scraping is one of the least stable parts of the system. The target site can change markup, throttle requests, require login, block automation, or alter its search experience. None of those changes should force rewrites in the profile service, matching service, or dashboard.

Scraping tradeoffs were considered early:

Scraping gives fast MVP access to public job data, but it introduces reliability and compliance questions. APIs or partner feeds would be more stable and compliant, but may not exist or may be difficult to access. Manual import would be safer but less useful. Browser automation is practical for prototyping but should be treated as replaceable infrastructure.

Anti-bot considerations shaped several decisions:

- rate-limit user-triggered searches
- keep scraping behind a service boundary
- avoid assuming every search returns results
- persist search status and error states
- design for future background workers

The current Playwright implementation is intentionally minimal. It normalizes job cards into a domain type, but the selectors may need refinement against real Upwork pages. This is expected. The architecture accepts that scraper reliability will improve iteratively.

The deeper engineering lesson is that scraping should not be the product's core identity. The product is matching intelligence. Collection is only one input source.

---

## 9. Workflow Automation Evolution

n8n entered the architecture as the system began to outgrow strictly request-response behavior. Job matching can be triggered by a user search, but it can also become scheduled, event-driven, or notification-driven.

Potential n8n responsibilities include:

- scheduled searches for saved niches
- daily digest generation
- notification workflows
- enrichment retries
- CRM or email integration
- webhook-based ingestion from external sources
- human review loops for high-value job alerts

The engineering decision was not to put all logic into n8n. Workflow tools are excellent for orchestration, but they are weaker as homes for core domain logic. Matching algorithms, schema rules, validation, and user authorization should remain in backend services where they can be typed, tested, versioned, and reviewed.

The hybrid boundary became:

- backend services own domain logic
- n8n owns orchestration around that logic
- API endpoints expose controlled operations
- database records represent durable state

This boundary prevents workflow sprawl. If every matching rule lives inside n8n nodes, the system becomes difficult to test and reason about. If every scheduled operation lives inside the app server, the backend becomes responsible for orchestration it does not need to own.

The future architecture may use n8n to call internal API routes or worker endpoints:

- start scheduled search
- enrich pending matches
- send digest email
- notify user of jobs above a threshold

The important decision is that n8n should coordinate work, not become the source of truth for business rules.

---

## 10. Major Debugging Discoveries

Several debugging lessons shaped the current implementation.

### Supabase Environment Variables During Build

The first production build failed when the dashboard attempted to access Supabase server configuration during prerendering. The root cause was that auth-dependent pages were being treated as candidates for static generation. Since the dashboard requires runtime cookies and Supabase environment variables, build-time execution was the wrong mode.

The fix was to mark auth-aware pages and API routes as dynamic. This made the runtime boundary explicit and prevented Next.js from evaluating session-dependent logic during static generation.

Engineering lesson: any route that depends on cookies, authenticated user state, or runtime secrets should be treated as dynamic in Next.js App Router.

### Next.js Dev Cache and Build Interaction

Another discovery happened when a development server was running while a production build was executed. The dev server later returned a React Server Components manifest error involving Next devtools. The issue was not application code; it was stale generated state after build artifacts changed underneath the dev process.

The fix was to stop the dev server, clear `.next`, and restart the server cleanly.

Engineering lesson: do not trust a dev server that has survived major build artifact changes. Restarting after production builds avoids confusing framework-level cache errors.

### ESLint Script Drift

The initial `next lint` script became interactive and deprecated in the installed Next.js version. This created a bad developer experience because `npm run lint` could block instead of validating code.

The fix was to switch to the ESLint CLI with an explicit flat config.

Engineering lesson: framework defaults change. Production projects should prefer explicit scripts over commands that may become interactive.

### TypeScript Integration Issues

The project encountered type friction around cookie callback typing, generic Supabase row access, and UI state narrowing. These were not architectural failures, but they showed where TypeScript protects boundaries.

The fixes were:

- explicitly type Supabase cookie setter payloads
- narrow experience level state to its union type
- avoid unsafe dynamic row access without explicit conversion

Engineering lesson: small type errors often reveal unclear boundaries. Fixing them precisely is better than weakening compiler settings.

### API Formatting and JSON Shape Risk

AI output creates a JSON parsing risk. A model may return invalid JSON, omit fields, or return values outside expected enums. The current design catches AI failures and falls back to deterministic insight.

Engineering lesson: AI should be treated like an unreliable external dependency. It can enrich the system, but it should not be allowed to break core workflows.

### Scraper Failure Expectations

The scraper may return no jobs due to selector drift, network conditions, anti-bot behavior, or page changes. The system cannot assume scraping success.

The search service therefore treats scraping as a fallible dependency and updates search status accordingly.

Engineering lesson: scraping failures are normal operational events, not exceptional surprises.

---

## 11. Scalability Realizations

The first MVP can run as a modular monolith. At small scale, this is the right choice because it keeps deployment simple and allows fast iteration. But the system has obvious future pressure points.

The first component that would break at scale is scraping. Browser automation is CPU-heavy, memory-heavy, slow, and subject to external blocking. It should not remain inside request-response API routes for high-volume usage. The future shape is a worker service or queue-backed scraper.

The second pressure point is AI enrichment. Calling AI models for every job match can become slow and expensive. The system will eventually need:

- batching
- caching
- retry handling
- provider abstraction
- cost controls
- background enrichment

The third pressure point is database growth. `scraped_jobs` and `job_matches` can grow quickly. Search-heavy users may generate many match rows. Future work may include retention policies, archiving, source-level deduplication, and analytics tables.

The fourth pressure point is user-triggered synchronous work. A single search currently performs collection, persistence, scoring, AI enrichment, and response generation. This is acceptable for MVP validation, but the production version should likely move toward:

- create search request
- enqueue scraping/matching job
- return search id
- stream or poll status
- update dashboard when complete

The architectural thinking changed from "serve the request" to "model the workflow." That is a major SaaS maturity step.

Future microservice possibilities:

- scraper worker
- matching worker
- AI enrichment worker
- notification service
- analytics service

The current codebase is designed so those services can be extracted later because the main responsibilities are already separated internally.

---

## 12. Security & Reliability Improvements

Security started with authentication, but quickly expanded into data boundaries and input control.

Supabase Auth was selected to avoid building password handling manually. Middleware protects dashboard routes, and API routes require the current user before accessing user-owned data.

Validation became necessary because user input feeds expensive and risky operations. A search query is not just text; it can trigger browser automation and AI calls. Profile fields influence scoring and prompts. Zod schemas were introduced to validate request payloads before they reach services.

Sanitization was added for profile and search text. The current sanitizer is simple, but it establishes the pattern that raw user text should not flow unchecked into persistence, prompts, or automation URLs.

Secret management evolved through environment variables:

- public Supabase URL and anon key for browser-safe use
- service role key reserved for server-only admin operations
- AI provider key kept server-side

Reliability decisions include:

- central API error handling
- deterministic AI fallback
- search status fields
- rate limiting for scrape endpoints
- dynamic route configuration for auth-dependent pages
- Docker-ready deployment scaffolding

The reliability mindset shifted from "make the feature work" to "make failure states explicit." That is especially important in a system with external dependencies: Supabase, Upwork, Playwright, and AI providers can all fail independently.

---

## 13. Software Engineering Principles Applied Over Time

The project gradually moved toward SOLID and clean architecture principles as complexity appeared.

Single responsibility became visible first. Route handlers should not scrape. Scrapers should not score. Repositories should not generate AI insights. UI components should not know table names. Each module needed one reason to change.

Open/closed thinking appeared in the scraper interface and AI provider boundary. The system should be open to new job sources or AI providers without rewriting the dashboard or database access layer.

Dependency inversion appeared when services depended on abstractions like `JobScraper`, not directly on page selectors scattered throughout the app. This is what will allow Playwright to be replaced later.

Separation of concerns became the main architectural discipline:

- `app` owns routing
- `components` own presentation
- `services` own business workflows
- `repositories` own persistence
- `types` own shared contracts
- `utils` own pure helpers

The architecture became messy in the places where early convenience was tempting: route handlers could have grown too large, profile data could have been stored as JSON blobs, AI scoring could have replaced deterministic scoring, and scraping could have been embedded directly into API routes.

Refactoring became necessary before the system was large. That was intentional. The goal was not to over-engineer the MVP, but to avoid placing early code in locations that would be painful to unwind.

The cleanest engineering decision was to keep the system as a modular monolith. It has internal separation without distributed system complexity.

---

## 14. Engineering Mindset Evolution

The project started with feature-building energy: build auth, build profile, build scraper, build matching, show results.

It evolved into systems engineering once the interactions between those features became more important than the features themselves.

The developer mindset shifted in several ways:

From pages to workflows:

The dashboard is not just a page. It represents a workflow: define profile, search market, collect jobs, score fit, explain results, preserve history.

From data storage to data modeling:

The database is not just where results are saved. It defines the system's understanding of users, profiles, jobs, searches, and matches.

From AI novelty to AI reliability:

AI is useful, but only when bounded. The system became more mature when AI stopped being the entire matching engine and became an enrichment layer.

From scraping as capability to scraping as risk:

Browser automation unlocked the MVP, but it also introduced fragility. Treating it as replaceable infrastructure was a key architectural improvement.

From synchronous thinking to async workflow thinking:

Search currently runs in one request, but the system is clearly headed toward jobs, queues, scheduled searches, retries, and notifications.

This is the difference between building a demo and designing a SaaS product. The product is not only what the user sees. It is also how the system behaves when inputs are invalid, providers fail, data grows, pages change, and users return every day expecting consistency.

---

## 15. Future System Evolution

The architecture is intentionally designed to evolve.

The most likely future changes are:

### Background Job Processing

Searches should eventually become asynchronous. A user creates a search, receives a search id, and the backend or worker updates status as scraping, matching, and AI enrichment complete.

Possible technologies:

- Supabase-backed job table
- pg-boss
- BullMQ
- dedicated worker containers
- n8n-triggered orchestration for scheduled flows

### AI Agent Capabilities

Future AI functionality may include:

- proposal generation
- job risk analysis
- client quality scoring
- interview question preparation
- profile improvement recommendations
- personalized search query expansion

These should remain service-layer capabilities, not unbounded model calls from the UI.

### Embeddings and Vector Search

Embeddings are a natural next step. Profile skills, job descriptions, and historical successful matches can be embedded for semantic matching. PostgreSQL with pgvector could support this without abandoning Supabase.

This would improve matching for jobs where clients describe outcomes rather than technologies.

### Analytics Systems

Future analytics could answer:

- which niches produce the best matches
- which skills appear most often
- which searches produce high-fit jobs
- which users are under-profiled
- which job sources produce the highest quality results

Analytics should likely be separated from transactional tables over time.

### Multi-User SaaS Expansion

The schema already supports multiple users. Future SaaS features may include:

- subscriptions
- usage limits
- team workspaces
- saved searches
- job bookmarks
- notification preferences
- billing events

### Infrastructure Improvements

The Docker-ready architecture can evolve into:

- web container
- scraper worker container
- AI worker container
- n8n container
- managed Supabase Postgres
- centralized logging
- job queue
- monitoring and alerting

The important point is that the current architecture does not block these changes. It is not final, but it has the right internal seams for extraction.

---

## 16. Final Engineering Reflection

SkillSync AI evolved from a simple idea into a more serious SaaS system because the problem demanded it. Matching freelancers to jobs is not just a UI problem, a scraping problem, or an AI problem. It is a systems problem involving user identity, structured profiles, unreliable external data, explainable scoring, AI uncertainty, persistence, and operational workflow design.

Several mistakes improved the architecture:

- assuming keyword matching would be enough led to a better hybrid AI strategy
- treating scraping as a direct backend action led to scraper isolation
- trying to build quickly exposed the need for repositories and services
- build and dev-server issues clarified runtime boundaries in Next.js
- AI JSON risks reinforced deterministic fallback design

The strongest architectural lesson is that production-minded MVPs should be simple, but not careless. A modular monolith can move quickly while still preserving clean boundaries. It avoids premature microservices while preparing for future extraction.

The project also demonstrates a shift in engineering maturity. Early development asks, "Can this feature work?" Later development asks:

- what changes when this scales?
- what fails when an external dependency breaks?
- where should this responsibility live?
- what data model will still make sense later?
- how do we keep AI useful without making it dangerous?
- how do we preserve user trust?

SkillSync AI is still early, but its architecture now reflects a real system rather than a collection of features. The current structure creates room for workers, embeddings, n8n workflows, proposal generation, analytics, and multi-user SaaS expansion without discarding the foundation.

The project became stronger because the engineering process allowed pivots. The architecture improved not by guessing everything correctly upfront, but by listening to the system as its complexity became visible.
