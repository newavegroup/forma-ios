# Forma: Personal Nutrition OS for Hybrid Athletes in Body Recomposition

## Problem Statement

I am a 31-year-old hybrid athlete (Hyrox) in active body recomposition. Existing nutrition apps fail me in three specific ways:

1. **They are food databases with a logging UI, not coaches.** MyFitnessPal and similar tools accept data but return nothing intelligent. They do not know my body composition, they do not adjust to my training load, and they do not answer contextual questions like "is this a good pre-workout meal" or "I overate, how do I adjust tomorrow."

2. **Logging friction is high for daily adherence.** Searching a food database, scanning barcodes, and entering grams for every meal creates enough friction that I stop logging within a week. The act of logging should take 10 seconds, not 2 minutes.

3. **No continuity between body composition data and daily nutrition.** I get InBody scans monthly, but nothing connects those scans to the macros I should be hitting today, or to the meal plan for next week, or to the question of whether what I ate yesterday moved me closer to my recomp goal.

The existing market optimizes for casual calorie counting. I need an operating system that treats nutrition as a training variable, adjusts weekly, and has full context on me.

## Solution

Forma is a personal nutrition OS with a single core loop:

1. **Monthly InBody scan (PDF upload)** → system recalibrates macro targets (protein, carbs, fat, calories) based on the new body composition and training load
2. **Weekly meal plan generation (Sundays)** → a flexible template framework with swappable proteins, carbs, and fats, differentiated by training days vs rest days
3. **Daily conversational logging** → talk to an AI coach like texting a nutritionist ("grilled chicken, rice, and broccoli, a fist of each"), no food database UI, AI estimates macros
4. **Contextual AI coach** → full access to InBody history, current weekly plan, today's logs, and training schedule, answers real-time questions about adjustments
5. **Monthly progress review** → new InBody scan triggers a side-by-side comparison with previous scans, recalibrates the system

The product is a responsive web app, mobile-first for daily logging, desktop for weekly planning and progress review.

## User Stories

### Onboarding and Baseline

1. As a new user, I want to upload my first InBody PDF, so that the system has a baseline body composition to calibrate from.
2. As a new user, I want to input my training schedule (which days are training days, training type, session duration), so that the system can differentiate training day vs rest day targets.
3. As a new user, I want to declare my goal (body recomposition, cut, bulk, maintenance), so that the calibration engine knows the direction of intent.
4. As a new user, I want to set food preferences (protein preferences, dislikes, cultural preferences like Mexican cuisine), so that meal plans feel realistic.
5. As a new user, I want to confirm or edit the parsed InBody data before it is saved, so that parser errors do not corrupt my baseline.

### InBody Ingestion and Calibration

6. As a user, I want to upload a new InBody PDF monthly, so that the system stays calibrated to my actual body.
7. As a user, I want the system to parse weight, muscle mass, body fat percent, body fat mass, and visceral fat from the PDF, so that I have a complete composition picture.
8. As a user, I want to see my calibrated daily macro targets after each InBody upload, so that I understand what changed and why.
9. As a user, I want the system to show me the calibration rationale in plain language ("your muscle mass is up 0.8kg so protein target increases by 15g"), so that I trust the recommendations.
10. As a user, I want to manually override the calibrated targets if I disagree, so that I stay in control of my own plan.

### Weekly Meal Plan Generation

11. As a user, I want a new meal plan generated every Sunday, so that I start the week with a clear framework.
12. As a user, I want meal templates with swappable proteins, carbs, and fats (not rigid recipes), so that I can use what I have in the fridge.
13. As a user, I want different templates for training days vs rest days, so that carbs and calories match my energy expenditure.
14. As a user, I want the weekly plan to hit my macro targets on average across the week, so that I do not have to micromanage daily macros.
15. As a user, I want to see a grocery list generated from the weekly plan, so that I can shop once on Sunday.
16. As a user, I want to regenerate a single day if life gets in the way (work dinner, travel), so that one disrupted day does not break the plan.

### Daily Conversational Logging

17. As a user, I want to log a meal by typing in natural language ("two eggs, oats with berries, black coffee"), so that logging takes 10 seconds.
18. As a user, I want the AI to estimate macros from my description and confirm ("roughly 35g protein, 45g carbs, 12g fat, confirm?"), so that I can correct it before it is saved.
19. As a user, I want to see today's running totals (macros consumed vs target, calories), so that I know where I am at any point in the day.
20. As a user, I want to edit or delete a logged meal, so that mistakes are fixable.
21. As a user, I want the AI to ask clarifying questions only when the estimate would be off by more than 20 percent, so that logging stays fast but accurate when it matters.

### AI Coach (Contextual Q&A)

