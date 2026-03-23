// Work System Snapshot — Calculation Layer
// Deterministic, lightweight, portable to backend.

// ─── Types ───────────────────────────────────────────────────────────

export type VisibilityLevel = "low" | "moderate" | "high";

export interface TimeBreakdown {
  meetings: number;
  coordination: number;
  execution: number;
}

export interface BreakdownMetric {
  label: string;
  value: string;
  status: "good" | "warning" | "bad";
}

export interface BreakdownCategory {
  title: string;
  metrics: BreakdownMetric[];
}

export interface WorkSystemResult {
  hours_lost: number;
  hourly_rate: number;
  estimated_cost: number;
  oei_score: number;
  time_breakdown: TimeBreakdown;
  execution_time: number;
  focused_work: number;
  strategic_work: number;
  night_work: number;
  visibility: VisibilityLevel;
  admin_ratio: number;
  breakdown_categories: BreakdownCategory[];
}

export type RawAnswers = Record<string, string>;

// ─── Step 1: Map Inputs ─────────────────────────────────────────────

function getSystemLoss(tools: string): number {
  const map: Record<string, number> = {
    "1-3": 2 * 0.8,    // 1.6
    "4-6": 5 * 0.8,    // 4.0
    "7-10": 8 * 0.8,   // 6.4
    "10+": 12 * 0.8,   // 9.6
  };
  return map[tools] ?? 4.0;
}

function getMeetingHours(meeting: string): number {
  const map: Record<string, number> = {
    lt5: 3,
    "5-10": 7,
    "10-15": 12,
    "15-20": 17,
    "20+": 22,
  };
  return map[meeting] ?? 7;
}

function getInterruptLoss(interruptions: string): number {
  const map: Record<string, number> = {
    rarely: 2,
    sometimes: 5,
    often: 8,
    constantly: 12,
  };
  return map[interruptions] ?? 5;
}

function getCoordinationLoss(coordination: string): number {
  const map: Record<string, number> = {
    rarely: 2,
    sometimes: 5,
    often: 8,
    constantly: 12,
  };
  return map[coordination] ?? 5;
}

function getNightWork(nightWork: string): number {
  const map: Record<string, number> = {
    "0": 0,
    "1-3": 2,
    "4-6": 5,
    "7-10": 8,
    "10+": 12,
  };
  return map[nightWork] ?? 0;
}

function getAdminRatio(admin: string): number {
  const map: Record<string, number> = {
    mostly_focused: 0.30,
    half: 0.55,
    mostly_admin: 0.85,
  };
  return map[admin] ?? 0.55;
}

function getVisibilityScore(visibility: string): number {
  const map: Record<string, number> = {
    regularly: 0.8,
    sometimes: 0.4,
    rarely: 0.1,
  };
  return map[visibility] ?? 0.4;
}

// ─── Step 2: Hourly Rate ────────────────────────────────────────────

export function getHourlyRate(role: string): number {
  const map: Record<string, number> = {
    founder: 90,
    manager: 70,
    product_eng: 75,
    sales: 65,
    ic: 55,
    ops: 40,
    consultant: 85,
    other: 55,
  };
  return map[role] ?? 55;
}

// ─── Step 3: Core Calculations ──────────────────────────────────────

export function calculateWorkSystem(answers: RawAnswers, role: string): WorkSystemResult {
  // Map raw answers to values
  const systemLoss = getSystemLoss(answers.tools);
  const meetingHours = getMeetingHours(answers.meetings);
  const interruptLoss = getInterruptLoss(answers.interruptions);
  const coordinationLoss = getCoordinationLoss(answers.coordination);
  const nightWork = getNightWork(answers.night_work);
  const adminRatio = getAdminRatio(answers.admin_ratio);
  const visibilityScore = getVisibilityScore(answers.visibility);

  // Core formulas
  const rawHoursLost = systemLoss + meetingHours + interruptLoss + coordinationLoss;
  const hoursLost = Math.min(Math.round(rawHoursLost), 32);
  const executionTime = 40 - hoursLost;
  const focusedWork = Math.round(executionTime * (1 - adminRatio) * 10) / 10;
  const strategicWork = Math.round(focusedWork * visibilityScore * 10) / 10;

  // Cost
  const hourlyRate = getHourlyRate(role);
  const estimatedCost = Math.round((hoursLost * hourlyRate) / 10) * 10;

  // Time breakdown for stacked bar
  const coordination = Math.round(systemLoss + interruptLoss + coordinationLoss);
  const meetings = meetingHours;
  const execution = Math.max(0, 40 - meetings - coordination);
  const timeBreakdown: TimeBreakdown = { meetings, coordination, execution };

  // Visibility level
  const visibility: VisibilityLevel =
    visibilityScore >= 0.7 ? "high" :
    visibilityScore >= 0.3 ? "moderate" :
    "low";

  // OEI Score
  const oeiScore = calculateOEI(answers);

  // Breakdown categories
  const breakdownCategories = getBreakdownCategories(answers, timeBreakdown, nightWork, visibility);

  return {
    hours_lost: hoursLost,
    hourly_rate: hourlyRate,
    estimated_cost: estimatedCost,
    oei_score: oeiScore,
    time_breakdown: timeBreakdown,
    execution_time: executionTime,
    focused_work: focusedWork,
    strategic_work: strategicWork,
    night_work: nightWork,
    visibility,
    admin_ratio: adminRatio,
    breakdown_categories: breakdownCategories,
  };
}

