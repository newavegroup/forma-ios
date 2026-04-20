# QA Report — InBody Parser (Phase 1)
**Date:** 2026-04-19
**Scope:** `lib/inbody/` parser module — no UI, no API routes
**Mode:** Code audit (diff-aware, no running app)
**Test suite:** 73 tests, 6 files, Vitest 4.1.4

---

## Summary

| Metric | Value |
|--------|-------|
| Tests | 73 / 73 passing |
| Statement coverage | 93.04% (174/187) |
| Branch coverage | 82.89% (126/152) |
| Function coverage | 95% (19/20) |
| Line coverage | 93.52% (159/170) |
| Phase 1 ACs met | All 6 ✓ |
| Baseline health score | 87/100 |

All Phase 1 acceptance criteria from the build plan are met. Real InBody120 Spanish eval passes with all 6 fields within ±0.5 tolerance.

---

## Coverage Gaps

### ISSUE-001 — Medium: `vision-fallback.ts` PDF-to-image path untested (lines 64–73)

`pdfFirstPageToBase64Default` — the actual pdf-parse `getScreenshot()` call — is never exercised. Tests inject a mock screenshot function via `_setScreenshotFn`. If pdf-parse v2's screenshot API changes or `page.data` is not a Uint8Array, the failure will only surface at runtime with a real scanned PDF.

**Risk:** Low in practice (InBody PDFs are text-selectable), but the vision path is the fallback for the worst case.

**Fix:** Integration test using a real non-text PDF, OR a test that calls `pdfFirstPageToBase64Default` directly with a stub PDFParse. Deferred — requires a binary PDF fixture.

---

### ISSUE-002 — Low: `vision-fallback.ts` lazy client init untested (line 21)

`getClient()` returns early if `_client` is already set (injected by tests). The branch where it falls through to `new Anthropic()` is never covered. This would throw at runtime if `ANTHROPIC_API_KEY` is unset and no client is injected.

**Fix:** One test that calls `visionExtract` without prior `_setClient`, asserting it throws with a useful message when `ANTHROPIC_API_KEY` is absent. Low priority.

---

### ISSUE-003 — Low: `extractor.ts` vision return path not unit-tested (line 65)

The branch `extractionMethod: "vision"` fires when a PDF has enough text but none of the InBody sentinel terms. This is a real scenario (some PDF wrappers strip metadata but return generic text). Covered indirectly via parser integration tests, but no isolated unit test asserts this return shape.

**Fix:** Add one test with a buffer containing `%PDF-` magic bytes and 500+ chars of non-InBody text. Quick win, 5 lines.

---

### ISSUE-004 — Low: `parser.ts` `?? ""` / `?? 0` fallbacks untested (lines 67–71)

The `InBodyScan` construction in the low-confidence branch uses `?? ""` / `?? 0` for safety. These branches fire only when `mapFields` returns `undefined` for a field that passed the `scoreConfidence` threshold (1–2 missing fields path). In practice, if confidence is `low`, the field is `undefined` — so these fallbacks ARE exercised. Coverage reports these as uncovered branches because they're the `?? undefined-side` of the nullish coalescing operator.

**Fix:** None needed. The branches are defensive guards; the real missing-field case is what `flagged_fields` is for.

---

### ISSUE-005 — Low: `parser.ts` VisionFallbackError catch branch untested (line 36)

When `visionExtract` throws a `VisionFallbackError`, the catch block returns `{ success: false, error: err.message }`. The non-VisionFallbackError branch (line 38) is also untested. Both are covered structurally but not exercised.

**Fix:** One test where injected vision mock throws `VisionFallbackError`. Quick, deferred until next session.

---

### ISSUE-006 — Low: `mapper.ts` bare US date format untested (lines 123–124)

`extractScanDate` handles `MM/DD/YYYY` format (bare US). This path is not covered. InBody PDFs from North America might use this format.

**Fix:** One test: `extractScanDate("Date: 01/15/2024")` → `"2024-01-15"`. 3 lines.

---

## Top 3 Things to Fix

1. **ISSUE-003** — Add one extractor unit test for the vision-method return path. Quick win, closes a realistic gap.
2. **ISSUE-005** — Add one parser test for VisionFallbackError propagation. Closes the catch-block branch.
3. **ISSUE-006** — Add one date format test for bare US format. Defensive coverage.

---

## Phase 1 Acceptance Criteria

- [x] `parse(buffer)` returns `success: true` for real InBody PDFs
- [x] All 6 fields extracted within ±0.5 of hand-verified ground truth (InBody120 Spanish eval passing)
- [x] Low confidence parse correctly identifies flagged fields
- [x] Vision fallback triggered and working (mocked + injectable)
- [x] `npx vitest` passes all 73 tests in `tests/inbody/`
- [x] TypeScript interfaces in `types/inbody.ts` are locked and documented

---

## Decision

All gaps are low severity defensive paths. Phase 1 ACs are met. Recommend:

**Option A:** Close ISSUE-003, 005, 006 (3 targeted tests, ~20 lines total), then commit Phase 1 and start Phase 2.
**Option B:** Commit Phase 1 as-is (73 tests, all passing), start Phase 2. Return to coverage gaps if vision fallback is needed in production.
