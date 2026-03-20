// Work System Snapshot — Calculation Layer
// Deterministic, lightweight, portable to backend.

// ─── Types ───────────────────────────────────────────────────────────

type MeetingLoad = "low" | "moderate" | "high" | "extreme";
type ThreeLevel = "low" | "moderate" | "high";
type WorkStructure = "independent" | "mixed" | "coordination_heavy";
type NotificationPressure = "low" | "moderate" | "high" | "constant";

export interface NormalizedSignals {
  meeting_load: MeetingLoad;
  work_structure: WorkStructure;
  focus_fragmentation: ThreeLevel;
  email_backlog: ThreeLevel;
  notification_pressure: NotificationPressure;
}

export interface WorkSystemResult {
  signals: NormalizedSignals;
  hours_lost: number;
  hourly_rate: number;
  estimated_cost: number;
  oei_score: number;
}

export type RawAnswers = Record<string, string>;

// ─── Step 1: Normalize Inputs ────────────────────────────────────────

export function normalizeSignals(answers: RawAnswers): NormalizedSignals {
  return {
    meeting_load: normalizeMeetingLoad(answers.meeting_load),
    work_structure: normalizeWorkStructure(answers.work_structure),
    focus_fragmentation: normalizeFocusFragmentation(answers.focus_fragmentation),
    email_backlog: normalizeEmailBacklog(answers.email_backlog),
    notification_pressure: normalizeNotificationPressure(answers.notification_pressure),
  };
}

function normalizeMeetingLoad(value: string): MeetingLoad {
  const map: Record<string, MeetingLoad> = {
    lt5: "low",
    "5-10": "moderate",
    "10-15": "high",
    "15-20": "extreme",
    "20+": "extreme",
  };
  return map[value] ?? "moderate";
}

function normalizeWorkStructure(value: string): WorkStructure {
  const map: Record<string, WorkStructure> = {
    independent: "independent",
    mix: "mixed",
    meetings: "coordination_heavy",
  };
  return map[value] ?? "mixed";
}

function normalizeFocusFragmentation(value: string): ThreeLevel {
  const map: Record<string, ThreeLevel> = {
    rarely: "low",
    sometimes: "moderate",
    often: "high",
    constantly: "high",
  };
  return map[value] ?? "moderate";
}

function normalizeEmailBacklog(value: string): ThreeLevel {
  const map: Record<string, ThreeLevel> = {
    "0-10": "low",
    "10-30": "moderate",
    "30-60": "high",
    "60+": "high",
  };
  return map[value] ?? "moderate";
}

function normalizeNotificationPressure(value: string): NotificationPressure {
  const map: Record<string, NotificationPressure> = {
    rarely: "low",
    sometimes: "moderate",
    often: "high",
    constantly: "constant",
  };
  return map[value] ?? "moderate";
}

// ─── Step 2: Hours Lost ──────────────────────────────────────────────

export function getHoursLost(signals: NormalizedSignals, rawMeetingLoad?: string): number {
  const meetingHoursValue = signals.meeting_load === "extreme"
    ? (rawMeetingLoad === "20+" ? 12 : 10)
    : ({ low: 2, moderate: 5, high: 8 } as Record<string, number>)[signals.meeting_load] ?? 5;

  const structureHours: Record<WorkStructure, number> = {
    independent: 1, mixed: 3, coordination_heavy: 6,
  };
  const focusHours: Record<ThreeLevel, number> = {
    low: 1, moderate: 2, high: 4,
  };
  const emailHours: Record<ThreeLevel, number> = {
    low: 1, moderate: 2, high: 3,
  };
  const notifHours: Record<NotificationPressure, number> = {
    low: 1, moderate: 2, high: 3, constant: 5,
  };

  const total =
    meetingHoursValue +
    structureHours[signals.work_structure] +
    focusHours[signals.focus_fragmentation] +
    emailHours[signals.email_backlog] +
    notifHours[signals.notification_pressure];

  return Math.round(clamp(total, 8, 30));
}

// ─── Step 3: Hourly Rate ─────────────────────────────────────────────

export function getHourlyRate(role: string): number {
  const map: Record<string, number> = {
    founder: 85,
    manager: 65,
    product_eng: 70,
    sales: 60,
    ic: 50,
    ops: 35,
    consultant: 75,
  };
  return map[role] ?? 50;
}

// ─── Step 4: Cost Calculation ────────────────────────────────────────

export function getEstimatedCost(hoursLost: number, hourlyRate: number): number {
  const raw = hoursLost * hourlyRate;
  return Math.round(raw / 10) * 10;
}

// ─── Step 5: OEI Score ───────────────────────────────────────────────

export function getOEIScore(signals: NormalizedSignals): number {
  let score = 100;

  const meetingPenalty: Record<MeetingLoad, number> = {
    low: 0, moderate: -10, high: -20, extreme: -30,
  };
  const structurePenalty: Record<WorkStructure, number> = {
    independent: 0, mixed: -5, coordination_heavy: -12,
  };
  const focusPenalty: Record<ThreeLevel, number> = {
    low: 0, moderate: -5, high: -10,
  };
  const emailPenalty: Record<ThreeLevel, number> = {
    low: 0, moderate: -5, high: -10,
  };
  const notifPenalty: Record<NotificationPressure, number> = {
    low: 0, moderate: -5, high: -10, constant: -15,
  };

  score += meetingPenalty[signals.meeting_load];
  score += structurePenalty[signals.work_structure];
  score += focusPenalty[signals.focus_fragmentation];
  score += emailPenalty[signals.email_backlog];
  score += notifPenalty[signals.notification_pressure];

  return Math.round(clamp(score, 10, 95));
}

// ─── Step 6: Full Calculation ────────────────────────────────────────

export function calculateWorkSystem(answers: RawAnswers, role: string): WorkSystemResult {
  const signals = normalizeSignals(answers);
  const hours_lost = getHoursLost(signals, answers.meeting_load);
  const hourly_rate = getHourlyRate(role);
  const estimated_cost = getEstimatedCost(hours_lost, hourly_rate);
  const oei_score = getOEIScore(signals);

  return {
    signals,
    hours_lost,
    hourly_rate,
    estimated_cost,
    oei_score,
  };
}

// ─── Util ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}