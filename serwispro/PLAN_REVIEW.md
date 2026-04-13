# SerwisPro — Plan Review

**Reviewer:** Senior Full-Stack Architect  
**Date:** 2026-04-13  
**Codebase snapshot:** `serwispro/` directory, main branch

---

## 1. Confirmation — Plan vs. Codebase

### What the plan accurately reflects

- **AI pipeline** (`src/lib/ai.ts`): Three-tool pattern (`submit_diagnosis`, `submit_estimate`, `compose_email`) with a two-turn fallback loop is real and working. Phase 2's fourth tool `submit_schedule` fits the pattern naturally as a separate function.
- **Prisma schema**: The plan's Phase 1 additions (new enums, new fields on `Customer`/`Repair`, new models) correctly start from what actually exists in `prisma/schema.prisma`. No phantom fields assumed.
- **Resend already installed**: `package.json` has `"resend": "^6.4.2"`. Phase 1 auto-email and Phase 6 templates have zero new dependencies for email.
- **`StatusBadge` is typed strictly**: `src/components/status-badge.tsx:5` uses `Record<RepairStatus, ...>`. The plan knows to extend this when adding `PENDING_REVIEW`.
- **`lucide-react` available**: `package.json` lists it. Phase 0 icon additions to `StatusBadge` need no new install.
- **`buildRepairContext` queries real DB shape**: `src/lib/ai-context.ts:39` joins through `Bike.brand/model` for history, and dumps all `Inventory` rows. Phase 2's `buildIntakeContext()` must take a different approach (no `bikeId` exists yet at intake time).

### Where the plan diverges from reality

| Plan claim | Reality |
|---|---|
| "AI loading time message" listed as Phase 0 fix | Already done — `src/app/naprawy/nowa/page.tsx:225-234` shows spinner + "To może potrwać kilka sekund." |
| "Clickable dashboard cards" | Stat cards (`page.tsx:84-135`) are plain `<Card>`, not links. Correct to fix. Recent-repairs rows ARE already clickable via `<Link>` (`page.tsx:149`). |
| Polish diacritics "broken" | Diacritics in source are correct Polish throughout (e.g., "Powrót do listy" at `naprawy/nowa/page.tsx:248`, "Przegląd serwisu" at `page.tsx:72`). The plan example `Powrot->Powrot` is the same word. Clarify whether this is about URL slugs, seed data, or specific strings not in the reviewed files. |
| Overflow-x-auto on tables | No `<table>` element exists in either reviewed page. Applies to `/naprawy` list and `/magazyn` — files not reviewed but likely need it. |

---

## 2. Issues and Risks

### Critical

**C1 — `StatusBadge` will break the moment `PENDING_REVIEW` lands**  
`src/components/status-badge.tsx:5` is `Record<RepairStatus, { label: string; className: string }>`. TypeScript enforces exhaustiveness. The migration adding `PENDING_REVIEW` to the `RepairStatus` enum must be accompanied by a matching entry in `STATUS_CONFIG` in the same PR — otherwise the build fails. Do not split this across two PRs.

**C2 — Two-turn AI fallback does not scale to four tools**  
`src/lib/ai.ts:213` checks `if (!results.diagnosis || !results.estimate || !results.email)` and fires one follow-up turn. For the intake function with four tools (adding `submit_schedule`), the same hard-coded two-turn limit may fail silently when the model calls 2–3 tools per turn. The new `analyzeIntakeSubmission()` must either use `tool_choice: { type: "auto" }` with a smarter loop, or use `tool_choice: { type: "any" }` and accept that a third turn may be needed. Hardcoding "exactly N turns" is fragile with `tool_choice: "any"`.

**C3 — Rate limiting: no library chosen**  
`POST /api/public/intake` needs rate limiting (plan acknowledges this) but no package is in `package.json` and none is specified in the plan. Options to decide before Phase 1 ships:
- `@upstash/ratelimit` (edge-compatible, needs Redis/Upstash account)
- `rate-limiter-flexible` (in-process, fine for single-server deploy)
- Middleware-level via Vercel/CDN headers  
Without a decision here, Phase 1 ships with a public endpoint and no protection.

**C4 — `buildIntakeContext()` has no `bikeId`**  
`src/lib/ai-context.ts:32` takes a `bikeId` and queries repair history for that specific `brand+model`. At intake time the bike does not exist yet. Phase 2 must design `buildIntakeContext()` differently: accept raw intake form fields (bike type, rough description) and skip brand-specific history. The inventory query is reusable as-is. Missing this causes either a runtime crash or an empty, useless context.

### High

