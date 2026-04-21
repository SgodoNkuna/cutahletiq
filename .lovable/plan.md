# CUT Athletiq — Phase 1 Test Build Plan

## Scope
Convert the static demo into a working multi-user app on Lovable Cloud with real email auth, persistent data, role-based access, team join codes, in-app nudges, and POPIA-compliant separation between coaching data and clinical health data.

Delivery mode: **single pass**. Preview will be partially broken mid-build (expected).

---

## 1. Foundation
1. Enable Lovable Cloud (provisions Supabase + auth + DB + storage; wires `src/integrations/supabase/client.ts` and an admin client `client.server.ts`).
2. Add secret `ADMIN_INVITE_CODE` — gates Admin self-signup.
3. Auto-confirm email = ON (your choice). Flip later in Cloud Auth settings before wider rollout.
4. Remove demo content: `DemoPanel`, `present` route, `TourOverlay`, mocked seed data, "v0.1 demo" labels, mock state in `role-context.tsx`. Splash tagline → "Phase 1 Test Build — Authorised Users Only". Permanent 10px grey "TEST MODE" stamp bottom-right on every screen.

## 2. Database (8 migrations + 1 view + triggers + RLS)
A `has_role(user_id, role)` security-definer function created first to avoid recursive RLS.

| Table | Coach can read? | Physio can read? |
|---|---|---|
| `profiles` | own + same team | own + same team |
| `teams` | all (for join code lookup) | all |
| `programmes` / `sessions` / `exercises` | own (write) / team (read) | no |
| `workout_logs` / `personal_records` | team (read) | no |
| `injury_checkins` (coaching layer body-map) | **NO** | yes (own teams) |
| `injury_records` (clinical) | **NO** | yes (own teams, write) |
| `rtp_status_view` (only bridge) | yes | yes |
| `nudges` | own only | own only |
| `consent_log` (POPIA audit) | own | own |
| `data_access_log` | none (admins only) | own writes |

Triggers: auto-create `profiles` row on auth signup (with metadata); auto-insert nudges for the 6 trigger types (`new_programme`, `pr_achieved`, `missed_session`, `rtp_status_change`, `injury_flagged`, `checkin_reminder`).

## 3. Auth flow (replaces current mock login)
- Splash → Get Started / Sign In
- Sign Up: first/last name, email, password (min 8), confirm, role pills, conditional sport+position, **Admin requires invite code** (validated server-side against `ADMIN_INVITE_CODE`), **POPIA consent checkboxes**.
- Sign In with friendly error mapping
- Forgot password → `resetPasswordForEmail` → `/reset-password` page
- Session: `onAuthStateChange` + `getSession` in new `AuthProvider` (replaces `RoleProvider`'s mock state). Routes wrapped in `_authenticated` layout with `beforeLoad` redirect.
- First login: if `onboarding_complete = false`, force `/onboarding`.

## 4. Team join codes
- Coach: create team → 6-char `BK7RX2` code with copy + regenerate.
- Athlete: input code → confirm team → `UPDATE profiles SET team_id`.

## 5. Real data wiring per role
- Athlete: dashboard, workout logger (set-by-set inserts + PR detection), progress (chart/heatmap/PR board), injury check-in (one per day, body map → `injury_checkins`).
- Coach: dashboard (roster from `profiles`, pulse via `rtp_status_view` only — never sees pain or diagnoses), programme builder, leaderboard, Nudge button.
- Physio: today's check-ins (amber for pain ≥ 7), injury records table, log-injury form (writes `injury_records`, fires `rtp_status_change` nudge).
- Admin: users, role/team management, POPIA tools (Information Officer details, `data_access_log` viewer, promote admin, consent ledger).
- Calendar/Feed/Leaderboard: real data with clean empty states.

## 6. Nudges
Bell icon top-right with unread badge; slide-in drawer with type icons, gold tint for unread, "Mark all read". Real-time via Supabase channel subscription on `nudges` for the current user.

## 7. POPIA layer
- `/privacy` page linked from signup, profile, footer. Covers what's collected, who sees what (matrix), retention (24 months default), legal basis, rights (access/correct/delete/withdraw), Information Officer placeholder `dpo@cut.ac.za` + Bloemfontein switchboard, with REPLACE-BEFORE-LIVE banner.
- Consent gate on signup; stored in `profiles.consent_coach_training`, `consent_physio_health`, `consent_at`.
- Withdraw consent in Profile → cascades through RLS.
- `data_access_log` populated by RLS-friendly read wrappers for `injury_*`.
- "Download my data" button → server function exports JSON (POPIA s.23).
- "Delete my account" → server function with 7-day grace (POPIA s.24).
- Coach RLS policies explicitly exclude `injury_*` tables.

## 8. Hardening
- Zod validation client + server-side
- Rate limit signup + admin-code attempts (5/min/IP)
- HTML sanitisation for free-text rendered (notes, treatment_notes)
- Strong password (min 8); HIBP check deferred (flip later)
- All errors → user-friendly toasts; raw Supabase errors logged not shown
- Loading skeletons, empty states, green "Saved ✓" toast

## 9. Tear-down
- `src/components/DemoPanel.tsx`
- `src/components/TourOverlay.tsx` + tour state
- `src/routes/present.tsx`
- Hardcoded seeds in `src/data/mock.ts` (keep type definitions only)
- `RoleProvider`'s mock check-ins, RPE logs, skip notices
- "v0.1 concept demo" splash text
- Demo disclaimer on login

## 10. Unchanged (per your Part 10)
CUT navy #003478 / gold #F5A800, logo, screen layouts, card designs, bottom nav per role, body map SVG, leaderboard podium, programme builder layout, workout logger card, PR badge visual, line chart, sport filter pills, mobile-first responsive behaviour.

---

## Need from you
1. **Approve this plan**
2. Paste value for `ADMIN_INVITE_CODE` (I'll prompt via secret tool)
3. Confirm placeholder IO contact (`dpo@cut.ac.za` + CUT Bloemfontein switchboard) — replace before live

## Risks
- Email auto-confirm ON during test → flip before wider rollout.
- Admin invite code = shared secret → migrate to admin-promoted-only in Phase 2.
- 7-day delete grace; admins can override; documented in Privacy.
- All current preview data wiped — none of it is real.

Reply **"approve"** (or edits) to execute.
