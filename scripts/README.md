# RLS Regression Harness

Verifies cross-team isolation and POPIA scoping on the live Supabase project.

## Run

```bash
SUPABASE_URL="https://<project-ref>.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="eyJ..." \
SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
npm run test:rls
```

(`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are also accepted.)

## What it does

1. Seeds two teams (`RLS Team A`, `RLS Team B`) and one user per role per team
   (athlete / coach / physio / admin × 2 = 8 users). Re-runnable; existing users are reused.
2. Seeds one `injury_records` row per athlete with a `treatment_notes` value
   that **must never** reach a coach.
3. Signs in as each user with the publishable key (RLS active) and asserts:
   - own-team data is readable
   - other-team data is **not** readable
   - role-only writes (e.g. coach inserting injury_records) are rejected
   - role escalation via `profiles.role` UPDATE is rejected
   - **POPIA-critical**: `injury_records.treatment_notes` is never returned to a coach
4. Writes `reports/rls-report-<runId>.json` with summary + per-failure details.
5. Exits `1` on any failure, `0` on all pass — wire into CI as a deploy gate.

## Known gap

The current `injury_records` SELECT policy for physios is `true` (all teams).
Coach SELECT on `injury_records` is currently blocked entirely; if you later
relax it, route reads through the `injury_summary_for_coach` view to keep
`treatment_notes` out of coach queries.
