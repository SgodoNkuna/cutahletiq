export type Role = "athlete" | "coach" | "physio" | "admin";

export const ROLES: { id: Role; label: string; emoji: string }[] = [
  { id: "athlete", label: "Athlete", emoji: "🏃" },
  { id: "coach", label: "Coach", emoji: "📋" },
  { id: "physio", label: "Physio", emoji: "🩺" },
  { id: "admin", label: "Admin", emoji: "🛡️" },
];

export const SPORTS = ["Rugby", "Football", "Athletics", "Netball", "Basketball"] as const;
export type Sport = (typeof SPORTS)[number];

export const currentAthlete = {
  id: "a1",
  name: "Thabo Mokoena",
  sport: "Rugby" as Sport,
  position: "Flanker",
  year: "2nd year, BTech Sport Mgmt",
  attendance: 92,
  streak: 6,
  readiness: 84,
};

export const roster = [
  { id: "a1", name: "Thabo Mokoena", sport: "Rugby", status: "ready", load: 78, attendance: 92 },
  { id: "a2", name: "Lerato Dlamini", sport: "Athletics", status: "ready", load: 65, attendance: 95 },
  { id: "a3", name: "Sipho Khumalo", sport: "Rugby", status: "fatigued", load: 88, attendance: 81 },
  { id: "a4", name: "Naledi Mthembu", sport: "Netball", status: "injured", load: 0, attendance: 60 },
  { id: "a5", name: "Karabo Pieterse", sport: "Football", status: "ready", load: 72, attendance: 90 },
  { id: "a6", name: "Mpho Botha", sport: "Basketball", status: "fatigued", load: 84, attendance: 87 },
  { id: "a7", name: "Zinhle Nkosi", sport: "Athletics", status: "ready", load: 70, attendance: 93 },
  { id: "a8", name: "Tumelo van Wyk", sport: "Rugby", status: "ready", load: 75, attendance: 89 },
] as const;

export type WorkoutSet = { reps: number; weight: number };
export type Exercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
  pr?: number; // current PR weight (kg)
  unit?: "kg" | "reps" | "m";
};

export const todaysWorkout: { title: string; focus: string; exercises: Exercise[] } = {
  title: "Strength — Lower",
  focus: "Posterior chain + power",
  exercises: [
    {
      id: "e1",
      name: "Back Squat",
      pr: 120,
      unit: "kg",
      sets: [
        { reps: 5, weight: 100 },
        { reps: 5, weight: 110 },
        { reps: 3, weight: 120 },
        { reps: 3, weight: 120 },
      ],
    },
    {
      id: "e2",
      name: "Romanian Deadlift",
      pr: 130,
      unit: "kg",
      sets: [
        { reps: 8, weight: 90 },
        { reps: 8, weight: 100 },
        { reps: 6, weight: 110 },
      ],
    },
    {
      id: "e3",
      name: "Walking Lunge",
      pr: 40,
      unit: "kg",
      sets: [
        { reps: 12, weight: 30 },
        { reps: 12, weight: 35 },
        { reps: 10, weight: 40 },
      ],
    },
  ],
};

export const personalRecords = [
  { lift: "Back Squat", value: 120, unit: "kg", date: "2025-03-22" },
  { lift: "Bench Press", value: 92, unit: "kg", date: "2025-02-14" },
  { lift: "Deadlift", value: 150, unit: "kg", date: "2025-04-01" },
  { lift: "40m Sprint", value: 5.12, unit: "s", date: "2025-03-30" },
  { lift: "Vertical Jump", value: 64, unit: "cm", date: "2025-04-08" },
];

export const squatProgression = [
  { week: "W1", kg: 95 },
  { week: "W2", kg: 100 },
  { week: "W3", kg: 102 },
  { week: "W4", kg: 105 },
  { week: "W5", kg: 110 },
  { week: "W6", kg: 112 },
  { week: "W7", kg: 117 },
  { week: "W8", kg: 120 },
];

// 8 weeks x 7 days heatmap (0-3 intensity)
export const trainingHeatmap: number[][] = [
  [2, 0, 3, 1, 2, 0, 0],
  [3, 1, 3, 0, 2, 1, 0],
  [2, 2, 3, 1, 3, 0, 0],
  [3, 0, 2, 2, 3, 1, 0],
  [2, 1, 3, 0, 2, 0, 0],
  [3, 2, 3, 1, 3, 1, 0],
  [3, 1, 2, 2, 3, 0, 1],
  [2, 0, 3, 1, 3, 1, 0],
];

export const injuries = [
  {
    id: "i1",
    athlete: "Naledi Mthembu",
    sport: "Netball",
    region: "Right Knee",
    severity: "Moderate",
    pain: 6,
    rtpDays: 14,
    status: "rehab",
    logged: "2025-04-08",
  },
  {
    id: "i2",
    athlete: "Sipho Khumalo",
    sport: "Rugby",
    region: "Left Hamstring",
    severity: "Mild",
    pain: 3,
    rtpDays: 5,
    status: "monitor",
    logged: "2025-04-12",
  },
  {
    id: "i3",
    athlete: "Mpho Botha",
    sport: "Basketball",
    region: "Right Ankle",
    severity: "Mild",
    pain: 2,
    rtpDays: 2,
    status: "cleared-soon",
    logged: "2025-04-14",
  },
];

