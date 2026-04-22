import Link from "next/link";
import Image from "next/image";

// Typography tokens — Barlow Condensed for display, Barlow for body
// Used only on landing. App retains Space Grotesk / Inter.
const DISPLAY = "var(--font-barlow-condensed), 'Barlow Condensed', ui-sans-serif, system-ui, sans-serif";
const BODY = "var(--font-barlow), 'Barlow', ui-sans-serif, system-ui, sans-serif";

export function LandingPage() {
  return (
    <main
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        fontFamily: BODY,
      }}
      className="min-h-screen overflow-x-hidden"
    >
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 max-w-6xl mx-auto">
        <Image src="/logo.svg" alt="Forma" width={88} height={24} priority />
        <Link
          href="/login"
          className="text-sm font-medium tracking-wide"
          style={{ color: "var(--secondary)", fontFamily: BODY }}
        >
          Sign in →
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pt-12 pb-24 max-w-6xl mx-auto">
        {/* Overline */}
        <p
          className="text-xs font-semibold mb-8"
          style={{
            color: "var(--primary)",
            fontFamily: BODY,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Personal Nutrition OS · Hybrid Athletes
        </p>

        {/* Split layout: giant number left, headline right */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12 mb-10">
          {/* Big number — the data IS the hero */}
          <div className="flex-shrink-0">
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(96px, 18vw, 200px)",
                fontWeight: 800,
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              185
            </div>
            <p
              className="mt-2 text-sm font-medium"
              style={{
                color: "var(--tertiary)",
                fontFamily: BODY,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              g protein / day · your target
            </p>
          </div>

          {/* Headline */}
          <div className="md:pb-3 max-w-lg">
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Nutrition that recalibrates
              <br />
              <span style={{ color: "var(--secondary)", fontWeight: 500 }}>
                from your actual body.
              </span>
            </h1>
            <p
              className="mt-5 mb-8"
              style={{
                color: "var(--secondary)",
                fontFamily: BODY,
                fontSize: "clamp(15px, 2vw, 18px)",
                lineHeight: 1.65,
                maxWidth: "48ch",
              }}
            >
              Monthly InBody scan → recalibrated macro targets. Weekly AI meal plan.
              Conversational logging in 10 seconds. A coach with full context on your body.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--background)",
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              Get Started
              <ArrowRight />
            </Link>
          </div>
        </div>

        {/* Macro strip — data as proof, not decoration */}
        <MacroStrip />
      </section>

      {/* ── Photo break ─────────────────────────────────── */}
      <HyroxPhoto />

      {/* ── Problems ─────────────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-16 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <p
          className="text-xs font-semibold mb-10"
          style={{
            color: "var(--tertiary)",
            fontFamily: BODY,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Why existing apps fail you
        </p>

        {/* Editorial layout: 1 large + 2 stacked — not 3 identical cards */}
        <div className="flex flex-col md:flex-row gap-px" style={{ backgroundColor: "var(--outline-variant)" }}>
          <div
            className="flex-[2] p-8 space-y-4"
            style={{ backgroundColor: "var(--background)" }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--primary)", fontFamily: BODY, letterSpacing: "0.1em" }}
            >
              01
            </span>
            <h3
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              Apps that log, but never coach
            </h3>
            <p
              style={{
                color: "var(--secondary)",
                fontFamily: BODY,
                fontSize: "15px",
                lineHeight: 1.65,
                maxWidth: "48ch",
              }}
            >
              MyFitnessPal and its clones accept data and return nothing intelligent.
              They don't know your body composition, don't adjust to your training load,
              and can't answer "is this a good pre-workout meal." They are food databases
              with a logging UI, not coaches.
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-px">
            <div className="flex-1 p-7 space-y-3" style={{ backgroundColor: "var(--background)" }}>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--tertiary)", fontFamily: BODY, letterSpacing: "0.1em" }}
              >
                02
              </span>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "clamp(18px, 2vw, 22px)",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                2 minutes per meal, not 10 seconds
              </h3>
              <p
                style={{
                  color: "var(--secondary)",
                  fontFamily: BODY,
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                Enough friction to make you stop logging within a week.
              </p>
            </div>
            <div className="flex-1 p-7 space-y-3" style={{ backgroundColor: "var(--background)" }}>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--tertiary)", fontFamily: BODY, letterSpacing: "0.1em" }}
              >
                03
              </span>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "clamp(18px, 2vw, 22px)",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                }}
              >
                InBody scans that go nowhere
              </h3>
              <p
                style={{
                  color: "var(--secondary)",
                  fontFamily: BODY,
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                Monthly data with zero connection to your macros, plan, or next week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core loop ────────────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-16 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <p
          className="text-xs font-semibold mb-12"
          style={{
            color: "var(--tertiary)",
            fontFamily: BODY,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          The core loop
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            {
              n: "1",
              label: "Upload InBody",
              detail: "Monthly PDF → system recalibrates protein, carbs, fat based on your actual composition and training load.",
            },
            {
              n: "2",
              label: "Get weekly plan",
              detail: "Every Sunday. Flexible templates with swappable proteins, carbs, fats. Training days vs rest days automatically differentiated.",
            },
            {
              n: "3",
              label: "Log in 10 seconds",
              detail: "Type naturally. AI estimates macros and confirms. No food database. No barcode.",
            },
            {
              n: "4",
              label: "Coach in real time",
              detail: "Full context: InBody history, this week's plan, today's logs. Real answers, not generic tips.",
            },
          ].map((item) => (
            <div key={item.n} className="space-y-3">
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "clamp(36px, 5vw, 52px)",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "var(--outline-variant)",
                }}
              >
                {item.n}
              </div>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </h3>
              <p
                style={{
                  color: "var(--secondary)",
                  fontFamily: BODY,
                  fontSize: "13px",
                  lineHeight: 1.65,
                }}
              >
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature: Calibration ─────────────────────────── */}
      <section
        className="px-6 md:px-10 py-16 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">
          <div className="md:flex-1 space-y-5 md:pt-4">
            <p
              className="text-xs font-semibold"
              style={{
                color: "var(--primary)",
                fontFamily: BODY,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Calibration
            </p>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Targets built from your scan, not from generic formulas
            </h2>
            <p
              style={{
                color: "var(--secondary)",
                fontFamily: BODY,
                fontSize: "15px",
                lineHeight: 1.7,
                maxWidth: "44ch",
              }}
            >
              Upload your InBody PDF. The engine reads lean mass, body fat percent, and your
              goal, then outputs protein, carbs, and fat targets with a plain-language rationale.
              Training days and rest days get different carb targets automatically.
            </p>
            <p
              style={{
                color: "var(--tertiary)",
                fontFamily: BODY,
                fontSize: "13px",
                lineHeight: 1.65,
                maxWidth: "44ch",
              }}
            >
              "Your muscle mass is up 0.8 kg since last scan — protein target increased by 15g."
            </p>
          </div>
          <div className="md:flex-1 w-full">
            <CalibrationMockup />
          </div>
        </div>
      </section>

      {/* ── Feature: Logging ─────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-16 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <div className="flex flex-col md:flex-row-reverse gap-12 md:gap-16 items-start">
          <div className="md:flex-1 space-y-5 md:pt-4">
            <p
              className="text-xs font-semibold"
              style={{
                color: "var(--primary)",
                fontFamily: BODY,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Daily logging
            </p>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Log a meal like you'd text your nutritionist
            </h2>
            <p
              style={{
                color: "var(--secondary)",
                fontFamily: BODY,
                fontSize: "15px",
                lineHeight: 1.7,
                maxWidth: "44ch",
              }}
            >
              Type "grilled chicken, rice, broccoli, a fist of each." The AI estimates
              macros, shows you the numbers, and waits for confirmation. No food database,
              no barcode. 10 seconds.
            </p>
          </div>
          <div className="md:flex-1 w-full">
            <LoggingMockup />
          </div>
        </div>
      </section>

      {/* ── Feature: Coach ───────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-16 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">
          <div className="md:flex-1 space-y-5 md:pt-4">
            <p
              className="text-xs font-semibold"
              style={{
                color: "var(--primary)",
                fontFamily: BODY,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              AI Coach
            </p>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Full context. Specific answers.
            </h2>
            <p
              style={{
                color: "var(--secondary)",
                fontFamily: BODY,
                fontSize: "15px",
                lineHeight: 1.7,
                maxWidth: "44ch",
              }}
            >
              The coach has access to your last three InBody scans, this week's plan,
              today's logs, and your training schedule. Ask "I overate at lunch, how do
              I adjust dinner?" and get a specific answer, not a generic tip.
            </p>
          </div>
          <div className="md:flex-1 w-full">
            <CoachMockup />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section
        className="px-6 md:px-10 py-24 max-w-6xl mx-auto"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontSize: "clamp(36px, 7vw, 80px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 0.95,
              }}
            >
              Not a calorie counter.
              <br />
              <span style={{ color: "var(--secondary)", fontWeight: 500 }}>
                An operating system.
              </span>
            </h2>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--background)",
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              Get Started
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        className="px-6 md:px-10 py-7 max-w-6xl mx-auto flex items-center justify-between"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <Image src="/logo.svg" alt="Forma" width={72} height={20} />
        <p
          className="text-xs"
          style={{ color: "var(--tertiary)", fontFamily: BODY, letterSpacing: "0.05em" }}
        >
          Built for hybrid athletes in body recomposition
        </p>
      </footer>
    </main>
  );
}

/* ── Mockups ─────────────────────────────────────────────── */

function MacroStrip() {
  const macros = [
    { label: "Protein", value: "185", unit: "g", note: "↑ 15g from last scan" },
    { label: "Carbs · Training", value: "240", unit: "g", note: "rest day: 125g" },
    { label: "Fat", value: "65", unit: "g", note: "constant" },
    { label: "Calories", value: "2,480", unit: "kcal", note: "training day" },
  ];

  return (
    <div
      className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px"
      style={{ backgroundColor: "var(--outline-variant)" }}
    >
      {macros.map((m) => (
        <div
          key={m.label}
          className="px-6 py-5"
          style={{ backgroundColor: "var(--background)" }}
        >
          <p
            className="text-xs font-semibold mb-2"
            style={{
              color: "var(--tertiary)",
              fontFamily: BODY,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {m.label}
          </p>
          <p
            style={{
              fontFamily: DISPLAY,
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {m.value}
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--tertiary)",
                marginLeft: "3px",
              }}
            >
              {m.unit}
            </span>
          </p>
          <p
            className="mt-1.5 text-xs"
            style={{ color: "var(--tertiary)", fontFamily: BODY }}
          >
            {m.note}
          </p>
        </div>
      ))}
    </div>
  );
}

function CalibrationMockup() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--tertiary)", fontFamily: BODY }}
        >
          After InBody · Apr 2026
        </p>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{
            backgroundColor: "var(--primary-dim)",
            color: "var(--primary)",
            fontFamily: BODY,
          }}
        >
          Recalibrated
        </span>
      </div>

      {/* Macro rows — not a grid of identical stat blocks */}
      {[
        { label: "Protein", prev: "170", curr: "185", unit: "g", delta: "+15", up: true },
        { label: "Carbs · Training day", prev: "220", curr: "240", unit: "g", delta: "+20", up: true },
        { label: "Carbs · Rest day", prev: "125", curr: "125", unit: "g", delta: "—", up: null },
        { label: "Fat", prev: "62", curr: "65", unit: "g", delta: "+3", up: true },
      ].map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--outline-variant)" }}
        >
          <p className="text-sm" style={{ color: "var(--secondary)", fontFamily: BODY }}>
            {row.label}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-sm" style={{ color: "var(--tertiary)", textDecoration: "line-through", fontFamily: BODY }}>
              {row.prev}{row.unit}
            </span>
            <span
              style={{
                fontFamily: DISPLAY,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {row.curr}
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--secondary)", marginLeft: "2px" }}>
                {row.unit}
              </span>
            </span>
            {row.up !== null && (
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--accent)", fontFamily: BODY }}
              >
                {row.delta}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Rationale */}
      <div className="px-5 py-4">
        <p className="text-xs leading-relaxed" style={{ color: "var(--tertiary)", fontFamily: BODY }}>
          Muscle mass ↑ 0.8 kg · protein target raised by 15g.
          Hyrox training load increased · training-day carbs raised 20g.
        </p>
      </div>
    </div>
  );
}

function LoggingMockup() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
    >
      {/* Running totals bar */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <p className="text-xs" style={{ color: "var(--tertiary)", fontFamily: BODY }}>
          Today · Training day
        </p>
        <div className="flex items-center gap-4">
          {[
            { label: "P", value: "122", target: "185" },
            { label: "C", value: "168", target: "240" },
            { label: "F", value: "41", target: "65" },
          ].map((m) => (
            <span key={m.label} className="text-xs" style={{ color: "var(--secondary)", fontFamily: BODY }}>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{m.value}</span>
              /{m.target}{m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="px-5 py-5 space-y-4">
        {/* User message */}
        <div className="flex justify-end">
          <div
            className="rounded-xl rounded-br-sm px-4 py-2.5 max-w-xs"
            style={{ backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: BODY, fontSize: "14px" }}
          >
            grilled chicken, rice and broccoli, a fist of each
          </div>
        </div>

        {/* Coach response */}
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--secondary)", fontFamily: BODY }}>
            Got it. Estimate:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Protein", val: "38g" },
              { label: "Carbs", val: "42g" },
              { label: "Fat", val: "9g" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg py-3 px-3 text-center"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--tertiary)", fontFamily: BODY }}>
                  {m.label}
                </p>
                <p
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {m.val}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: "var(--primary)", color: "var(--background)", fontFamily: BODY }}
            >
              Confirm and log
            </button>
            <button
              className="px-4 py-2.5 rounded-lg text-xs"
              style={{ color: "var(--secondary)", border: "1px solid var(--outline-variant)", fontFamily: BODY }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachMockup() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <p className="text-xs" style={{ color: "var(--tertiary)", fontFamily: BODY }}>
          Coach · Today 8:42 pm
        </p>
      </div>
      <div className="px-5 py-5 space-y-5">
        {/* User question */}
        <div className="flex justify-end">
          <div
            className="rounded-xl rounded-br-sm px-4 py-2.5 max-w-xs"
            style={{ backgroundColor: "var(--surface)", color: "var(--foreground)", fontFamily: BODY, fontSize: "14px" }}
          >
            I overate at lunch. How do I adjust dinner?
          </div>
        </div>

        {/* Coach answer — no side stripe, just text */}
        <div className="space-y-2 max-w-prose">
          <p
            style={{
              color: "var(--foreground)",
              fontFamily: BODY,
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
            You're 22g over on carbs and 180 kcal over for the day.
          </p>
          <p
            style={{
              color: "var(--foreground)",
              fontFamily: BODY,
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
            For dinner: keep your protein target (40g), drop carbs to 20g, skip added fat.
            A large salad with grilled fish gets you there. You'll still hit your weekly average.
          </p>
          <div
            className="mt-3 flex gap-4"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {[
              { label: "Protein keep", val: "40g" },
              { label: "Carbs cut to", val: "20g" },
              { label: "Fat skip", val: "0g" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-xs" style={{ color: "var(--tertiary)", fontFamily: BODY }}>{m.label}</p>
                <p
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {m.val}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HyroxPhoto() {
  return (
    <section
      className="px-6 md:px-10 py-16 max-w-6xl mx-auto"
      style={{ borderTop: "1px solid var(--outline-variant)" }}
    >
      <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        {/* Copy */}
        <div className="md:flex-1 space-y-4">
          <p
            className="text-xs font-semibold"
            style={{
              color: "var(--primary)",
              fontFamily: BODY,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Built for this
          </p>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Hybrid athletes who train like it matters.
          </h2>
          <p
            style={{
              color: "var(--secondary)",
              fontFamily: BODY,
              fontSize: "15px",
              lineHeight: 1.7,
              maxWidth: "40ch",
            }}
          >
            Not casual calorie counters. Athletes in active body recomposition — running,
            lifting, racing Hyrox — who need nutrition to respond to what their body
            actually did this week.
          </p>
        </div>

        {/* Photo — fixed size so it renders at native resolution */}
        <div
          className="flex-shrink-0 relative overflow-hidden rounded-xl"
          style={{ width: "min(100%, 480px)", aspectRatio: "4/3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hyrox.jpg"
            alt="Hybrid athletes at a Hyrox competition"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 30%",
              display: "block",
              filter: "brightness(0.82) contrast(1.08)",
            }}
          />
          {/* Subtle dark vignette on edges */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(10,11,13,0.5) 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
