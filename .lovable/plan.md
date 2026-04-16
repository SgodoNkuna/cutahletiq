
# CUT Athletiq — Interactive Demo Build Plan

A mobile-first multi-screen demo app for the CUT Sports Department's Monday presentation. All data hardcoded, no backend required.

## Design System
- **Colors**: Navy `#003478` (primary), Gold `#F5A800` (accent), background `#F4F6FA`, status greens/ambers/reds per spec
- **Type**: Bebas Neue for headers, DM Sans for body (Google Fonts)
- **Layout**: Mobile frame (max-width 430px) centered on desktop, with bottom nav bar inside the frame
- **CUT logo** (uploaded) used on splash + login

## Routes (TanStack Router)
Each screen is its own route for proper navigation/SSR:
- `/` — Splash with animated gold pulse, "Get Started" → Login
- `/login` — Email/password + 4-role pill selector (Athlete / Coach / Physio / Admin); selecting role routes to that dashboard
- `/athlete` — Athlete Dashboard (Thabo)
- `/athlete/workout` — Workout Logger with per-set logging, auto PR badges, finish confetti
- `/athlete/progress` — Recharts line chart, PR board, calendar heatmap
- `/athlete/injury` — Body silhouette tap-to-flag, pain slider, notes
- `/coach` — Coach Dashboard with roster + status dots + leaderboard preview
- `/coach/program` — Program Builder (sessions + exercises)
- `/physio` — Physio Dashboard with injury table + RTP tracker
- `/physio/log` — Injury Log Form
- `/leaderboard` — Podium + ranked list with sport filter pills
- `/feed` — Team Feed with pinned post + post cards

## Shared UI
- **MobileFrame**: wraps every screen, includes "Viewing as: [ROLE]" header tag, bottom nav (role-aware), footer watermark
- **DemoPanel**: floating gold "📋 Demo" pill (top-right), opens side sheet with quick-jump links to all 12 screens
- **BodyMap SVG**: reusable front/back silhouette with tappable regions (head, shoulder, knee, back, ankle, hamstring, etc.)
- **StatCard, StatusPill, SportTag, PRBadge** primitives

## Mock Data (single source)
`src/data/mock.ts` with athletes, coach, physio, injuries, today's workout, PRs, leaderboard exactly as specified in the prompt. Role state stored in a lightweight context so DemoPanel + role tag work across routes.

## Interactions
- Workout logger: local state for actual reps/weight per set, completed sets turn green, auto "NEW PR!" badge when weight beats stored PR, confetti burst + toast on Finish
- Injury check-in: tap body parts to toggle amber → red, slider 1–10, submit shows "Submitted" state with timestamp
- Program builder: add/remove sessions and exercise rows, team vs individual toggle
- Leaderboard: count-up animation on top stats, sport filter pills filter list
- All screen transitions use smooth CSS fade/slide

## Charts
Recharts line chart for 8-week progression (Squat data hardcoded per spec), simple CSS-grid heatmap for training calendar.

Once you approve, I'll implement all 12 screens, the demo panel, role switching, and mock data in one pass.
