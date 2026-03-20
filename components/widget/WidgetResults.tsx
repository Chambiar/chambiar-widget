"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Moon,
  Inbox,
  Zap,
  FileText,
  Bell,
  Video,
  DollarSign,
  LayoutGrid,
  ExternalLink,
  ArrowLeft,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetSession } from "@/app/page";
import type { MetricId, WidgetMetricResult } from "@/lib/widget/types";

interface WidgetResultsProps {
  session: WidgetSession;
  onShare: () => void;
  onBack: () => void;
  updateSession: (updates: Partial<WidgetSession>) => void;
  onConnectApps?: () => void;
}

const metricConfig: Record<
  MetricId,
  {
    label: string;
    icon: typeof Clock;
    format: (v: number) => string;
    shareText: (v: number) => string;
  }
> = {
  hoursWasted: {
    label: "Hours Wasted",
    icon: Clock,
    format: (v) => `${v.toFixed(1)} hrs`,
    shareText: (v) => `${v.toFixed(1)} hours in meetings that could've been emails`,
  },
  afterHoursMeetings: {
    label: "After-Hours Meetings",
    icon: Moon,
    format: (v) => `${v}`,
    shareText: (v) => `${v} meetings scheduled after 6pm`,
  },
  emailDebt: {
    label: "Email Debt",
    icon: Inbox,
    format: (v) => `${v}`,
    shareText: (v) => `${v} emails over 7 days old`,
  },
  responseTime: {
    label: "Avg Response Time",
    icon: Zap,
    format: (v) => `${v.toFixed(1)} hrs`,
    shareText: (v) => `${v.toFixed(1)} hour average reply time`,
  },
  collaborationBottleneck: {
    label: "Stuck Documents",
    icon: FileText,
    format: (v) => `${v}`,
    shareText: (v) => `${v} docs waiting on others`,
  },
  notificationOverload: {
    label: "Daily Notifications",
    icon: Bell,
    format: (v) => `${v}`,
    shareText: (v) => `${v} Slack messages yesterday`,
  },
  zoomFatigue: {
    label: "Zoom Fatigue",
    icon: Video,
    format: (v) => `${v.toFixed(1)} hrs`,
    shareText: (v) => `${v.toFixed(1)} hours on video calls`,
  },
  expenseBlindSpots: {
    label: "Expense Blind Spots",
    icon: DollarSign,
    format: (v) => `$${v.toLocaleString()}`,
    shareText: (v) => `$${v.toLocaleString()}/mo in questionable subscriptions`,
  },
  workStructure: {
    label: "Work Structure",
    icon: LayoutGrid,
    format: (v) => v >= 7 ? "Coordination-heavy" : v >= 4 ? "Mixed" : "Independent",
    shareText: (v) => v >= 7 ? "Mostly meetings and coordination" : v >= 4 ? "Mix of meetings and solo work" : "Mostly independent work",
  },
};

function generateMockMetrics(
  integrations: WidgetSession["integrations"]
): WidgetMetricResult[] {
  const results: WidgetMetricResult[] = [];

  if (integrations.googleCalendar) {
    results.push({
      id: "hoursWasted",
      value: 8 + Math.random() * 10,
      trend: "up",
      status: "bad",
    });
    results.push({
      id: "afterHoursMeetings",
      value: Math.floor(2 + Math.random() * 6),
      trend: "up",
      status: Math.random() > 0.5 ? "warning" : "bad",
    });
  }

  if (integrations.gmail) {
    results.push({
      id: "emailDebt",
      value: Math.floor(50 + Math.random() * 150),
      trend: "up",
      status: "bad",
    });
    results.push({
      id: "responseTime",
      value: 2 + Math.random() * 8,
      trend: "neutral",
      status: Math.random() > 0.5 ? "warning" : "good",
    });
  }

  if (integrations.googleDocs || integrations.googleSheets) {
    results.push({
      id: "collaborationBottleneck",
      value: Math.floor(3 + Math.random() * 10),
      trend: "up",
      status: "warning",
    });
  }

  if (integrations.slack) {
    results.push({
      id: "notificationOverload",
      value: Math.floor(150 + Math.random() * 400),
      trend: "up",
      status: "bad",
    });
  }

  if (integrations.zoom) {
    results.push({
      id: "zoomFatigue",
      value: 4 + Math.random() * 8,
      trend: "up",
      status: Math.random() > 0.5 ? "warning" : "bad",
    });
  }

  if (integrations.xero) {
    results.push({
      id: "expenseBlindSpots",
      value: Math.floor(200 + Math.random() * 1000),
      trend: "neutral",
      status: "warning",
    });
  }

  return results;
}