**H1 — `ACCEPTED` and `IN_PROGRESS` share identical styling**  
`src/components/status-badge.tsx:9-15` and `:24-27` both render `bg-blue-100 text-blue-800`. A mechanic cannot distinguish "newly accepted" from "actively being worked on" at a glance. Phase 0 should fix this alongside the icon additions — e.g., give `IN_PROGRESS` an indigo or cyan variant.

**H2 — PATCH `/api/intake/[id]` creates entities without duplicate guard**  
Phase 3's approval endpoint creates `Customer + Bike + Repair`. Customer deduplication by phone or email is listed in Phase 7, but Phase 3's endpoint will fire first. Approving two submissions from the same person before Phase 7 lands creates duplicate `Customer` rows with no constraint to stop it. Either add a phone/email uniqueness strategy in Phase 1 (when `Customer` gains `status`/`source`) or enforce it in Phase 3. Do not wait for Phase 7.

**H3 — Phase 5 Google Calendar: OAuth2 is wrong fit for a single-shop tool**  
Full OAuth2 (authorization_code flow) requires a callback URL, a web consent screen, and ongoing token refresh handling. For a single mechanic, a **service account** with calendar delegation is simpler, more reliable, and doesn't need user login. The plan should clarify this before `src/lib/google-calendar.ts` is written.

**H4 — `analyzeRepair` re-sends full history on follow-up turn**  
`src/lib/ai.ts:237` re-sends the entire user message as the first message in the follow-up conversation (identical to turn 1). At scale with a large inventory, this doubles the token cost and doubles cache-miss probability. The SYSTEM_PROMPT is cached (`cache_control: ephemeral`), but the user content is not. Cache the user turn as well, or pass the context separately with its own `cache_control`.

**H5 — `EmailLog.type` is a free string**  
`prisma/schema.prisma:117` stores `type String` with a comment listing known values. Phase 6 adds more email types. Without a DB enum, nothing prevents typos (`"gotwy"` instead of `"gotowy"`). Add an `EmailType` enum to the schema in Phase 6.

### Medium

**M1 — Labor rate hardcoded in prompt string**  
`src/lib/prompts.ts:13` embeds `"stawka 120 PLN/h"` directly. If the rate changes, someone must hunt through the prompt. Extract it as a named constant (e.g., `LABOR_RATE_PER_HOUR = 120`) and interpolate it into the prompt.

**M2 — Resend `^6.4.2` is a major pre-GA version jump**  
Resend v6 is a significant API change from v3/v4. Before writing Phase 6 email templates, verify the v6 `send()` call signature matches what the templates will use — the Resend changelog is not in the reviewed files.

**M3 — `IntakeSubmission` REJECTED status missing from plan**  
Phase 1 defines `IntakeStatus` enum but the plan text only lists the happy path. Rejection (mechanic declines intake) is mentioned as a Phase 7 edge case, but the enum needs a `REJECTED` value from the start or the Phase 3 detail page cannot implement a reject action without a migration.

**M4 — Public route group authentication boundary**  
The plan places the public intake form at `(public)/zgloszenie`. In Next.js 16, route groups do not add any security boundary — middleware must explicitly allow unauthenticated access to these routes while protecting `/naprawy`, `/klienci`, etc. If any auth middleware is added later, `(public)` routes must be explicitly excluded. The plan does not mention this.

**M5 — No `@unique` on `Customer.email` or `Customer.phone`**  
`prisma/schema.prisma:12-13` — both are nullable and non-unique. Phase 1 adds `status`/`source` fields but the deduplication problem (H2) stems from the lack of uniqueness. Consider a partial unique index: `@@unique([email])` where email is not null, or a similar approach for phone.

---

## 3. Improvements

**I1 — Tool result content in follow-up should be richer**  
`src/lib/ai.ts:219` sends `"OK. Kontynuuj i użyj pozostałych narzędzi."` as the tool result for every completed tool. The model will produce better follow-up if the result mirrors what was stored, e.g. `"Diagnoza zapisana. Brakuje: submit_estimate, compose_email."` This gives the model explicit grounding on what remains.

**I2 — `buildRepairContext` fetches ALL inventory rows**  
`src/lib/ai-context.ts:57` loads every `Inventory` row. For a shop with hundreds of SKUs, this becomes a large token payload. Consider filtering to only parts relevant to the reported bike type or issue category, with a fallback to full inventory if no match. At minimum, cap the context at the top-N most relevant items.