22. As a user, I want to ask the AI coach "is this a good pre-workout meal" and get an answer based on my current plan and training schedule, so that I can make real-time decisions.
23. As a user, I want to ask "I overate at lunch, how do I adjust dinner" and get a specific recommendation, so that one bad meal does not derail the day.
24. As a user, I want the coach to proactively flag issues ("you are 30g under protein and it is 8pm"), so that I can course correct before the day ends.
25. As a user, I want the coach to have access to my InBody history, this week's plan, today's logs, and my training schedule, so that answers are actually personalized.
26. As a user, I want to ask "why did my protein target go up this month" and get a clear explanation tied to my body composition changes, so that I understand my own plan.
27. As a user, I want the coach to surface patterns across weeks ("you consistently under-eat on training days"), so that I can fix structural issues.

### Progress Dashboard

28. As a user, I want a dashboard that shows my InBody scans side by side over time (weight, muscle mass, body fat percent, visceral fat), so that I can see the trajectory.
29. As a user, I want to see adherence metrics (days logged, target hit rate for macros, streak data), so that I know if the plan is being followed.
30. As a user, I want to see a monthly summary that correlates adherence with body composition changes, so that I can tell if the plan is working.
31. As a user, I want to export my data (InBody history, logs, meal plans), so that I am not locked in.

### Auth and Data Layer

32. As a user, I want a single-user authenticated login, so that my health data is private.
33. As a user, I want all my data stored in one place with a clear schema, so that I can query it later or feed it into other tools.

## Implementation Decisions

### Stack

- Frontend: Next.js (responsive, mobile-first), matches existing NEWAVE CRM stack
- Backend: Next.js API routes calling Claude API directly
- Database: Prisma + Railway Postgres (`DATABASE_URL` already available as Railway env var)
- Auth: NextAuth.js with CredentialsProvider — single-user, validated against `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. No users table needed in v1.
- Storage: Railway volume mounted at `/data/inbody-pdfs/`. File path pattern: `{user_id}/{scan_date}_{uuid}.pdf`. Served via protected API route, never exposed directly.
- Deployment: Railway (already live at forma1818.up.railway.app)
- AI: Claude API direct, no orchestration layer. Each feature is a typed prompt with a structured output schema.

### Modules

**InBody Parser (deep module)**
- Interface: takes a PDF file, returns a structured composition object
- Encapsulates: PDF text extraction, field mapping, validation, confidence scoring
- Outputs: weight, muscle mass, body fat percent, body fat mass, visceral fat level, scan date
- Approach: try text extraction first (InBody PDFs are usually text-selectable), fall back to Claude vision if extraction fails
- Surfaces a confirmation screen to the user before saving, so any parser error is catchable

**Calibration Engine (deep module)**
- Interface: takes composition history + goal + training schedule, returns daily macro targets
- Encapsulates: protein calculation (grams per kg of lean mass, scaled by goal), fat as percent of calories, carbs as remainder, caloric target (TDEE estimation adjusted by goal and training load), training day vs rest day differentiation (carb split only, protein stays constant)
- Outputs a structured target object: protein_g, carbs_g_training, carbs_g_rest, fat_g, calories_training, calories_rest, rationale
- Pure function, no LLM, fully testable

**Meal Plan Generator (deep module)**
- Interface: takes daily targets + preferences + training schedule, returns a 7-day plan
- Encapsulates: template selection, protein/carb/fat swapping, training day vs rest day logic, grocery list generation
- Uses Claude API with a structured output schema
- Plans are templates, not prescriptive recipes. Each meal has a protein slot, carb slot, fat slot, and vegetable slot with multiple swap options.
- Validates total macros against targets before returning. Regenerates if off by more than 5 percent.

**Daily Logger (deep module)**
- Interface: takes natural language input, returns structured meal entry
- Encapsulates: Claude API call with meal estimation prompt, confidence scoring, clarifying question logic, running total calculation
- No food database, trusts AI estimation with a confirmation step
- Stores raw input, estimated macros, confirmed macros, timestamp

**AI Coach (deep module)**
- Interface: takes user question + full context bundle, returns answer
- Context bundle: last 3 InBody scans, current weekly plan, today's logs, current targets, training schedule for the next 48 hours
- Uses Claude API with a system prompt tuned for nutrition coaching
- Maintains conversation history per session, cleared daily to keep context focused

**Progress Dashboard (shallow module, mostly UI)**
- Reads from composition history and logs tables
- Renders charts and side-by-side scan comparisons
- Calculates adherence metrics on the fly

**Auth + Data Layer (deep module)**
- NextAuth.js CredentialsProvider. Credentials validated against `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. `NEXTAUTH_SECRET` set in Railway. No users table in v1.
- All API routes and pages protected with `getServerSession`. Session check is the single auth gate.
- Single-user v1. `user_id` on every Prisma model so multi-user extension is a schema migration, not a rewrite.
- Tables: inbody_scans, daily_targets, training_schedule, weekly_plans, meal_logs, coach_conversations

### Schema Sketch