function calculateScore(metrics: WidgetMetricResult[]): number {
  if (metrics.length === 0) return 0;
  const scores = metrics.map((m) => {
    switch (m.status) {
      case "good": return 100;
      case "warning": return 50;
      case "bad": return 20;
      default: return 50;
    }
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#047857";
  if (score >= 40) return "#ca8a04";
  return "#be123c";
}

function getScoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-emerald-50/60 border-emerald-200 text-emerald-700";
  if (score >= 40) return "bg-yellow-50/60 border-yellow-200 text-yellow-600";
  return "bg-rose-50/60 border-rose-200 text-rose-700";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

function getScoreSubline(score: number): string {
  if (score >= 86) return "Your work system is running efficiently, with minimal friction between effort and output.";
  if (score >= 71) return "Your work system is operating well, with some early signs of coordination overhead.";
  if (score >= 51) return "Your work system is functional, but coordination and communication are slowing execution.";
  if (score >= 31) return "A large portion of your week is spent managing work rather than making progress.";
  return "Your work system is consuming more time coordinating work than completing it.";
}

function getMariaInsight(score: number): string {
  if (score >= 86) return "Your systems are well-tuned. Small adjustments to meeting cadence or notification habits could unlock even more focused time.";
  if (score >= 71) return "You&apos;re in good shape overall, but coordination overhead is starting to creep in. Watch for meeting bloat and context-switching patterns.";
  if (score >= 51) return "Your work system is functional but inefficient. A significant portion of your week is lost to coordination, interruptions, and reactive work rather than execution.";
  if (score >= 31) return "Your work system is creating real drag. Meeting load, notification pressure, and coordination overhead are consuming time that should go toward meaningful output.";
  return "Your work system needs immediate attention. The majority of your time is being absorbed by coordination, interruptions, and after-hours spillover — leaving very little room for focused work.";
}

export default function WidgetResults({
  session,
  onShare,
  onBack,
  updateSession,
  onConnectApps,
}: WidgetResultsProps) {
  const isFormBased = session.dataSource === "form";
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [metrics, setMetrics] = useState<WidgetMetricResult[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (session.metrics && session.metrics.length > 0) {
      setMetrics(session.metrics);
      setScore(session.overallScore || calculateScore(session.metrics));
      setIsAnalyzing(false);
      return;
    }

    const analyze = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const generatedMetrics = generateMockMetrics(session.integrations);
      const calculatedScore = calculateScore(generatedMetrics);

      setMetrics(generatedMetrics);
      setScore(calculatedScore);
      updateSession({ metrics: generatedMetrics, overallScore: calculatedScore });
      setIsAnalyzing(false);
    };

    analyze();
  }, []);

  if (isAnalyzing) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-[#e2e8f0]" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#103257] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="h-8 w-8 text-[#3A628F]" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#103257]">
            Maria is analyzing your work patterns...
          </h2>
          <p className="text-[#3A628F]">
            Crunching data from {Object.values(session.integrations).filter(Boolean).length} connected apps
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-[#94A9C2]">
          <Loader2 className="h-4 w-4 animate-spin" />
          This usually takes a few seconds
        </div>
      </div>
    );
  }

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-[#103257]" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-[#3A628F]" />;
    return <Minus className="h-3 w-3 text-[#94A9C2]" />;
  };

  const StatusDot = ({ status }: { status: string }) => {
    const colors = {
      good: "bg-emerald-400/50 border-emerald-400",
      warning: "bg-yellow-400/50 border-yellow-400",
      bad: "bg-rose-400/50 border-rose-400",
    };
    return <div className={`w-2.5 h-2.5 rounded-full border ${colors[status as keyof typeof colors] || "bg-gray-300 border-gray-300"}`} />;
  };

  return (
    <div className="space-y-5">
      {/* Receipt-style Results Card */}
      <div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
        {/* Receipt Header */}
        <div className="bg-white p-4 text-center">
          <div className="text-2xl font-bold uppercase tracking-widest text-[#103257] mb-1">Work System Snapshot</div>
          <div className="text-base text-[#94A9C2] mt-[10px]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <p className="text-sm text-[#3A628F] max-w-md mx-auto my-[20px]">{getScoreSubline(score)}</p>

          {/* Metrics */}
          <div className="space-y-3 mt-5 text-left">
            {metrics.map((metric, index) => {
              const config = metricConfig[metric.id];
              const Icon = config.icon;
              const isHero = metric.id === "hoursWasted";

              const statusStyles = {
                good: "bg-emerald-50/60 border-emerald-200 text-emerald-700",
                warning: "bg-yellow-50/60 border-yellow-200 text-yellow-600",
                bad: "bg-rose-50/60 border-rose-200 text-rose-700",
              };
              const statusClass = statusStyles[metric.status as keyof typeof statusStyles] || "bg-[#f8fafc] border-[#e2e8f0] text-[#103257]";

              if (isHero) {
                return (
                  <div
                    key={metric.id}
                    className={`flex items-center justify-between p-5 rounded-xl border-2 hover:-translate-y-1 hover:shadow-md transition-all cursor-default ${statusClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-7 w-7" />
                      <span className="text-lg font-semibold">{config.label}</span>
                    </div>
                    <span className="text-3xl font-bold font-mono">
                      {config.format(metric.value)}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-[#e2e8f0] hover:-translate-y-1 hover:shadow-md transition-all cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#3A628F]" />
                    <span className="text-sm text-[#103257]">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-[#103257]">
                      {config.format(metric.value)}
                    </span>
                    <StatusDot status={metric.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-[#e2e8f0] my-5" />

          {/* Total Score */}
          <div className="text-center pb-2">
            <div className="text-xs text-[#94A9C2] uppercase tracking-wider mb-2">Total Score</div>
            <div
              className="text-5xl font-bold font-mono mb-2"
              style={{ color: getScoreColor(score) }}
            >
              {score}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getScoreBadgeClass(score)}`}
            >
              {getScoreLabel(score)}
            </span>
          </div>
        </div>
      </div>

      {/* Maria&apos;s insight */}
      <div className="p-6 bg-white rounded-xl border-2 border-[#e2e8f0]">
        {session.workSystem && session.assessmentScope === "team" && session.teamSize ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-[#e2e8f0]">
              <div className="p-4 bg-rose-50/60 border-2 border-rose-200 rounded-xl text-center">
                <div className="text-xs text-rose-600 uppercase tracking-wider mb-1">Time Lost / Person</div>
                <div className="text-3xl font-bold font-mono text-rose-700">{session.workSystem.hours_lost} hrs</div>
                <div className="text-xs text-rose-500 mt-1">per week</div>
              </div>
              <div className="p-4 bg-rose-50/60 border-2 border-rose-200 rounded-xl text-center">
                <div className="text-xs text-rose-600 uppercase tracking-wider mb-1">Team Total Hours</div>
                <div className="text-3xl font-bold font-mono text-rose-700">{session.workSystem.hours_lost * session.teamSize} hrs</div>
                <div className="text-xs text-rose-500 mt-1">{session.teamSize} people × {session.workSystem.hours_lost} hrs</div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#e2e8f0]">
              <div>
                <div className="text-xs text-[#3A628F]/60 uppercase tracking-wider mb-1">Execution Time / Person</div>
                <div className="text-2xl font-bold font-mono text-[#103257]">{40 - session.workSystem.hours_lost} hrs</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#3A628F]/60 uppercase tracking-wider mb-1">Est. Weekly Team Cost</div>
                <div className="text-2xl font-bold font-mono text-[#103257]">${(session.workSystem.estimated_cost * session.teamSize).toLocaleString()}</div>
              </div>
            </div>
            <p className="text-xs text-[#3A628F]/50 text-right -mt-4 mb-4">Based on average US compensation for your role</p>
          </>
        ) : session.workSystem ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-[#e2e8f0]">
              <div className="p-4 bg-rose-50/60 border-2 border-rose-200 rounded-xl text-center">
                <div className="text-xs text-rose-600 uppercase tracking-wider mb-1">Time Lost</div>
                <div className="text-3xl font-bold font-mono text-rose-700">{session.workSystem.hours_lost} hrs</div>
                <div className="text-xs text-rose-500 mt-1">per week</div>
              </div>
              <div className="p-4 bg-emerald-50/60 border-2 border-emerald-200 rounded-xl text-center">
                <div className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Execution Time</div>
                <div className="text-3xl font-bold font-mono text-emerald-700">{40 - session.workSystem.hours_lost} hrs</div>
                <div className="text-xs text-emerald-500 mt-1">remaining / week</div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#e2e8f0]">
              <div>
                <div className="text-xs text-[#3A628F]/60 uppercase tracking-wider mb-1">OEI Score</div>
                <div className="text-2xl font-bold font-mono" style={{ color: getScoreColor(score) }}>{score}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#3A628F]/60 uppercase tracking-wider mb-1">Est. Weekly Cost</div>
                <div className="text-2xl font-bold font-mono text-[#103257]">${session.workSystem.estimated_cost.toLocaleString()}</div>
              </div>
            </div>
            <p className="text-xs text-[#3A628F]/50 text-right -mt-4 mb-4">Based on average US compensation for your role</p>
          </>
        ) : null}

        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-[#103257] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <h4 className="font-semibold text-[#103257] mb-2">Maria&apos;s Insight</h4>
            <p className="text-sm text-[#3A628F] leading-relaxed">
              {getMariaInsight(score)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button onClick={onShare} variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Share Results
        </Button>
      </div>
    </div>
  );
}