**I3 — Phase 3 "parts autocomplete" should query existing `Part` catalog**  
The `Part` model (`prisma/schema.prisma:58`) already has `name`, `category`, `brand`, `sku`, and `defaultPrice`. The Phase 3 parts table autocomplete should query `GET /api/parts` backed by this table rather than free-text entry. This avoids catalog fragmentation and lets inventory (`Inventory` model) be decremented correctly when a repair is approved.

**I4 — Consider `zod` for public intake validation**  
Phase 1 adds a public POST endpoint. The internal routes do minimal validation (e.g., `src/app/api/ai/analyze/route.ts:14` just checks `if (!bikeId || !problemDesc)`). For the public-facing endpoint, `zod` schema validation gives proper field-level error messages, type safety, and protection against unexpected payloads without much added complexity.

**I5 — Phase 4 calendar slots algorithm needs to account for existing repairs**  
The plan mentions `/api/calendar/slots`. The slot generator must query existing `Repair.scheduledStart` + `estimatedLaborMinutes` to block off time already committed. If only `BusinessHours` is checked without counting booked repairs, the calendar will double-book slots.

---

## 4. Phase Ordering Opinion

The overall sequence is logical. Specific notes:

**Phase 0 — Do first, but scope tightly.** AI loading message is already done (`naprawy/nowa/page.tsx:225`); remove that item to avoid wasted effort. Diacritics fix needs a file-by-file audit first — don't assume all are broken.

**Phase 1 → Phase 2 dependency is hard.** Phase 2's `buildIntakeContext()` and `analyzeIntakeSubmission()` cannot be written without `IntakeSubmission`, `BusinessHours`, and `CalendarSettings` from Phase 1. This dependency is correctly sequenced.

**Phase 3 duplicate guard should not wait for Phase 7.** The PATCH endpoint in Phase 3 creates permanent DB records. Ship the phone/email lookup (even a simple `findFirst` with upsert) in Phase 3, not Phase 7. Phase 7 can add the full duplicate-resolution UI.

**Phase 4 (internal calendar) before Phase 5 (Google sync) is correct.** Do not design the Google sync until the local data model is proven. Phase 5 then becomes a one-directional push from the local calendar to Google.

**Phase 6 email templates can partially overlap Phase 4.** The "estimate with dates" template (Phase 6) requires `scheduledDropoff` from Phase 1 and an approved submission from Phase 3, but the template itself can be drafted and unit-tested in parallel with Phase 4.

**Phase 7 should be split:**
- Duplicate detection → move to Phase 3
- Rejection flow → add `REJECTED` to `IntakeStatus` enum in Phase 1
- Public status page → stays in Phase 7
- Responsive public form → stays in Phase 7

---

## 5. Missing Edge Cases

**E1 — AI timeout on intake analysis.** The existing `analyzeRepair` has no timeout. A public intake form is user-facing; if the Anthropic API is slow (10–30 s is possible), the user sees a frozen form. Use a background job or optimistic response ("Zgłoszenie przyjęte, analiza w toku") with a webhook/polling pattern.

**E2 — What happens if AI omits `submit_schedule`?** Phase 2 adds a 4th tool, but the model may call the other three and skip scheduling if the problem description gives no timing signal. The intake detail page (Phase 3) must handle `scheduledDropoff: null` gracefully and allow the mechanic to set it manually.

**E3 — `RepairPart` has no `onDelete` for `Part`.** `prisma/schema.prisma:104` — `RepairPart.partId` references `Part` with no `onDelete` clause. Deleting a part that is referenced by a historical repair will throw a FK constraint error. Add `onDelete: Restrict` explicitly to make the intent clear.

**E4 — Honeypot field name collision.** Phase 1 mentions a honeypot on the public form. The honeypot field name must not match any real `IntakeSubmission` field or Prisma will try to store it. Keep it out of the Zod schema and strip it server-side before validation.

**E5 — `Bike.type` is a free string.** `prisma/schema.prisma:24` stores type as `String`. The form (`naprawy/nowa/page.tsx:53`) enforces a fixed list client-side, but the API accepts any string. The intake form will also accept a bike type from a public user. Add a `BikeType` enum to the schema to make this constraint database-level.

**E6 — No transaction in Phase 3 approval.** Creating `Customer + Bike + Repair` in three sequential Prisma calls can leave partial state if one fails (e.g., `Bike` created but `Repair` insert throws). Wrap the entire approval in `prisma.$transaction([...])`.

**E7 — Calendar widget on dashboard (Phase 4) needs SSR/ISR strategy.** `page.tsx` is a server component that runs on every request. Adding live calendar data with `prisma.repair.findMany()` on scheduled dates is fine, but if it becomes expensive, use `export const revalidate = 60` to ISR-cache the dashboard page.
