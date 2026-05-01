#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CUT Athletiq — RLS Regression Harness
 *
 * Verifies cross-team isolation and POPIA scoping for the four roles
 * (athlete / coach / physio / admin) across the most sensitive surfaces.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/test-rls.js
 *
 *   # or simply:
 *   npm run test:rls
 *
 * Exit code: 0 = all pass, 1 = any failure (CI-friendly).
 *
 * The script:
 *   1. Seeds two teams (team_a, team_b) and one user per role per team (8 users).
 *   2. For each role, signs in with the publishable key (RLS active) and runs
 *      a battery of read/write probes that should pass or fail.
 *   3. POPIA-critical: confirms a coach reading injury_records NEVER sees
 *      treatment_notes (the clinical free-text column). Any leak is severity=critical.
 *   4. Writes a structured JSON report to ./reports/rls-report-<ts>.json
 *      and prints a summary to stdout. Exits 1 on any failure.
 */

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !PUBLISHABLE_KEY) {
  console.error(
    "Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY.",
  );
  process.exit(2);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RUN_ID = Date.now().toString(36);
const PASSWORD = "RlsHarness!2026";
const ROLES = ["athlete", "coach", "physio", "admin"];

const failures = [];
const passes = [];
const warnings = [];

function record(role, surface, operation, expected, actual, severity = "high") {
  const ok = expected === actual;
  const entry = { role, surface, operation, expected, actual, severity };
  if (ok) passes.push(entry);
  else failures.push(entry);
  const tag = ok ? "✓" : severity === "critical" ? "✗ CRITICAL" : "✗";
  console.log(`  ${tag}  ${role.padEnd(7)} | ${surface.padEnd(22)} | ${operation}`);
}

async function ensureUser(email, role, teamId) {
  // Try to find existing user; if not, create.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list?.users?.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: role,
        last_name: `T-${teamId.slice(0, 4)}`,
        role,
        consent_coach_training: true,
        consent_physio_health: true,
      },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    user = data.user;
  }
  // Force profile row to correct role + team (handle_new_user trigger may have set defaults).
  await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        first_name: role,
        last_name: `T-${teamId.slice(0, 4)}`,
        role,
        team_id: teamId,
        consent_coach_training: true,
        consent_physio_health: true,
        consent_at: new Date().toISOString(),
        onboarding_complete: true,
      },
      { onConflict: "id" },
    );
  return user;
}

async function ensureTeam(name, sport, coachId) {
  const { data: existing } = await admin
    .from("teams")
    .select("*")
    .eq("name", name)
    .maybeSingle();
  if (existing) {
    if (existing.coach_id !== coachId) {
      await admin.from("teams").update({ coach_id: coachId }).eq("id", existing.id);
    }
    return existing;
  }
  const { data, error } = await admin
    .from("teams")
    .insert({ name, sport, coach_id: coachId, join_code: `RLS${RUN_ID.toUpperCase()}` })
    .select("*")
    .single();
  if (error) throw new Error(`createTeam ${name}: ${error.message}`);
  return data;
}