- `inbody_scans`: id, user_id, scan_date, weight_kg, muscle_mass_kg, body_fat_percent, body_fat_mass_kg, visceral_fat, raw_pdf_url, parsed_confidence
- `daily_targets`: id, user_id, effective_date, protein_g, carbs_g_training, carbs_g_rest, fat_g, calories_training, calories_rest, rationale
- `training_schedule`: id, user_id, date, is_training_day, training_type, duration_min
- `weekly_plans`: id, user_id, week_start, plan_json (7 days of meal templates), grocery_list_json
- `meal_logs`: id, user_id, logged_at, is_training_day, raw_input, estimated_protein_g, estimated_carbs_g, estimated_fat_g, estimated_calories, confirmed (bool)
- `coach_conversations`: id, user_id, session_date, messages_json

### Key Interactions

- Sunday 8am: Railway cron hits an API route that generates the week's plan and sends a notification
- InBody upload: triggers parser → calibration engine → updates daily_targets → notifies user of changes
- Daily log: chat interface on mobile, running totals always visible, coach suggestions appear inline when targets drift
- Coach questions: accessible from any screen via a persistent input, context bundle assembled server-side before each call

## Testing Decisions

Good tests exercise external behavior, not implementation. The InBody Parser and Calibration Engine are the highest-value test targets because they are deterministic and deep.

- **InBody Parser**: test with real InBody PDF samples, assert parsed fields match ground truth within tolerance. Test that low-confidence parses trigger the confirmation screen prominently.
- **Calibration Engine**: test with synthetic composition histories and goals, assert macro targets move in the expected direction (more muscle mass → more protein, cut goal → caloric deficit, training day → more carbs than rest day).
- **Meal Plan Generator**: integration test that generated plans hit weekly macro targets within 5 percent tolerance on average. Snapshot test that plans respect preference constraints.
- **Daily Logger**: evaluation set of natural language meal descriptions with known macro ground truth, measure estimation error. Target: median error under 15 percent, tail error under 30 percent.
- **AI Coach**: evaluation set of real questions with expected answer shape, tested as LLM-as-judge evaluations rather than exact match.
- **Dashboard and Auth**: smoke tests only, thin layers.

## Out of Scope (v1)

- Micronutrient tracking (vitamins, minerals, deficiency flags)
- Nutrient timing windows (pre/intra/post-workout macro splits)
- Photo-based meal logging (text only in v1)
- Multi-user support (single user initially, schema is multi-user-ready)
- Restaurant meal database or integration
- Wearable integration (Whoop, Garmin, Oura) for training load auto-sync
- Supplement tracking
- Hydration tracking as a first-class feature
- Recipe instructions or cooking guidance, plans are templates not recipes
- Barcode scanning or food database fallback
- Social features, sharing, accountability partners
- Offline mode
- Native mobile apps (responsive web only in v1)

## Further Notes

### Confirmed decisions

- **AI layer**: Claude API called directly from Next.js API routes, no orchestration layer
- **Auth**: NextAuth.js CredentialsProvider, single-user, env-based. No users table in v1.
- **Database**: Prisma ORM + Railway Postgres. Migrations via `prisma migrate dev` locally against Railway DB, or as part of Railway deploy command.
- **PDF storage**: Railway volume at `/data/inbody-pdfs/`. Protected API route for retrieval. No third-party storage service.
- **InBody ingestion**: PDF upload + parser, with a confirmation screen before save
- **Tracking depth**: macros (protein, carbs, fat, calories) + weight + training load only. No micros, no timing windows.
- **Logging philosophy**: pure conversational, no food database, trust AI estimation with a confirmation step
- **Meal plan prescription**: flexible templates with swappable proteins, carbs, and fats

### Risks to watch

1. **AI estimation accuracy on daily logging.** If median error is over 20 percent, the whole daily loop breaks. Mitigation: build the evaluation set before building the UI. Start with a week of weighed meals as ground truth, measure Claude's estimation error, decide if it clears the bar before shipping the loop.
2. **InBody PDF variability.** InBody 570, 770, and 970 produce slightly different PDFs. Mitigation: build the parser for the formats you actually use, not every format in the world.
3. **Weekly plan drift.** LLM-generated plans can hallucinate macros that do not sum correctly. Mitigation: plan generator validates totals against targets before returning, regenerates if off.
4. **Context window cost on coach calls.** Full context bundle grows over months. Mitigation: summarize older InBody scans and older logs into compressed context, keep the last 7 days full-resolution. Not urgent in month 1, becomes real by month 3.

### v2 candidates (not this PRD)

- Micronutrient tracking and deficiency flags
- Nutrient timing windows (pre/intra/post-workout)
- Wearable integration for training load auto-sync
- Photo-first logging (Claude vision from plate photos)
- Restaurant meal estimation with menu context
- Supplement and hydration tracking
- Shareable progress reports (useful for NEWAVE community content)
