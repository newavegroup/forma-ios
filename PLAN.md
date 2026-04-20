# Forma: Implementation Plan
# Phase 1 — InBody Parser

Generated from PRD. Vertical-slice approach: each phase delivers a thin, end-to-end working slice before the next phase begins. No phase depends on UI being built first.

---

## Architectural Decisions (Durable, All Phases Reference These)

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | Matches NEWAVE CRM stack, API routes + frontend in one repo |
| Database | Prisma + Railway Postgres | `DATABASE_URL` already in Railway env. Prisma gives typed queries and migration history without raw SQL files. |
| Auth | NextAuth.js CredentialsProvider | Single-user, no users table. Credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. `NEXTAUTH_SECRET` in Railway. All routes/pages protected via `getServerSession`. |
| PDF Storage | Railway volume at `/data/inbody-pdfs/` | Already mounted. Path pattern: `{user_id}/{scan_date}_{uuid}.pdf`. Served via protected API route only. |
| AI | Claude API direct | No orchestration layer per PRD decision |
| Infra | Railway (already live) | forma1818.up.railway.app. Stay on Railway. |
| Language | TypeScript throughout | Type safety on all module interfaces, especially parser output |
| PDF extraction | pdf-parse (text-first) → Claude Vision (fallback) | Most InBody PDFs are text-selectable, vision only when needed |
| Schema | Multi-user-ready from day 1 | user_id on every Prisma model, even though v1 is single-user |
| Testing | Vitest for unit, eval sets for AI modules | Deterministic modules = unit tests, AI modules = eval sets |

---

## Module Dependency Map

```
InBody Parser
    └── Calibration Engine
            └── Weekly Plan Generator
                    └── Daily Logger
                            └── AI Coach
                                    └── Progress Dashboard
```

Build in this order. Each module is independently testable before the next depends on it.

---

## Phase 1: InBody Parser

### Goal
A function that takes an InBody PDF file and returns a validated, structured body composition object. No UI, no database, no API route yet. Just the core parsing logic, tested against real PDFs.

### User Stories Covered
- US-1: Upload first InBody PDF as baseline
- US-5: Confirm or edit parsed data before save
- US-7: Parse weight, muscle mass, body fat %, body fat mass, visceral fat

### Vertical Slice
```
PDF file (binary)
  → text extraction (pdf-parse)
  → field mapping (regex + heuristics)
  → confidence scoring
  → structured output + validation
  → [fallback] Claude Vision if text extraction fails
  → unit tests pass against 3+ real PDF samples
```

### Durable Schema (this shape is locked, all downstream modules reference it)

```typescript
// types/inbody.ts

export interface InBodyScan {
  scan_date: string           // ISO date string "YYYY-MM-DD"
  weight_kg: number
  muscle_mass_kg: number
  body_fat_percent: number
  body_fat_mass_kg: number
  visceral_fat: number        // InBody score 1-20, not a percentage
  raw_pdf_url?: string        // populated after Supabase Storage upload
  parsed_confidence: 'high' | 'low'
  flagged_fields?: string[]   // fields that triggered low confidence
}

export interface ParseResult {
  success: boolean
  data?: InBodyScan
  error?: string
  raw_text?: string           // stored for debugging, not shown to user
}
```

### File Structure for This Phase

```
forma/
├── lib/
│   └── inbody/
│       ├── parser.ts          # main parse() function
│       ├── extractor.ts       # PDF text extraction
│       ├── mapper.ts          # text → structured fields
│       ├── confidence.ts      # scoring logic
│       └── vision-fallback.ts # Claude Vision if text fails
├── types/
│   └── inbody.ts              # ParseResult + InBodyScan interfaces
└── tests/
    └── inbody/
        ├── parser.test.ts
        └── fixtures/          # real InBody PDFs (gitignored)
            ├── inbody-570.pdf
            ├── inbody-770.pdf
            └── inbody-970.pdf
```

### Implementation Steps

#### Step 1.1 — Project scaffold
- Init Next.js project with TypeScript
- Install: `pdf-parse`, `@anthropic-ai/sdk`, `vitest`
- Configure `tsconfig.json`, `vitest.config.ts`
- Create `/types/inbody.ts` with the locked interfaces above
- **Acceptance**: `npx tsc --noEmit` passes on empty scaffold

#### Step 1.2 — PDF text extraction (`extractor.ts`)
- Wrap `pdf-parse` to extract raw text from a Buffer
- Return `{ text: string, pageCount: number, extractionMethod: 'text' | 'vision' }`
- Handle: empty text (triggers vision fallback), malformed PDF (throws with clear error)
- **Acceptance**: given a real InBody PDF buffer, returns non-empty text string containing at least one of: "Weight", "Skeletal Muscle Mass", "Body Fat Mass"