async function seed() {
  console.log("\n→ Seeding two teams + 4 roles each…");

  // Bootstrap coaches first so we can assign teams to them.
  const tag = RUN_ID;
  const emails = {};
  for (const team of ["a", "b"]) {
    for (const role of ROLES) {
      emails[`${role}_${team}`] = `rls.${role}.${team}.${tag}@cut-athletiq.test`;
    }
  }

  // Create teams with a placeholder coach_id (use the team's own coach user).
  // We need the coach user IDs first → create users with team_id=null, then update.
  const users = {};
  for (const team of ["a", "b"]) {
    for (const role of ROLES) {
      const email = emails[`${role}_${team}`];
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      let u = list?.users?.find((x) => x.email === email);
      if (!u) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: {
            first_name: role,
            last_name: `Team${team.toUpperCase()}`,
            role,
            consent_coach_training: true,
            consent_physio_health: true,
          },
        });
        if (error) throw new Error(`createUser ${email}: ${error.message}`);
        u = data.user;
      }
      users[`${role}_${team}`] = u;
    }
  }

  const teamA = await ensureTeam(`RLS Team A ${tag}`, "Rugby", users.coach_a.id);
  const teamB = await ensureTeam(`RLS Team B ${tag}`, "Football", users.coach_b.id);

  // Now update profiles with correct role + team_id.
  for (const team of ["a", "b"]) {
    const teamId = team === "a" ? teamA.id : teamB.id;
    for (const role of ROLES) {
      const u = users[`${role}_${team}`];
      await admin.from("profiles").upsert(
        {
          id: u.id,
          email: u.email,
          first_name: role,
          last_name: `Team${team.toUpperCase()}`,
          role,
          team_id: teamId,
          consent_coach_training: true,
          consent_physio_health: true,
          consent_at: new Date().toISOString(),
          onboarding_complete: true,
        },
        { onConflict: "id" },
      );
    }
  }

  // Seed an injury_record for each athlete with a clinical note (POPIA target).
  for (const team of ["a", "b"]) {
    const athlete = users[`athlete_${team}`];
    const physio = users[`physio_${team}`];
    const { data: existing } = await admin
      .from("injury_records")
      .select("id")
      .eq("athlete_id", athlete.id)
      .maybeSingle();
    if (!existing) {
      await admin.from("injury_records").insert({
        athlete_id: athlete.id,
        physio_id: physio.id,
        body_region: "knee",
        injury_type: "sprain",
        severity: 3,
        date_of_injury: new Date().toISOString().slice(0, 10),
        treatment_notes: `CONFIDENTIAL clinical note for team ${team} — should never reach a coach.`,
        rtp_status: "modified",
        expected_rtp_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      });
    }
  }

  // Seed a wellness_checkin per athlete.
  for (const team of ["a", "b"]) {
    const athlete = users[`athlete_${team}`];
    await admin
      .from("wellness_checkins")
      .upsert(
        {
          athlete_id: athlete.id,
          checkin_date: new Date().toISOString().slice(0, 10),
          sleep_hours: 7.5,
          sleep_quality: 4,
          readiness: 7,
          notes: `daily ${team}`,
        },
        { onConflict: "athlete_id,checkin_date" },
      )
      .select();
  }

  return { teamA, teamB, users, emails };
}