// ─── Step 4: OEI Score ──────────────────────────────────────────────

function calculateOEI(answers: RawAnswers): number {
  let oei = 100;

  // Meeting penalty (0 to -30)
  const meetingPenalty: Record<string, number> = {
    lt5: 0, "5-10": -8, "10-15": -15, "15-20": -22, "20+": -30,
  };
  oei += meetingPenalty[answers.meetings] ?? -8;

  // Interrupt penalty (0 to -15)
  const interruptPenalty: Record<string, number> = {
    rarely: 0, sometimes: -5, often: -10, constantly: -15,
  };
  oei += interruptPenalty[answers.interruptions] ?? -5;

  // Coordination penalty (0 to -15)
  const coordPenalty: Record<string, number> = {
    rarely: 0, sometimes: -5, often: -10, constantly: -15,
  };
  oei += coordPenalty[answers.coordination] ?? -5;

  // System penalty (0 to -10)
  const systemPenalty: Record<string, number> = {
    "1-3": 0, "4-6": -3, "7-10": -6, "10+": -10,
  };
  oei += systemPenalty[answers.tools] ?? -3;

  // Admin penalty (0 to -15)
  const adminPenalty: Record<string, number> = {
    mostly_focused: 0, half: -7, mostly_admin: -15,
  };
  oei += adminPenalty[answers.admin_ratio] ?? -7;

  // Visibility penalty (0 to -10)
  const visPenalty: Record<string, number> = {
    regularly: 0, sometimes: -5, rarely: -10,
  };
  oei += visPenalty[answers.visibility] ?? -5;

  return Math.round(clamp(oei, 10, 95));
}

// ─── Step 5: Breakdown Categories ───────────────────────────────────

function getBreakdownCategories(
  answers: RawAnswers,
  timeBreakdown: TimeBreakdown,
  nightWork: number,
  visibility: VisibilityLevel,
): BreakdownCategory[] {
  // Meeting status
  const meetingStatus = (answers.meetings === "lt5" || answers.meetings === "5-10") ? "good"
    : answers.meetings === "10-15" ? "warning" : "bad";

  // Tools status
  const toolStatus = answers.tools === "1-3" ? "good"
    : answers.tools === "4-6" ? "warning" : "bad";

  // Interruption status
  const intStatus = answers.interruptions === "rarely" ? "good"
    : answers.interruptions === "sometimes" ? "warning" : "bad";

  // Coordination status
  const coordStatus = answers.coordination === "rarely" ? "good"
    : answers.coordination === "sometimes" ? "warning" : "bad";

  // Night work status
  const nightStatus = nightWork === 0 ? "good"
    : nightWork <= 3 ? "warning" : "bad";

  // Visibility status
  const visStatus = visibility === "high" ? "good"
    : visibility === "moderate" ? "warning" : "bad";

  // Admin status
  const adminStatus = answers.admin_ratio === "mostly_focused" ? "good"
    : answers.admin_ratio === "half" ? "warning" : "bad";

  return [
    {
      title: "Coordination Load",
      metrics: [
        { label: "Meetings", value: `${timeBreakdown.meetings} hrs/wk`, status: meetingStatus as "good" | "warning" | "bad" },
        { label: "Tools", value: answers.tools ?? "—", status: toolStatus as "good" | "warning" | "bad" },
        { label: "Chasing updates", value: capitalize(answers.coordination ?? "—"), status: coordStatus as "good" | "warning" | "bad" },
      ],
    },
    {
      title: "Focus Disruption",
      metrics: [
        { label: "Interruptions", value: capitalize(answers.interruptions ?? "—"), status: intStatus as "good" | "warning" | "bad" },
        { label: "Admin vs focused", value: formatAdminLabel(answers.admin_ratio), status: adminStatus as "good" | "warning" | "bad" },
      ],
    },
    {
      title: "Work Impact",
      metrics: [
        { label: "After-hours work", value: nightWork === 0 ? "None" : `${nightWork} hrs/wk`, status: nightStatus as "good" | "warning" | "bad" },
        { label: "Visibility", value: capitalize(visibility), status: visStatus as "good" | "warning" | "bad" },
      ],
    },
  ];
}

// ─── Util ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatAdminLabel(value: string): string {
  const map: Record<string, string> = {
    mostly_focused: "Mostly focused",
    half: "Half and half",
    mostly_admin: "Mostly admin",
  };
  return map[value] ?? "—";
}
