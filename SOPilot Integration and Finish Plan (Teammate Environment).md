# SOPilot: Integration and Finish Plan (Teammate Environment)

Companion to the [Build Plan](https://claude.ai/artifact/2YQix6UE6wLtsPcvRsbtEs) and the [Frontend Plan](https://claude.ai/artifact/2bf4xrpkogQ2ii44SbSuw3). Use it now that backend P0 to P10 and frontend F0 to F9 are done. It replaces the remaining sync-gate steps (G3 and G4) with a version that runs in the teammate's environment.

## 1. Where we are and what changes

- **Done:** backend P0 to P10, golden responses sent. Frontend F0 to F9, with the contract checker verified against the golden responses.
- **Remaining:** live integration (the F9b step), evaluation run, evidence (F10), README, video, submission.
- **What changes:** integration now runs in the teammate's environment (Option B from the Build Plan). Hardik's Codex budget is nearly used, so Hardik moves to packaging, testing, review, and submission prep, and the teammate's Codex does the hands-on work.
- **Fallback (Option A):** if the teammate's environment cannot reach the model gateway, Hardik's machine runs both parts by hand (no Codex needed: unzip the frontend, npm install, set the env flag, start the backend) and the teammate joins by screen share.

## 2. Credit-saving rules (apply to both people)

- One small task per Codex thread. Name the exact files it may read; do not let it explore the whole repo.
- Run tests and servers yourself in a terminal. Paste only the last 20 to 30 lines of an error into Codex, never full logs.
- Ask for diffs and short reports, not full file dumps.
- Do not re-run an unchanged prompt. If a result is wrong, add the missing detail and fix forward.
- Hardik keeps his remaining Codex budget as a break-glass option. For debugging, paste the error (no keys) into this chat and get a ready-to-paste fix prompt for the teammate's Codex.

## 3. Handoff: what Hardik sends

**Send:** backend/, data/ (playbooks, cves, alerts, eval, mock), eval/, scripts/, golden/, docs/ (spec.md, CHANGELOG-contract.md, schemas/), AGENTS.md, README.md, .env.example, the Python requirements or pyproject file, and the tests.

**Never send:** .env, any key, data/chroma (rebuilt on the other side), data/app.db, .venv, **pycache**, node\_modules, dist. Keep your own data/usage.jsonl as evidence of your API usage; the integrated runs will create a new one.

Run this from the backend project root. It builds the zip and refuses to finish if a secret or the index slipped in:

```python
import os, time, zipfile

SKIP_DIRS = {'.venv', 'venv', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', 'node_modules', 'dist', '.git', 'chroma', 'frontend'}
SKIP_FILES = {'.env', 'app.db', 'usage.jsonl'}
stamp = time.strftime('%H%M')
out = 'sopilot-backend-v1-' + stamp + '.zip'

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f in SKIP_FILES or f.endswith('.zip') or f.endswith('.pyc'):
                continue
            z.write(os.path.join(root, f))

names = zipfile.ZipFile(out).namelist()
assert not [n for n in names if n.split('/')[-1] == '.env' or 'chroma' in n], 'secret or index found in zip'
print('wrote', out, 'with', len(names), 'files')
```

**Handoff note to send with the zip (fill in the blanks):**

```
Subject: SOPilot backend handoff (Contract v1)
Zip: sopilot-backend-v1-HHMM.zip (no .env, no chroma, no usage log)
Python version: ___     Start commands: (copy the exact ones from README)
Models in .env.example: MODEL_MAIN=___  MODEL_FAST=___  MODEL_FALLBACK=___  MODEL_EMBED=___
Tests: pytest result ___
Eval: not run / results ___
Thresholds now: RETRIEVAL_MIN_SCORE=___  RETRIEVAL_MIN_MARGIN=___
Known issues: ___
Next: run I0 to I8 in the Integration and Finish Plan.
```

## 4. Teammate environment: prerequisites and layout

- Python 3.11, Node 20 or newer, pip, and the teammate's own gateway key from his email. The network must reach genailab.tcs.in (the same network or VPN Hardik used).
- Unzip the backend zip into the root of soc-sentinel-ui/, next to the existing docs/ and frontend/. The result should be: backend/, data/, eval/, scripts/, golden/, docs/, frontend/, plus a root AGENTS.md (backend rules) and frontend/AGENTS.md (frontend rules). Keep one docs/spec.md; both copies should say Contract version v1.
- The teammate creates the root .env by copying .env.example and typing his own key himself. Codex must never open or print that file.
- Keep the golden/ folder: the frontend copy is already in frontend/src/mocks/golden/.

## 5. Sequence, time estimates, and stop conditions

| Step | Prompt | Where | About | Stop or fallback |
| --- | --- | --- | --- | --- |
| 1 | Hardik sends zip and handoff note | Hardik | 10 min | None |
| 2 | I0 merge check and environment | Teammate | 15 min | Version mismatch: stop and compare the changelog |
| 3 | I1 gateway smoke test | Teammate | 10 min | Any FAIL from network or SSL: use Option A |
| 4 | I2 index and start backend | Teammate | 15 min | Health not ok: use I4 hotfix |
| 5 | I3 live frontend (F9b) | Teammate | 45 min | Backend deviations go to INTEGRATION-ISSUES.md, then I4 |
| 6 | I5 evaluation run and tuning | Teammate | 30 min | Citation validity below 100 percent: fix before anything else |
| 7 | I6 end-to-end check and demo reset | Teammate | 30 min | Cut first if time is short |
| 8 | F10 live screenshots | Teammate | 20 min | Mock-mode capture is the fallback |
| 9 | I7 README, usage summary, submission folder | Teammate | 25 min | None |
| 10 | Demo rehearsal, then the video | Both | 45 min | Record on the machine that runs the full stack |
| 11 | I8 freeze and final regression | Teammate | 20 min | Fixes only |
| 12 | Upload to Prime | Teammate with Hardik | 60 min buffer | Confirm the cutoff time first |

Work backwards from the submission cutoff. Total is about 5 hours. If time runs short, cut in this order: I6, the usage-summary polish, light-theme polish. Never cut I3, I5, F10, or the video.

## 6. Prompts

Paste this thread starter at the top of every integration thread:

```
Before doing anything, read AGENTS.md at the repo root and frontend/AGENTS.md, then docs/spec.md. Do not open or print .env. Do not change the contract. Work only on the task below, keep diffs small, run the relevant tests before finishing, and report results (last lines only).
```

This is the Integration phase block that I0 adds to the root AGENTS.md:

```
## Integration phase (backend and frontend in one folder)
- This folder now holds backend/, frontend/, data/, eval/, scripts/, golden/ and docs/.
- The contract is docs/spec.md (Contract version v1). Never change schemas, field names, enums or endpoints without a version bump and a line in docs/CHANGELOG-contract.md, and update frontend/src/api/types.ts and the fixtures in the same change.
- Backend code was written and tested elsewhere. Change it only to fix a reproduced bug: failing test first, smallest possible diff, and an entry in docs/BACKEND-HOTFIXES.md (date, symptom, cause, files, test name). No refactors.
- Never print, log or commit keys. .env is edited by the user only.
- Run pytest and the frontend build and tests before finishing and report results.
```

### I0 - Merge check and environment

```
Goal: make the merged folder consistent and runnable.
Context: the backend zip was unzipped into the root of this folder, next to frontend/ and docs/.
Do: (1) list the top-level structure and confirm backend/, data/, eval/, scripts/, golden/, docs/ and frontend/ exist. (2) Compare the Contract version in the header of docs/spec.md with the comment at the top of frontend/src/api/types.ts and report if they differ. (3) In the root AGENTS.md, replace the line that starts with This repo holds backend, data and eval only with the Integration phase block I will paste below. (4) Create a Python 3.11 virtual environment at .venv, install the backend dependencies from the project requirements file, and run the backend tests that do not need network access. (5) Make sure .gitignore covers .env, .venv, data/chroma, data/app.db, node_modules, dist and test-results.
Constraints: do not open, print or create the .env file; I create it myself from .env.example.
Acceptance: structure confirmed, versions match, tests pass or each failure is listed with its cause, .gitignore updated.
```

### I1 - Gateway smoke test

```
Goal: prove this environment reaches the gateway and the models work.
Do: create scripts/smoke_gateway.py. It reads settings through backend/app/config.py and builds the client the same way backend/app/llm.py does (TLS_VERIFY from config). For MODEL_MAIN, MODEL_FAST and MODEL_FALLBACK it checks a basic Responses call, a strict structured-output call, and a function-call request; then one embedding call with MODEL_EMBED, printing the vector length. Print one line per check with OK or FAIL, latency and a short error. Never print the key or full request bodies. Exit code 1 if any check fails.
Constraints: do not change llm.py.
Acceptance: python scripts/smoke_gateway.py prints 10 OK lines and a vector length of 3072.
```

If any line fails because of the network or SSL, stop and switch to Option A.

### I2 - Build the index and start the backend

```
Goal: build the vector index and start the backend.
Do: run python -m app.ingest --rebuild and report the chunk counts. Start the backend with uvicorn on port 8000. Verify GET /api/health returns status ok with index_chunks above 0 and mock false, and GET /api/samples returns 6 items. Run the backend pytest suite including tests that call the gateway and report failures. Fix only environment-specific problems (paths, encodings, ports, dependency pins).
Constraints: no contract changes; no logic changes in the parser, retrieval, generate, verify or ticket modules; anything else follows the hotfix rule in AGENTS.md.
Acceptance: health ok with index_chunks equal to total steps plus CVEs; samples returns 6; tests pass or each failure is listed with its cause.
```

### I3 - Live frontend (F9b)

```
Goal: run the frontend against the live backend and clear every mismatch.
Do: set frontend/.env.local to VITE_USE_MOCK=false and VITE_API_BASE_URL=http://localhost:8000/api. Start the frontend dev server. For each of the 6 samples run the full flow in the browser (or with a script that uses the same API client) and collect every contract-checker warning, console error and failed request. Fix the frontend for any rendering or handling problem. For a real backend deviation from docs/spec.md, do not edit types.ts or the backend: write it to docs/INTEGRATION-ISSUES.md (endpoint, field path, expected, got, sample) and stop.
Constraints: the backend shape wins; no contract change.
Acceptance: zero contract warnings across the 6 samples; the header badge says Live; approving works and a second approve shows the friendly message; any backend deviation is listed in docs/INTEGRATION-ISSUES.md.
```

### I4 - Backend hotfix (reusable template)

```
Goal: fix this reproduced backend issue: <symptom, endpoint, and the last 20 lines of the error>.
Do: first write a failing test that reproduces it; then make the smallest fix; rerun the whole backend test suite; append an entry to docs/BACKEND-HOTFIXES.md (date, symptom, cause, files changed, test name).
Constraints: no schema, field, enum or endpoint changes; no refactors; if the fix needs a contract change, stop and explain instead.
Acceptance: the new test fails before the fix and passes after; the suite is green; the entry is added.
```

### I5 - Evaluation run and threshold tuning

```
Goal: run the evaluation and tune thresholds through configuration only.
Do: run python eval/run_eval.py and report the table: overall and per-category pass rate, citation validity, unsupported-step rate, correct fallback rate, p50 and p95 latency, with and without the verifier. List every failing case with its returned status, playbook and reason. If failures come from the fallback thresholds, propose values for RETRIEVAL_MIN_SCORE and RETRIEVAL_MIN_MARGIN from the observed scores of the no-match and ambiguous cases (E08, E09, E10) versus the reworded cases (E06, E07); write the proposed values in eval/report.md so I can apply them to my .env, and rerun after I do. Do not edit prompts or code unless a failure is a clear bug, and then use the hotfix rule.
Constraints: citation validity must be 100 percent; keep each run in eval/runs/ with a timestamp.
Acceptance: eval/report.md and eval/results.json are written; the final run passes the citation-validity gate; the chosen thresholds are documented in the report.
```

### I6 - Live end-to-end check and demo reset

```
Goal: a repeatable live end-to-end check and a clean demo reset.
Do: add a Playwright test (npm run e2e in frontend/, install the chromium browser if missing) that runs against the live stack: load the ransomware sample, run it, assert a grounded checklist with at least 3 citation chips and that clicking one shows the source text; run the no-match sample and assert the no-match banner; create and approve a ticket and check the audit tab has one row per stage. Add scripts/reset_demo.py that deletes the rows of the runs, tickets and audit tables but keeps the vector index, and prints the counts.
Constraints: the API base URL comes from env; no secrets.
Acceptance: npm run e2e passes against the live stack; reset_demo.py leaves empty tables and the index intact.
```

### F10 (updated) - Live screenshots

```
Goal: capture the final screenshots from the live stack.
Do: extend the Playwright screenshot script so it can run against the live backend (env LIVE=1) and save PNGs at 1440x900 to docs/screens/ with these names: 01-intake, 02-parsed-alert, 03-checklist-grounded, 04-citation-panel, 05-low-confidence, 06-no-match, 07-approval, 08-ticket-approved, 09-audit. Use the dark theme. Run scripts/reset_demo.py first so the audit tab is clean. Use the ransomware sample for the grounded shots and the USB sample for no-match. For low-confidence, use whichever real sample produces that status; if none does, capture that one screenshot in mock mode and say so in the note.
Constraints: no secrets in any screenshot; with LIVE=1 do not fake states with mocks except the one noted case.
Acceptance: nine non-blank files and a short note listing which sample and mode produced each screenshot.
```

### I7 - README, usage evidence, submission folder

```
Goal: finish documentation and evidence.
Do: (1) scripts/usage_summary.py reads data/usage.jsonl and writes a Markdown table by model and stage (calls, input and output tokens, p50 latency, fallback count) to submission/openai-usage-summary.md. (2) Write README.md: what SOPilot does, the pipeline in text, setup for backend and frontend on Windows and on macOS or Linux, environment variables, how to run tests, the evaluation, and a Responsible AI section covering citation-or-silence, the verifier, human approval, the audit log, redaction, synthetic data and the TLS_VERIFY caveat. Take the real numbers from eval/report.md. (3) Create submission/ with the eval report copy, golden sample responses, the screenshots, and a checklist file listing every required artifact.
Constraints: no keys; every number must come from a file, not be invented.
Acceptance: the summary and README exist; every number in the README matches the report; submission/ holds the files.
```

### I8 - Freeze and final regression

```
Goal: freeze and verify.
Do: run backend pytest, python eval/run_eval.py, and in frontend/ npm run build, npm test and npm run e2e; run scripts/reset_demo.py; confirm .env, .venv, data/chroma and node_modules are not tracked; write FREEZE.md with the folder state, test counts, eval numbers and the exact commands to start the demo, then test those commands from a clean terminal.
Constraints: no feature changes; fix only failures, using the hotfix rule.
Acceptance: all checks green; FREEZE.md lists the start commands and they work from a clean terminal.
```

## 7. When something fails

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Connection or timeout error to the gateway | Not on the TCS network or VPN, or a proxy | Connect to the right network and retry; if it still fails, use Option A |
| SSL certificate error | TLS\_VERIFY is true | Set TLS\_VERIFY=false in .env (single flag), or use the corporate CA bundle |
| 401 or 403 | Key typed wrongly or not yet active | Retype the key from the email into .env; restart the backend |
| Model not found | Name differs in this account | Run the model list call, pick the matching name for MODEL\_MAIN, MODEL\_FAST, MODEL\_FALLBACK |
| 429 or very slow responses | Gateway rate limit | Wait a minute, run one sample at a time, keep the fallback model enabled |
| Embedding errors or wrong vector length | Wrong embedding model name | Use the text-embedding-3-large name from the model list; rebuild with python -m app.ingest --rebuild |
| index\_chunks is 0 | Index not built | Run python -m app.ingest --rebuild, restart the backend |
| CORS error in the browser | Frontend not on port 5173 | Start Vite on 5173 or add the origin in backend config |
| Port 8000 already in use | Another process | Stop it, or change the port in both the backend start command and VITE\_API\_BASE\_URL |
| Chroma file lock on Windows | Backend still running during a rebuild | Stop the backend, delete data/chroma, rebuild |
| Contract warnings in the browser | Real shape differs from types.ts | Do not edit types.ts; log it in docs/INTEGRATION-ISSUES.md and send it to Hardik |
| Codex budget running low | Too many large threads | Apply section 2; use this chat to prepare fix prompts |

## 8. Roles during integration

**Teammate (integration lead):** runs I0 to I8 and F10, owns the final folder, and records the video. Reports progress after each step in two lines: what passed and what is blocking.

**Hardik (review and submission prep, no Codex needed):**

- Sends the zip and the handoff note.
- Is on call for backend questions. Pastes errors (no keys) into this chat to get fix prompts, and sends the teammate any hotfix he writes.
- Applies threshold values from the I5 report to his own copy so the two copies stay in sync.
- Checks the Prime submission requirements and cutoff time, drafts the submission description text, and reviews the final README and video before upload.
- Keeps his own data/usage.jsonl and Codex session screenshots as evidence.

**Contract rule still applies:** any change to a field, enum, or endpoint is a version bump (v2) with a changelog line. Hardik confirms it; the teammate updates types.ts and the fixtures in the same change.

## 9. Done when

- The backend runs in the teammate's environment and the UI is Live with zero contract warnings on all 6 samples.
- The evaluation passes with 100 percent citation validity, and the numbers are in the README.
- Nine real screenshots, the usage summary, the README, and the video exist in submission/.
- The freeze check is green, the demo starts from a clean terminal using the commands in FREEZE.md, and the package is uploaded to Prime before the cutoff.