async function signedClient(email) {
  const c = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signin ${email}: ${error.message}`);
  return c;
}

async function runProbes({ teamA, teamB, users, emails }) {
  console.log("\n→ Running RLS probes…");

  // ---------- Athlete A ----------
  console.log("\n[athlete A]");
  const athA = await signedClient(emails.athlete_a);
  {
    // Own injury → readable
    const { data } = await athA
      .from("injury_records")
      .select("id, treatment_notes")
      .eq("athlete_id", users.athlete_a.id);
    record("athlete", "injury_records (own)", "SELECT", true, !!data?.length);

    // Other team athlete's injury → not readable
    const { data: leak } = await athA
      .from("injury_records")
      .select("id")
      .eq("athlete_id", users.athlete_b.id);
    record("athlete", "injury_records (other team)", "SELECT", 0, leak?.length ?? 0, "critical");

    // Wellness write → allowed for self
    const { error: wErr } = await athA.from("wellness_checkins").upsert(
      {
        athlete_id: users.athlete_a.id,
        checkin_date: new Date().toISOString().slice(0, 10),
        sleep_hours: 8,
        sleep_quality: 4,
        readiness: 8,
      },
      { onConflict: "athlete_id,checkin_date" },
    );
    record("athlete", "wellness_checkins (self)", "UPSERT", true, !wErr);

    // Wellness write for other athlete → blocked
    const { error: wErr2 } = await athA.from("wellness_checkins").insert({
      athlete_id: users.athlete_b.id,
      checkin_date: new Date().toISOString().slice(0, 10),
      sleep_hours: 1,
      sleep_quality: 1,
      readiness: 1,
    });
    record("athlete", "wellness_checkins (other)", "INSERT", true, !!wErr, "critical");

    // Cannot escalate role
    const { error: roleErr } = await athA
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", users.athlete_a.id);
    record("athlete", "profiles.role (self)", "UPDATE→admin", true, !!roleErr, "critical");
  }

  // ---------- Coach A ----------
  console.log("\n[coach A]");
  const coachA = await signedClient(emails.coach_a);
  {
    // Own team athletes visible
    const { data: ownTeam } = await coachA
      .from("profiles")
      .select("id")
      .eq("team_id", teamA.id);
    record("coach", "profiles (own team)", "SELECT", true, (ownTeam?.length ?? 0) >= 1);

    // Other team athletes NOT visible
    const { data: otherTeam } = await coachA
      .from("profiles")
      .select("id")
      .eq("team_id", teamB.id);
    record("coach", "profiles (other team)", "SELECT", 0, otherTeam?.length ?? 0, "critical");

    // POPIA: coach must NOT see treatment_notes on injury_records
    const { data: inj, error: injErr } = await coachA
      .from("injury_records")
      .select("id, treatment_notes")
      .eq("athlete_id", users.athlete_a.id);
    if (injErr) {
      // Either RLS blocks the row entirely (acceptable) OR returns rows without notes
      record("coach", "injury_records.treatment_notes", "SELECT (blocked)", true, true, "critical");
    } else {
      const leaked = (inj ?? []).some(
        (r) => r.treatment_notes != null && r.treatment_notes !== "",
      );
      record(
        "coach",
        "injury_records.treatment_notes (POPIA)",
        "SELECT must not leak",
        false,
        leaked,
        "critical",
      );
      if (leaked) {
        warnings.push({
          note: "Coach can read clinical treatment_notes via injury_records. Use injury_summary_for_coach view and revoke direct SELECT on treatment_notes column.",
        });
      }
    }

    // Cannot create injury record (physio-only)
    const { error: insErr } = await coachA.from("injury_records").insert({
      athlete_id: users.athlete_a.id,
      physio_id: users.coach_a.id,
      body_region: "ankle",
      injury_type: "strain",
      severity: 2,
      date_of_injury: new Date().toISOString().slice(0, 10),
    });
    record("coach", "injury_records", "INSERT (forbidden)", true, !!insErr, "critical");

    // Cannot read other-team wellness
    const { data: wOther } = await coachA
      .from("wellness_checkins")
      .select("id")
      .eq("athlete_id", users.athlete_b.id);
    record("coach", "wellness_checkins (other team)", "SELECT", 0, wOther?.length ?? 0, "critical");

    // Cannot read other team's calendar events
    // (events with team_id=teamB shouldn't be visible to coach A)
    await admin.from("team_events").upsert(
      {
        title: `Probe Event B ${RUN_ID}`,
        team_id: teamB.id,
        created_by: users.coach_b.id,
        event_date: new Date().toISOString().slice(0, 10),
        event_type: "training",
      },
      { onConflict: "id", ignoreDuplicates: false },
    );
    const { data: eB } = await coachA
      .from("team_events")
      .select("id")
      .eq("team_id", teamB.id);
    record("coach", "team_events (other team)", "SELECT", 0, eB?.length ?? 0);
  }

  // ---------- Physio A ----------
  console.log("\n[physio A]");
  const physioA = await signedClient(emails.physio_a);
  {
    // Physio reads injury_records across teams (current policy = all)
    const { data } = await physioA.from("injury_records").select("id");
    record("physio", "injury_records (all)", "SELECT", true, (data?.length ?? 0) >= 2);

    // Physio reads wellness across teams (current policy = all)
    const { data: w } = await physioA.from("wellness_checkins").select("id");
    record("physio", "wellness_checkins (all)", "SELECT", true, (w?.length ?? 0) >= 2);

    // Physio cannot become admin
    const { error } = await physioA
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", users.physio_a.id);
    record("physio", "profiles.role (self)", "UPDATE→admin", true, !!error, "critical");
  }

  // ---------- Admin A ----------
  console.log("\n[admin A]");
  const adminA = await signedClient(emails.admin_a);
  {
    const { data } = await adminA.from("profiles").select("id");
    // Admin should see everything (≥ 8 seeded users)
    record("admin", "profiles (global)", "SELECT", true, (data?.length ?? 0) >= 8);

    const { data: inj } = await adminA.from("injury_records").select("id");
    record("admin", "injury_records (global)", "SELECT", true, (inj?.length ?? 0) >= 2);
  }
}

async function main() {
  console.log("================================================");
  console.log(" CUT Athletiq — RLS Regression Harness");
  console.log(" Run:", RUN_ID);
  console.log("================================================");

  let seeded;
  try {
    seeded = await seed();
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(2);
  }

  try {
    await runProbes(seeded);
  } catch (e) {
    console.error("Probe error:", e.message);
    failures.push({
      role: "harness",
      surface: "runtime",
      operation: e.message,
      expected: "no error",
      actual: "error",
      severity: "critical",
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    project: "CUT Athletiq",
    run_id: RUN_ID,
    summary: {
      passed: passes.length,
      failed: failures.length,
      warnings: warnings.length,
      critical_failures: failures.filter((f) => f.severity === "critical").length,
    },
    failures,
    warnings,
  };

  mkdirSync("reports", { recursive: true });
  const out = join("reports", `rls-report-${RUN_ID}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));

  console.log("\n================================================");
  console.log(` Passed:   ${report.summary.passed}`);
  console.log(` Failed:   ${report.summary.failed}`);
  console.log(` Critical: ${report.summary.critical_failures}`);
  console.log(` Report:   ${out}`);
  console.log("================================================\n");

  if (report.summary.failed > 0) {
    console.log("FAILURES:");
    for (const f of failures) {
      console.log(
        `  - [${f.severity}] ${f.role} / ${f.surface} / ${f.operation}  expected=${f.expected} actual=${f.actual}`,
      );
    }
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