export const leaderboard = [
  { rank: 1, name: "Lerato Dlamini", sport: "Athletics", points: 1480, change: "+3" },
  { rank: 2, name: "Thabo Mokoena", sport: "Rugby", points: 1442, change: "+1" },
  { rank: 3, name: "Karabo Pieterse", sport: "Football", points: 1390, change: "-1" },
  { rank: 4, name: "Tumelo van Wyk", sport: "Rugby", points: 1340, change: "+2" },
  { rank: 5, name: "Zinhle Nkosi", sport: "Athletics", points: 1310, change: "0" },
  { rank: 6, name: "Mpho Botha", sport: "Basketball", points: 1265, change: "-2" },
  { rank: 7, name: "Sipho Khumalo", sport: "Rugby", points: 1240, change: "+1" },
  { rank: 8, name: "Naledi Mthembu", sport: "Netball", points: 1180, change: "-3" },
];

export const feedPosts = [
  {
    id: "p0",
    pinned: true,
    author: "CUT Sports Dept.",
    role: "Admin",
    time: "Pinned",
    title: "🏆 Inter-Faculty Championships — Sat 26 Apr",
    body: "All squads report at the High-Performance Centre by 07:30. Kit collection Friday 16:00.",
  },
  {
    id: "p1",
    author: "Coach Mensah",
    role: "Rugby Coach",
    time: "2h",
    title: "Squad of the week",
    body: "Massive effort from the forwards in this morning's contact session. Recovery is mandatory tonight — 20min ice + mobility.",
  },
  {
    id: "p2",
    author: "Lerato Dlamini",
    role: "Athletics",
    time: "5h",
    title: "New 100m PB 🚀 — 11.42s",
    body: "Months of work. Big up to the S&C team. On to provincials!",
  },
  {
    id: "p3",
    author: "Physio Naidoo",
    role: "Physio",
    time: "Yesterday",
    title: "Recovery tip",
    body: "Sleep < 7h doubles soft-tissue injury risk. Log your sleep in-app — it counts toward readiness.",
  },
];

export type EventKind = "gym" | "physio" | "game" | "tournament" | "team" | "misc";
export type CalEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  kind: EventKind;
  title: string;
  location: string;
  who: string; // audience or attendee
  notes?: string;
};

// Anchor the demo "today" so the calendar always looks alive
export const TODAY_ISO = "2025-04-21";

export const calendarEvents: CalEvent[] = [
  { id: "c1", date: "2025-04-21", time: "06:00", kind: "gym", title: "Lower body strength", location: "HPC Weight Room", who: "Rugby squad", notes: "Bring lifting belts" },
  { id: "c2", date: "2025-04-21", time: "16:00", kind: "team", title: "Tactical session", location: "Field 2", who: "Rugby 1st XV" },
  { id: "c3", date: "2025-04-22", time: "07:30", kind: "physio", title: "Knee assessment — Naledi", location: "Physio Room A", who: "Physio Naidoo" },
  { id: "c4", date: "2025-04-22", time: "15:00", kind: "gym", title: "Upper push", location: "HPC Weight Room", who: "Athletics squad" },
  { id: "c5", date: "2025-04-23", time: "17:00", kind: "team", title: "Recovery + mobility", location: "Studio 1", who: "All squads" },
  { id: "c6", date: "2025-04-24", time: "06:30", kind: "gym", title: "Speed + plyo", location: "Track", who: "Athletics + Rugby backs" },
  { id: "c7", date: "2025-04-24", time: "14:00", kind: "physio", title: "Hamstring rehab — Sipho", location: "Physio Room B", who: "Physio Naidoo" },
  { id: "c8", date: "2025-04-25", time: "18:00", kind: "game", title: "vs UFS Shimlas", location: "CUT Stadium", who: "Rugby 1st XV", notes: "Warm-up 17:00" },
  { id: "c9", date: "2025-04-26", time: "07:30", kind: "tournament", title: "Inter-Faculty Champs · Day 1", location: "HPC Complex", who: "All squads" },
  { id: "c10", date: "2025-04-26", time: "12:00", kind: "misc", title: "Sponsor lunch — Standard Bank", location: "Boardroom", who: "Captains + Admin" },
  { id: "c11", date: "2025-04-27", time: "08:00", kind: "tournament", title: "Inter-Faculty Champs · Day 2", location: "HPC Complex", who: "All squads" },
  { id: "c12", date: "2025-04-28", time: "06:00", kind: "gym", title: "Recovery lift", location: "HPC Weight Room", who: "Rugby squad" },
  { id: "c13", date: "2025-04-28", time: "13:00", kind: "misc", title: "Athlete dietitian workshop", location: "Lecture Hall 4", who: "All athletes" },
  { id: "c14", date: "2025-04-29", time: "16:00", kind: "team", title: "Netball training", location: "Court 3", who: "Netball squad" },
  { id: "c15", date: "2025-04-30", time: "10:00", kind: "physio", title: "Squad screening day", location: "Physio Suite", who: "Football squad" },
  { id: "c16", date: "2025-05-02", time: "18:30", kind: "game", title: "vs TUT Vikings (away)", location: "Pretoria", who: "Football 1st XI" },
  { id: "c17", date: "2025-05-03", time: "09:00", kind: "tournament", title: "USSA Athletics Trials", location: "Bloemfontein", who: "Athletics squad" },
];

export const EVENT_KIND_META: Record<EventKind, { label: string; emoji: string; color: string; ring: string }> = {
  gym: { label: "Gym", emoji: "🏋️", color: "bg-navy text-white", ring: "ring-navy" },
  physio: { label: "Physio", emoji: "🩺", color: "bg-success text-white", ring: "ring-success" },
  game: { label: "Game", emoji: "🏉", color: "bg-destructive text-white", ring: "ring-destructive" },
  tournament: { label: "Tourney", emoji: "🏆", color: "bg-gold text-navy-deep", ring: "ring-gold" },
  team: { label: "Team", emoji: "👥", color: "bg-navy/80 text-white", ring: "ring-navy" },
  misc: { label: "Misc", emoji: "📌", color: "bg-foreground/70 text-white", ring: "ring-foreground" },
};
