# SOPilot: Frontend Plan (Teammate Lane)

Companion to the main build plan: [SOPilot Build Plan](https://claude.ai/artifact/2YQix6UE6wLtsPcvRsbtEs). Read the main plan first. This document only adds what the frontend environment needs. OpenAI x TCS Global Hackathon 2026, Problem 4A, Codex Challenge, 17-19 Nov 2026.

## 1. Your role and what is different about your environment

- You own everything the analyst sees: intake, parsed alert, checklist with citations, fallback states, approval, ticket, audit view, the demo flow, screenshots, the video, and the final upload.
- Your Codex runs in your own environment and cannot see the backend, the data, or the LLM key. So the UI must be fully buildable and demo-able without the backend, using an in-app mock layer. The real backend is plugged in at the Day 2 midday integration.
- The contract between the two lanes is docs/spec.md (main plan sections 3 and 5 summarise it). If your Codex does not have it, it will guess, and guesses cause integration bugs. That is why you need the context pack below.
- The frontend never holds a secret. LLM\_KEY lives only in the backend .env. Nothing secret goes into frontend code, env files, prompts, or screenshots.

**One change from the main plan:** the main plan says to build against the backend mock mode (MOCK=1). In your environment the backend is not available, so the mock lives inside the frontend (a mock ApiClient driven by fixtures). Backend MOCK=1 is only useful later as a sanity check. There is also no shared repo: you work in your own folder, and files move between you and Hardik at fixed sync gates (section 10).

## 2. Context pack: what your Codex must have

| File | Place it at | Purpose |
| --- | --- | --- |
| AGENTS.md (frontend version) | frontend/AGENTS.md | Rules Codex follows in every thread |
| spec.md | docs/spec.md | Full contract: types, endpoints, statuses, errors, formats |
| types.ts | frontend/src/api/types.ts | TypeScript types and the ApiClient interface that mirror the contract |
| fixtures.ts | frontend/src/mocks/fixtures.ts | Schema-valid sample data for all three checklist states, tickets, audit rows, and 6 sample alerts |
| This plan | read it yourself | Prompts F0 to F10 below |

The first four files are delivered alongside this plan (AGENTS.md, types.ts, fixtures.ts) and from Hardik (spec.md now, golden responses later at G2, which go in src/mocks/golden/). Copy them in before you run any prompt.

**Thread starter: paste this at the top of every Codex thread**

```
Before doing anything, read AGENTS.md, docs/spec.md, src/api/types.ts and src/mocks/fixtures.ts. Do not invent API fields or enum values; if the UI needs something the contract lacks, stop and tell me. Work only inside frontend/. Run npm run build and npm test before finishing and report the results.
```

## 3. Repo and environment setup

- **No shared repo.** You work in your own folder, soc-sentinel-ui/, with two parts: docs/ (spec.md and the contract changelog) and frontend/ (the Vite app). Hardik works in a separate folder. Files cross between you only at the sync gates in section 10.
- Backend, data, and eval never exist on your side, unless Hardik sends the backend zip at G3 (Option B).
- Node 20 or newer, npm. Vite dev server on port 5173 (the backend CORS allows exactly http://localhost:5173).
- Environment file frontend/.env.local (never committed, never sent): VITE\_USE\_MOCK=true and VITE\_API\_BASE\_URL=http://localhost:8000/api. At live integration you flip VITE\_USE\_MOCK to false.
- Run git init in your folder anyway, for your own history and easy diffs. Add a .gitignore for node\_modules, dist, .env.local, and test-results.
- To send the frontend to Hardik, zip the frontend/ folder without node\_modules, dist, .env.local, and test-results. Name it with the contract version and the time, for example ui-v1-1830.zip.

## 4. Contract cheat sheet (full types are in types.ts)

**Endpoints (base path /api):** GET /health, GET /samples, POST /run, POST /alerts/parse, POST /checklist, POST /ticket, POST /approve, GET /tickets/{id}/export.md, GET /search, GET /audit.

**Rules the UI must respect:**

- Checklist status drives the layout. grounded: normal view. low\_confidence: amber banner, still show the kept steps. no\_matching\_sop: strong banner, no steps, show the escalation note.
- Every step has a citation with source\_text. Clicking the citation chip must always show the exact playbook text.
- support partial: show a partial-support badge. dropped\_count above 0: show a line such as N unsupported steps removed by the verifier.
- A ticket is a draft until approved. Approved tickets are read-only. A second approve returns already\_approved (409): show a friendly message, not an error screen.
- Root cause is always a hypothesis. Label it as one, with its confidence.
- Errors arrive as an object with code, message, and details. Map each code (invalid\_json, payload\_too\_large, validation\_error, not\_found, already\_approved, llm\_unavailable) to a human message. llm\_unavailable gets a Retry button.
- timings\_ms has parse, retrieve, generate, verify, total. Show it in a small strip.
- All strings from the API and the alert are untrusted. Render as text, never as HTML.
- Request limit is 200 KB. Validate pasted JSON in the browser first and block the Run button when it is invalid or too large.

## 5. Screens and states

| Screen | What it shows | States to build |
| --- | --- | --- |
| 1. Intake | Sample alert picker (from /samples), JSON editor, Run button | empty, invalid JSON, too large, running, API error |
| 2. Pipeline progress | Stepper: Parse, Retrieve, Generate, Verify | running (simulated), done (real timings), failed |
| 3. Parsed alert | Attack-type badge, severity, confidence meter, summary, IoC chips grouped by type, redaction note | normal, unknown attack type |
| 4. Checklist | Ordered steps, verified badges, citation chips, CVE cards, dropped-steps line | grounded, low\_confidence, no\_matching\_sop |
| 5. Citation panel | Side panel with the exact playbook text, step ID, phase | open, closed, keyboard close with Esc |
| 6. Approval and ticket | Analyst name field, Approve, ticket view, Copy, Download Markdown | draft, approving, approved, already approved |
| 7. Audit and stats | Audit table per stage, timings strip, backend health badge | empty, loaded |

Note on the stepper: POST /run returns once, after all stages finish. In live mode the stepper animates a simulated progress while the request is pending, then snaps to the real timings when the response arrives. Make it work for latencies up to 30 seconds.

## 6. Design brief

- **Feel:** a calm, dense, professional security tool. Dark first, with a light theme toggle.
- **Colours:** severity (critical red, high orange, medium amber, low blue). Checklist status (grounded green, low\_confidence amber, no\_matching\_sop red-slate). Never rely on colour alone: pair it with an icon and text.
- **Typography:** Inter or the system sans for text, ui-monospace for IoCs, step IDs, and hashes.
- **Hero element:** citation chips. Large, clickable, showing the step ID. This is the proof that nothing is invented, so make it visible in screenshots and the video.
- **Layout:** two-column workspace on desktop (input and parsed alert on the left, checklist on the right), single column on narrow screens.
- **Accessibility:** keyboard reachable, visible focus rings, aria-live on status banners, prefers-reduced-motion respected, AA contrast.
- **Demo friendliness:** a hidden shortcut (press D) loads the ransomware sample and runs it. Large readable text for screen recording.

## 7. Frontend architecture

```
frontend/
  AGENTS.md  .env.local  index.html  package.json
  src/
    api/        types.ts  client.ts (real)  mockClient.ts  index.ts (picks by VITE_USE_MOCK)
    mocks/      fixtures.ts
    components/ AlertInput  PipelineStepper  ParsedAlertCard  IocChips  ChecklistView
                StepCard  CitationChip  CitationPanel  StatusBanner  CveCard
                ApprovalBar  TicketView  AuditTable  TimingsStrip  ErrorNotice  ThemeToggle
    hooks/      useRun  useTicket  useAudit  useHealth
    lib/        errors.ts  ticketToMarkdown.ts  validateAlertJson.ts
    App.tsx  main.tsx
```

- State: TanStack Query for server calls, plain React state for UI. No router; use tabs and a stepper.
- Adapter pattern: components only know the ApiClient interface. client.ts and mockClient.ts both implement it. This is what makes the integration a one-line switch.
- Mock client behaviour: 300 to 800 ms delay, picks a fixture with pickRunKey from the pasted alert, creates the draft ticket on createTicket, returns the approved fixture on approve, and generates Markdown with ticketToMarkdown.

## 8. Schedule

**Day 1 (Tue 17 Nov)**

- G0: get spec.md from Hardik and agree Contract version v1 and the file channel. Set up soc-sentinel-ui, drop in the context pack, run F0.
- Then F1 (API layer and mock), F2 (intake), F3 (stepper and parsed alert).
- G1: when Hardik sends docs/schemas/, diff them against types.ts.
- Goal by end of day: a sample alert goes from intake to parsed alert to a checklist, entirely on fixtures.

**Day 2 (Wed 18 Nov)**

- Morning: F4 (checklist and citation panel), F5 (states and errors), F6 (approval and ticket), F7 (audit and timings).
- G2: when golden/ arrives, put it in src/mocks/golden/, run F9a, then zip frontend/ and send it to Hardik.
- G3: live integration with Hardik (section 10), run F9b. Afternoon: F8 polish and contract fixes.

**Day 3 (Thu 19 Nov)**

- G4 freeze, bug fixes only. Run F10 for the screenshots and rehearse the demo twice.
- Midday: record the video on the machine that runs the full stack, and upload everything to Prime. Confirm the cutoff time on the FrescoPlay and Prime pages today.

## 9. Codex prompts (frontend lane)

Use the thread starter from section 2 before each one. One task per thread.

### F0 - Scaffold and context check

```
Goal: scaffold the frontend and prove you understood the contract.
Do: create a Vite + React + TypeScript (strict) + Tailwind project in frontend/ with TanStack Query and lucide-react, Vitest and React Testing Library. Add the folder structure from section 7 of the frontend plan (empty files are fine). Keep the provided AGENTS.md, types.ts and fixtures.ts unchanged. Add .gitignore and .env.example with VITE_USE_MOCK and VITE_API_BASE_URL. Before coding, summarise back to me in 10 bullets the contract rules from AGENTS.md and docs/spec.md that affect the UI.
Constraints: no extra dependencies beyond those listed.
Acceptance: npm run dev serves a blank themed page; npm run build and npm test pass; the bullet summary is accurate.
```

### F1 - API layer and mock client

```
Goal: implement the ApiClient in two flavours and the switch.
Do: in src/api add client.ts (real, uses fetch with VITE_API_BASE_URL, normalises error responses into a typed AppError with the contract error codes, 35 s timeout), mockClient.ts (uses src/mocks/fixtures.ts, 300 to 800 ms delay, pickRunKey to choose a run fixture, createTicket returns draftTicket, approve returns approvedTicket and throws already_approved on a second call for the same ticket, exportTicketMarkdown uses lib/ticketToMarkdown.ts, audit returns auditRows), and index.ts exporting the client chosen by VITE_USE_MOCK. Add lib/ticketToMarkdown.ts. Add TanStack Query hooks useRun, useTicket, useAudit, useHealth.
Constraints: components must never call fetch; no field outside types.ts.
Acceptance: unit tests for each mock method, for error mapping, and for the already_approved path; build passes.
```

### F2 - App shell and intake screen

```
Goal: app shell and the intake screen.
Do: build the layout (header with product name, mock/live badge from useHealth, theme toggle; two-column workspace). Build AlertInput: sample picker populated from samples(), a JSON text area with live validation (valid JSON object only, max 200 KB), Run button disabled when invalid, inline error messages, and a keyboard shortcut D that loads the ransomware sample and runs it.
Constraints: follow the design tokens in AGENTS.md; accessible labels and focus states.
Acceptance: tests cover invalid JSON, oversize input, sample selection, and the shortcut; Run triggers the useRun mutation.
```

### F3 - Pipeline stepper and parsed alert card

```
Goal: PipelineStepper and ParsedAlertCard.
Do: PipelineStepper shows Parse, Retrieve, Generate, Verify. While the run request is pending it animates simulated progress (about 1 s per stage, holding on the last stage until the response arrives); on success it shows real timings_ms per stage; on error it marks the failing state. ParsedAlertCard shows attack-type badge, severity chip, confidence meter, summary, evidence fields, a note when redacted is true, and IoC chips grouped by type (monospace, copy on click), hiding empty groups.
Constraints: respect prefers-reduced-motion; unknown attack type must look neutral, not like an error.
Acceptance: component tests for pending, success and error; snapshot of the card for the ransomware and no-match fixtures.
```

### F4 - Checklist and citation panel

```
Goal: ChecklistView, StepCard, CitationChip, CitationPanel, CveCard.
Do: render ordered steps with action, rationale, verified badge, a partial-support badge when support is partial, and a prominent CitationChip showing the step ID. Clicking a chip opens CitationPanel as a side panel with playbook ID, step ID and the exact source_text; Esc closes it and focus returns to the chip. Show related CVEs as cards with severity, cvss and remediation. Show a line with dropped_count when above 0.
Constraints: citation chips are the visual hero; render all strings as text.
Acceptance: tests for opening and closing the panel by mouse and keyboard, partial badge, dropped line, and the grounded fixture rendering all 6 steps.
```

### F5 - Status banners and error handling

```
Goal: StatusBanner and ErrorNotice for every non-happy path.
Do: low_confidence shows an amber banner (role status, aria-live polite) with the escalation_note and still shows kept steps. no_matching_sop shows a strong banner, hides the step list, and shows the escalation_note with a clear Escalate message. ErrorNotice maps every API error code to a friendly message; llm_unavailable includes a Retry button that reruns the last request; payload_too_large and invalid_json point back to the input.
Constraints: no colour-only signalling; do not show raw error bodies.
Acceptance: tests render each status with its fixture and each error code with its message; Retry calls the mutation again.
```

### F6 - Approval and ticket view

```
Goal: ApprovalBar and TicketView.
Do: after a checklist exists, a Generate Incident Ticket button calls createTicket. TicketView shows title, severity, timeline, root cause labelled Hypothesis with its confidence and basis, IoCs, containment actions with citation chips (reuse CitationChip), affected assets and CVEs. ApprovalBar has an analyst name field (required) and an Approve button; after approval the ticket becomes read-only with approved_by and approved_at shown. Add Copy and Download Markdown actions using exportTicketMarkdown. Handle already_approved gracefully.
Constraints: approving needs a non-empty name; approved tickets show no editable controls.
Acceptance: tests for draft to approved flow, empty name blocked, double approve handled, and Markdown download content.
```

### F7 - Audit tab, timings strip, health badge

```
Goal: AuditTable, TimingsStrip and the health badge.
Do: an Audit tab listing rows from audit(run_id) with stage, time, model, short hashes and an expandable details_json view. A TimingsStrip showing the four stage timings and total after a run. The header badge shows Mock or Live and the index_chunks count from /health.
Constraints: details_json rendered as formatted text; empty state when no run yet.
Acceptance: tests for empty, loaded and expanded rows; the badge shows Mock when VITE_USE_MOCK is true.
```

### F8 - Polish, responsive, accessibility

```
Goal: make it demo-ready.
Do: responsive layout (single column under 900 px), skeleton loaders, light and dark theme parity, consistent spacing and type scale, larger text mode for screen recording, focus management after each major action, and an accessibility pass (labels, roles, contrast, reduced motion). Add a short in-app legend explaining badges and statuses.
Constraints: no new dependencies; do not change the API layer.
Acceptance: Lighthouse accessibility score 90 or higher on the main flow; keyboard-only walkthrough from intake to approved ticket works; build and tests pass.
```

### F9 - Contract checker and integration switch (F9a here, F9b at G3)

```
Goal: make real-backend integration safe, and prove it against golden responses before the backend is live.
Do (F9a, in this environment): add a dev-only runtime checker (src/lib/contractCheck.ts) that validates every API response against the shapes in types.ts (required fields, enum values, number ranges) and logs a clear console warning with the field path on a mismatch; it must never crash the UI. Add tests that run the checker against the golden responses in src/mocks/golden/ (real backend outputs sent by Hardik) and against deliberately broken copies. Add a README section: set VITE_USE_MOCK=false and VITE_API_BASE_URL, start the backend, and confirm the header badge says Live.
Do (F9b, on the machine that runs both, at G3): run all 6 samples through the real backend and fix every contract warning. Report schema mismatches as a list (field path, expected, got) instead of editing types.ts.
Constraints: checker active only in development; no change to types.ts without a contract version bump from Hardik.
Acceptance: checker tests pass on the golden responses and fail on the broken copies; zero contract warnings for the 6 sample alerts against the live backend.
```

### F10 - Evidence capture

```
Goal: automate submission screenshots.
Do: add a Playwright script (npm run screens) that runs the app in mock mode and saves PNGs at 1440x900 to docs/screens/ with these names: 01-intake, 02-parsed-alert, 03-checklist-grounded, 04-citation-panel, 05-low-confidence, 06-no-match, 07-approval, 08-ticket-approved, 09-audit. Use the dark theme.
Constraints: no secrets or real data in any screenshot.
Acceptance: one command produces all 9 files; none is blank.
```

## 10. Sync gates and integration with Hardik

**Sync gates (the main plan uses the same numbering):**

- **G0 Handshake:** before any prompt, get spec.md and agree Contract version v1 and the file channel with Hardik.
- **G1 Schema check:** after F0 and F1, Hardik sends docs/schemas/. Diff them against types.ts. Fix types.ts if you were wrong; report the differences if the schemas look wrong.
- **G2 Golden responses:** after F7, Hardik sends golden/ (real backend responses). Put them in src/mocks/golden/, run F9a, then zip frontend/ and send it.
- **G3 Live integration:** run both together using one of the options below, then F9b.
- **G4 Freeze and evidence:** bug fixes only; screenshots, video, and upload.

**Live integration (G3), two options:**

1. **Option A (default):** Hardik runs the frontend on his machine. Send him the frontend zip, named like ui-v1-1830.zip. He unzips it into his frontend/ folder, sets VITE\_USE\_MOCK=false, and runs the 6 samples. You join on a Teams screen share and fix what you see.
2. **Option B:** the full stack runs on your machine. Hardik sends the backend zip. Install Python 3.11, create your own .env with your own key, run python -m app.ingest --rebuild, start the backend on port 8000, and set VITE\_USE\_MOCK=false. Try it only if your environment can reach the gateway; if the first model call fails, use Option A.
3. With either option, test the error paths: invalid JSON, a stopped backend, and approving twice.
4. After G3, only you edit the frontend code. If Hardik hotfixes something, he sends you the changed files the same day; merge them before your next zip.

**Common mismatch checklist:** null versus missing fields, enum spelling and case, number ranges (confidence 0 to 1), timings key names, the error object shape, CORS (the origin must be exactly http://localhost:5173), very slow responses (loading state must survive up to 30 seconds), steps ordering and order numbering, empty arrays versus null.

**Changing the contract:** spec.md carries a Contract version header. If the UI needs a change, message Hardik with the field and the reason. He updates spec.md, bumps the version, and sends the bundle; you then update types.ts and fixtures.ts and confirm the version. Never edit spec.md yourself. The backend shape wins unless the UI genuinely cannot render it; settle it within 10 minutes.

## 11. Evidence and demo responsibilities (yours)

- **Screenshots:** the nine files from F10 in docs/screens/, plus code screenshots of the API layer and the citation components.
- **Codex evidence:** screenshots of at least the F0, F4, and F9 threads showing the prompt and the result. Do not capture any secret.
- **Video:** 3 minutes, 1080p, dark theme, large text mode on, terminal and key files off-screen, follow the demo script in main plan section 13, and rehearse twice before recording. The live run happens on the machine that runs both (G3): record there, or record a Teams screen share of it. Keep a mock-mode recording as a backup.
- **Upload:** you own the Prime submission page. Check today exactly which files and formats it requires and whether early-bird submission has a time limit.

## 12. Definition of done and risks

**Done when:**

- All seven screens work on fixtures and against the real backend.
- All three checklist states, both ticket states, and every API error code have a clear UI.
- npm run build and npm test pass; accessibility score is 90 or higher.
- Nine screenshots exist and the video is recorded.

| Risk | Mitigation |
| --- | --- |
| Backend not ready at midday Day 2 | Keep demoing on the mock client; integration can slip to the evening without blocking the UI. |
| Contract drift between lanes | The contract version header, the changelog, and the F9a checker run against golden responses catch drift early. |
| Codex invents API fields | The thread starter, AGENTS.md rules, and the strict types file; reject any diff that adds fields. |
| Time runs short | Cut order: audit tab, light theme polish, F10 automation (take screenshots by hand). Never cut the citation panel or the fallback banners. |
