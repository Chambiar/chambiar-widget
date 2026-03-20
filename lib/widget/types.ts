// lib/widget/types.ts

export type IntegrationId =
  | "googleCalendar"
  | "gmail"
  | "slack"
  | "googleDocs"
  | "googleSheets"
  | "zoom"
  | "xero";

export type MetricId =
  | "hoursWasted"
  | "afterHoursMeetings"
  | "emailDebt"
  | "responseTime"
  | "collaborationBottleneck"
  | "notificationOverload"
  | "zoomFatigue"
  | "expenseBlindSpots"
  | "workStructure";

export interface Integration {
  id: IntegrationId;
  name: string;
  description: string;
  color: string;
  icon: string;
  metrics: MetricId[];
  optional?: boolean;
}

export interface Metric {
  id: MetricId;
  label: string;
  shortLabel: string;
  unit: string;
  icon: string;
  color: string;
  requiredIntegrations: IntegrationId[];
  formatValue: (value: number) => string;
  getShareText: (value: number) => string;
}

export interface WidgetMetricResult {
  id: MetricId;
  value: number;
  trend?: "up" | "down" | "neutral";
  status: "good" | "warning" | "bad";
}

export const INTEGRATIONS: Integration[] = [
  {
    id: "googleCalendar",
    name: "Google Calendar",
    description: "Meeting patterns & time analysis",
    color: "#4285F4",
    icon: "Calendar",
    metrics: ["hoursWasted", "afterHoursMeetings"],
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Email debt & response time",
    color: "#EA4335",
    icon: "Inbox",
    metrics: ["emailDebt", "responseTime"],
  },
  {
    id: "googleDocs",
    name: "Google Docs",
    description: "Document collaboration analysis",
    color: "#4285F4",
    icon: "FileText",
    metrics: ["collaborationBottleneck"],
  },
  {
    id: "googleSheets",
    name: "Google Sheets",
    description: "Spreadsheet collaboration analysis",
    color: "#0F9D58",
    icon: "Table",
    metrics: ["collaborationBottleneck"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Notification & message volume",
    color: "#E8912D",
    icon: "MessageSquare",
    metrics: ["notificationOverload"],
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Video call fatigue tracking",
    color: "#2D8CFF",
    icon: "Video",
    metrics: ["zoomFatigue"],
  },
  {
    id: "xero",
    name: "Xero",
    description: "Financial blind spots",
    color: "#13B5EA",
    icon: "DollarSign",
    metrics: ["expenseBlindSpots"],
  },
];