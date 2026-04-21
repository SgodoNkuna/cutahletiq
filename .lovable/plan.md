

# CUT Athletiq — Phase 1 Test Build (Execution Plan)

Convert the static demo into a working multi-user app on Lovable Cloud with real auth, persistent data, team join codes, in-app nudges, and POPIA-compliant separation between coaching and clinical health data.

**Delivery:** single pass. Preview will be partially broken mid-build — expected.

---

## What you'll see when it's done

- Splash → Sign In / Sign Up (real email auth, no role pills on the login screen anymore)
- Sign up picks role + sport/position; Admin requires invite code; POPIA consent checkboxes required
- First login → onboarding → role dashboard with **real data only** (clean empty states, no seed mocks)
- Coach creates a team → 6-char join code (`BK7RX2` style) → athletes join with code (Zoom-style)
- Bell icon with unread nudge badge on every screen
- Permanent "TEST MODE" stamp bottom-right; splash tagline → "Phase 1 Test Build — Authorised Users Only"
- Privacy page linked from signup, profile, footer

---

## 1. Foundation
- Enable Lovable Cloud (Supabase auth + DB + storage; wires `src/integrations/supabase/client.ts` + admin client `client.server.ts`)
- Add secret `ADMIN_INVITE_CODE` (I'll prompt for value)
- Email auto-confirm ON for now; documented to flip before wider rollout
- Tear down demo: delete `DemoPanel.tsx`, `TourOverlay.tsx`, `routes/present.tsx`, `routes/demo-debug.tsx`; strip `mock.ts` to type defs only; remove all hardcoded names/PRs/leaderboard scores; remove "v0.1 concept demo" labels

## 2. Database (8 migrations + view + triggers + RLS)

`has_role(user_id, role)` security-definer function created first to avoid recursive RLS.

| Table | Coach reads? | Physio reads? |
|---|---|---|
| `profiles` (+ `onboarding_complete`, `consent_coach_training`, `consent_physio_health`, `consent_at`) | own + same team | own + same team |
| `teams` | all (join-code lookup) | all |
| `programmes` / `sessions` / `exercises` | own write / team read | no |
| `workout_logs` / `personal_records` | team read | no |
| `injury_checkins` (body-map, coaching layer) | **NO** | own teams |
| `injury_records` (clinical) | **NO** | own teams (write) |
| `rtp_status_view` (only bridge) | yes | yes |
| `nudges` | own only | own only |
| `consent_log` (POPIA audit) | own | own |
| `data_access_log` | admins only | own writes |

Triggers: auto-create `profiles` on signup; auto-insert nudges for `new_programme`, `pr_achieved`, `missed_session`, `rtp_status_change`, `injury_flagged`, `checkin_reminder`.

## 3. Auth flow
Replace `RoleProvider` mock with real `AuthProvider` (`onAuthStateChange` + `getSession`). Wrap protected routes in `_authenticated` layout with `beforeLoad` redirect. New routes: `/signup`, `/reset-password`, `/onboarding`, `/privacy`, `/join-team`. Friendly error mapping; no raw Supabase errors shown.

## 4. Team join codes (Zoom-style)
Coach creates team → 6-char uppercase alphanumeric code, copy + regenerate buttons. Athlete enters code → confirm team name → `UPDATE profiles SET team_id`.

## 5. Real data per role
- **Athlete:** dashboard reads today's session from `programmes/sessions/exercises`; logger inserts to `workout_logs` set-by-set with PR detection; progress chart from real logs; daily check-in writes `injury_checkins` (one/day, update allowed)
- **Coach:** roster from `profiles`, pulse from `rtp_status_view` only (never sees pain/diagnosis), programme builder writes the chain, leaderboard from real `workout_logs`, Nudge button
- **Physio:** today's check-ins (amber for pain ≥ 7), injury records table, log-injury form fires `rtp_status_change` nudge
- **Admin:** users, role/team management, POPIA tools (IO details, `data_access_log` viewer, promote admin, consent ledger)
- Calendar/Feed/Leaderboard: real data with clean empty states

## 6. Nudges
Bell icon top-right; unread badge; slide-in drawer with type icons; gold tint unread; "Mark all read"; real-time via Supabase channel on `nudges`.

## 7. POPIA layer
- `/privacy` page linked from signup, profile, footer. Covers what's collected, who-sees-what matrix, retention (24 months default), rights, Information Officer placeholder `dpo@cut.ac.za` + Bloemfontein switchboard +27 51 507 3911, with REPLACE-BEFORE-LIVE banner
- Consent gate on signup; stored in `profiles`; withdraw from Profile cascades through RLS
- `data_access_log` populated by server-function read wrappers for `injury_*`
- "Download my data" → server function JSON export (POPIA s.23)
- "Delete my account" → server function with 7-day grace (POPIA s.24)
- Coach RLS policies explicitly exclude `injury_*` tables (defence in depth)

## 8. Hardening
- Zod validation client + server-side on every server function
- Rate-limit signup + admin-code attempts (5/min/IP) via in-memory token bucket in server function
- DOMPurify sanitisation for free-text rendered (notes, treatment notes)
- Min 8-char password (HIBP check deferred — flip in Cloud later)
- Loading skeletons, empty states, green "Saved ✓" toast
- All raw errors logged server-side, never shown to user

## 9. Unchanged (per your Part 10)
CUT navy `#003478` / gold `#F5A800`, logo, screen layouts, card designs, bottom nav per role, body map SVG, leaderboard podium, programme builder layout, workout logger card, PR badge visual, line chart, sport filter pills, mobile-first responsive behaviour.

---

## Technical notes

- Server-side logic uses `createServerFn` (TanStack Start), not Edge Functions
- Three Supabase clients: browser (`client.ts`), auth-middleware-wrapped server, admin (`client.server.ts`) for RLS bypass in audit/export only
- `has_role()` security-definer function prevents RLS recursion on `profiles` policies that key off role
- `rtp_status_view` is the **only** SQL bridge between clinical and coaching layers — coach role has no `SELECT` policy on `injury_*` tables at all
- `data_access_log` written by every server function that reads `injury_checkins` or `injury_records`
- Admin invite code validated server-side only; never sent to client; rate-limited

## Risks
- Email auto-confirm ON during test → flip before wider rollout
- Admin invite code = shared secret → migrate to admin-promoted-only in Phase 2
- 7-day delete grace; admins can override; documented in Privacy
- All current preview data wiped — none of it is real

## Need from you after approval
1. Value for `ADMIN_INVITE_CODE` (I'll prompt via secret tool — pick something like `CUT-ADMIN-2026`)
2. Confirm placeholder IO contact (`dpo@cut.ac.za` + +27 51 507 3911) — flagged REPLACE-BEFORE-LIVE

Reply **"approve"** to execute.