#### Step 1.3 — Field mapper (`mapper.ts`)
- Parse raw text into structured fields using regex patterns
- InBody PDF labels to target:
  - Weight → `weight_kg`
  - Skeletal Muscle Mass → `muscle_mass_kg`
  - Percent Body Fat → `body_fat_percent`
  - Body Fat Mass → `body_fat_mass_kg`
  - Visceral Fat Level → `visceral_fat`
  - Date (look for ISO or localized date near top of document) → `scan_date`
- Each field extractor is a separate function, independently testable
- Return `Partial<InBodyScan>` (some fields may not be found)
- **Acceptance**: given the text of a known InBody PDF, all 6 fields are extracted within ±0.1 of ground truth

#### Step 1.4 — Confidence scorer (`confidence.ts`)
- Input: `Partial<InBodyScan>`
- Rules:
  - All 6 fields present + values in physiological range → `'high'`
  - 1-2 fields missing or out of range → `'low'`, populate `flagged_fields`
  - 3+ fields missing → `success: false`, trigger re-upload
- Physiological ranges (validation gates):
  - `weight_kg`: 40–200
  - `muscle_mass_kg`: 10–80
  - `body_fat_percent`: 3–60
  - `body_fat_mass_kg`: 2–100
  - `visceral_fat`: 1–20
- **Acceptance**: a scan with one field out of range returns `confidence: 'low'` and that field in `flagged_fields`

#### Step 1.5 — Vision fallback (`vision-fallback.ts`)
- Triggered when `extractor.ts` returns empty or near-empty text
- Convert PDF pages to base64 images (use `pdf2pic` or `sharp`)
- Send to Claude API with a structured extraction prompt
- Prompt returns JSON matching `InBodyScan` shape
- **Acceptance**: given a scanned (non-text) InBody PDF image, returns all 6 fields within ±0.5 of ground truth

#### Step 1.6 — Main parser (`parser.ts`)
- Orchestrates the above: extract → map → score → fallback if needed
- Single public interface: `async function parse(pdfBuffer: Buffer): Promise<ParseResult>`
- **Acceptance**: integration test with 3 real PDFs (different InBody models), all return `success: true` with `confidence: 'high'`

#### Step 1.7 — Eval set
- Collect 3–5 real InBody PDFs with known ground truth values
- Write `parser.test.ts` with exact assertions per PDF
- Store fixtures in `tests/inbody/fixtures/` (gitignored, never committed)
- **Acceptance**: all tests pass, median field error < 0.5 units

---

## Phase 2: Auth + Schema + Storage (runs in parallel with Phase 1)

### Goal
NextAuth is wired and protecting routes. Prisma schema is migrated to Railway Postgres. Parser output can be persisted. InBody PDFs saved to Railway volume.

### Step 2.1 — NextAuth setup

- Install: `next-auth`
- Create `app/api/auth/[...nextauth]/route.ts` with CredentialsProvider
- Validate credentials against `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars
- Set `NEXTAUTH_SECRET` in Railway environment variables
- Protect all API routes with `getServerSession` — return 401 if no session
- Protect all app pages — redirect to `/login` if no session
- **Acceptance**: hitting any API route or page without a session returns 401 / redirects to login. Valid credentials return a session.

### Step 2.2 — Prisma schema

Install: `prisma`, `@prisma/client`

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model InBodyScan {
  id               String   @id @default(cuid())
  userId           String
  scanDate         DateTime @db.Date
  weightKg         Decimal  @db.Decimal(5, 2)
  muscleMassKg     Decimal  @db.Decimal(5, 2)
  bodyFatPercent   Decimal  @db.Decimal(5, 2)
  bodyFatMassKg    Decimal  @db.Decimal(5, 2)
  visceralFat      Int
  pdfPath          String?
  parsedConfidence String
  flaggedFields    String[]
  createdAt        DateTime @default(now())

  dailyTargets DailyTarget[]
}

model DailyTarget {
  id               String     @id @default(cuid())
  userId           String
  effectiveDate    DateTime   @db.Date
  proteinG         Int
  carbsGTraining   Int
  carbsGRest       Int
  fatG             Int
  caloriesTraining Int
  caloriesRest     Int
  rationale        String?
  sourceScanId     String?
  sourceScan       InBodyScan? @relation(fields: [sourceScanId], references: [id])
  createdAt        DateTime   @default(now())

  @@unique([userId, effectiveDate])
}

model TrainingSchedule {
  id           String   @id @default(cuid())
  userId       String
  date         DateTime @db.Date
  isTrainingDay Boolean @default(false)
  trainingType String?
  durationMin  Int?
  createdAt    DateTime @default(now())

  @@unique([userId, date])
}

model WeeklyPlan {
  id              String   @id @default(cuid())
  userId          String
  weekStart       DateTime @db.Date
  planJson        Json
  groceryListJson Json?
  createdAt       DateTime @default(now())

  @@unique([userId, weekStart])
}

model MealLog {
  id               String   @id @default(cuid())
  userId           String
  loggedAt         DateTime @default(now())
  isTrainingDay    Boolean
  rawInput         String
  estimatedProteinG Decimal? @db.Decimal(6, 1)
  estimatedCarbsG  Decimal? @db.Decimal(6, 1)
  estimatedFatG    Decimal? @db.Decimal(6, 1)
  estimatedCalories Int?
  confirmed        Boolean  @default(false)
  createdAt        DateTime @default(now())
}

model CoachConversation {
  id          String   @id @default(cuid())
  userId      String
  sessionDate DateTime @db.Date
  messagesJson Json    @default("[]")
  createdAt   DateTime @default(now())

  @@unique([userId, sessionDate])
}
```

