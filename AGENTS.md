# AGENTS.md (frontend lane)

Project: SOPilot UI. A SOC analyst pastes a raw security alert and gets a parsed alert, a verified step-cited containment checklist, and an approvable incident ticket.

Read first, every thread: docs/spec.md, src/api/types.ts, src/mocks/fixtures.ts.

## Stack
React 18, TypeScript (strict), Vite, Tailwind CSS, TanStack Query, lucide-react icons. Tabs or a stepper in one page; no router. Tests: Vitest + React Testing Library. Optional: Playwright for screenshots.

## Rules
- Work only inside frontend/ (and docs/screens/). Never edit backend/, data/ or eval/.
- Never invent API fields, enum values or endpoints. The contract is docs/spec.md and src/api/types.ts. If the UI needs something the contract lacks, stop and report it.
- All network access goes through the ApiClient interface in src/api/types.ts. Two implementations: real (fetch) and mock (fixtures with 300 to 800 ms delay). Chosen by VITE_USE_MOCK. Components never call fetch directly.
- No business logic in the UI. Do not re-derive status, severity, verification or fallback decisions; render what the API returns.
- The frontend holds no secrets. No API keys anywhere in code, env files, logs or screenshots.
- Every screen has loading, empty and error states. Map API error codes to friendly messages (invalid_json, payload_too_large, validation_error, not_found, already_approved, llm_unavailable).
- Alert text and all strings from the API are untrusted: render as text, never as HTML.
- Accessibility: keyboard reachable, visible focus, aria-live for status banners, never colour alone (use icon + text), respect prefers-reduced-motion, WCAG AA contrast.
- Small diffs. Add or update tests with each change. Run `npm run build` and `npm test` before finishing and report the results.

## Design tokens (use consistently)
- Dark first, light theme supported via a toggle. Dense, calm, professional security-tool look.
- Severity: critical red, high orange, medium amber, low blue.
- Checklist status: grounded green, low_confidence amber, no_matching_sop red-slate.
- Monospace (ui-monospace) for IoCs, step IDs, hashes. Sans (Inter or system) for everything else.
- Citation chips are the visual hero: prominent, clickable, show playbook step ID.

## Env vars (frontend/.env.local, never committed)
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:8000/api