- Run `prisma migrate dev --name init` locally against Railway Postgres
- Add `prisma generate && prisma migrate deploy` to Railway deploy command
- **Acceptance**: `prisma studio` shows all tables, schema matches above

### Step 2.3 — Railway volume storage helper

- Create `lib/storage.ts` — thin wrapper for reading/writing PDFs to `/data/inbody-pdfs/`
- Interface: `savePdf(userId, scanDate, buffer): Promise<string>` → returns file path
- Interface: `getPdf(filePath): Promise<Buffer>`
- Create `app/api/inbody/pdf/[...path]/route.ts` — protected route that reads from volume and streams the file
- **Acceptance**: upload a file via `savePdf`, retrieve it via the API route with a valid session; 401 without session

---

## Phase 3: API Route + Onboarding Integration (after Phase 1 + 2 pass)

### Goal
Wire the parser into a Next.js API route. Connect to onboarding Screen 5 (upload) and Screen 6 (confirmation). Parser output hits the database.

### Slice
```
POST /api/inbody/upload          (protected — 401 if no session)
  → receive multipart/form-data (PDF file)
  → call parser.parse(buffer)
  → if success: save PDF to Railway volume via lib/storage.ts
  → return ParseResult to client (not saved to DB yet)
  → client shows Screen 6 (confirmation)

POST /api/inbody/confirm         (protected — 401 if no session)
  → receive confirmed InBodyScan (user may have edited fields)
  → insert into InBodyScan via Prisma
  → trigger Calibration Engine (Phase 4)
  → return daily_targets to client
  → client shows Screen 7 (targets reveal)
```

### Acceptance Criteria
- Upload a real InBody PDF via the API route, get back correct parsed values
- Edit one field on the confirmation screen, confirm, verify corrected value is what's saved in DB
- Low confidence parse: flagged fields are highlighted on Screen 6, primary button disabled until user touches each flagged field
- Parse failure: clear error, re-upload option available

---

## Phase 4: Calibration Engine (after Phase 1 passes)

Separate plan document. Pure TypeScript function, no LLM, fully unit-testable. Takes `InBodyScan + goal + training_schedule`, returns `daily_targets + rationale`.

---

## Phase 5: Daily Logger Eval Set (before building logger UI)

Separate plan document. Build eval set of 20–30 weighed meals with ground truth macros. Write and iterate the Claude estimation prompt. Must clear median error < 15% before UI is built.

---

## Acceptance Criteria: Phase 1 Complete

All of these must be true before moving to Phase 3:

- [x] `parse(buffer)` returns `success: true` for real InBody PDFs
- [x] All 6 fields extracted within ±0.5 of hand-verified ground truth (InBody120 Spanish eval passing)
- [x] Low confidence parse correctly identifies flagged fields
- [x] Vision fallback triggered and working (mocked + injectable)
- [x] `npx vitest` passes all 73 tests in `tests/inbody/`
- [x] TypeScript interfaces in `types/inbody.ts` are locked and documented

## Acceptance Criteria: Phase 2 Complete

All of these must be true before moving to Phase 3:

- [ ] NextAuth CredentialsProvider wired — valid session grants access, missing session returns 401/redirect
- [ ] `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` set in Railway environment
- [ ] Prisma schema migrated to Railway Postgres — all tables exist, `prisma studio` confirms
- [ ] `lib/storage.ts` saves and retrieves PDFs from Railway volume at `/data/inbody-pdfs/`
- [ ] PDF retrieval API route returns 401 without valid session

---

## What This Plan Does Not Cover Yet

- Meal Plan Generator prompt engineering
- AI Coach context bundle assembly
- Progress Dashboard queries
- Frontend components (build after parser + calibration are proven)
- Railway cron job for Sunday plan generation
- Notification layer
