"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Loader2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetSession } from "@/app/page";
import type { WidgetMetricResult } from "@/lib/widget/types";
import type { BreakdownCategory } from "@/lib/workSystemCalculator";

interface WidgetResultsProps {
  session: WidgetSession;
  onShare: () => void;
  onBack: () => void;
  updateSession: (updates: Partial<WidgetSession>) => void;
  onConnectApps?: () => void;
}

function generateMockMetrics(
  integrations: WidgetSession["integrations"]
): WidgetMetricResult[] {
  const results: WidgetMetricResult[] = [];
  if (integrations.googleCalendar) {
    results.push({ id: "hoursWasted", value: 8 + Math.random() * 10, trend: "up", status: "bad" });
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

function getHeroInterpretation(score: number): string {
  if (score >= 71) return "Your work system is mostly efficient, with some time lost to coordination overhead.";
  if (score >= 51) return "A significant portion of your week is going to coordination rather than execution.";
  if (score >= 31) return "Most of your week is being spent managing work, not completing it.";
  return "Your week is dominated by coordination. Very little time remains for focused work.";
}

function getMariaInsight(score: number, visibility: string): {
  diagnosis: string;
  consequence: string;
  emotional: string;
} {
  const visLine = visibility === "low"
    ? " Much of that effort is not visible to others."
    : visibility === "moderate"
    ? " Only some of that effort is visible to others."
    : "";

  if (score >= 71) {
    return {
      diagnosis: "Your work system is running with relatively low coordination overhead. Meetings and interruptions consume a manageable portion of your week.",
      consequence: `Most of your time is available for focused execution.${visLine}`,
      emotional: "Your week likely feels structured and productive.",
    };
  }
  if (score >= 51) {
    return {
      diagnosis: "Your work system is losing a significant portion of the week to meetings, coordination, and context switching.",
      consequence: `The time left for focused execution is being compressed into smaller and smaller windows.${visLine}`,
      emotional: "This is why your week feels busy but unproductive.",
    };
  }
  if (score >= 31) {
    return {
      diagnosis: "Your work system is dominated by coordination and interruptions. Meetings, tool switching, and reactive communication are consuming the majority of your available time.",
      consequence: `Most of your available time is being consumed before meaningful work can begin, leaving limited capacity for focused execution.${visLine}`,
      emotional: "This is why your week feels fragmented.",
    };
  }
  return {
    diagnosis: "Your work system is absorbing nearly all available time into coordination, meetings, and interruptions. There is very little room left for the work that actually matters.",
    consequence: `Execution capacity has been reduced to a fraction of your week. The gap between effort and output is significant.${visLine}`,
    emotional: "This is why nothing feels like enough, even when you\u2019re always on.",
  };
}

const StatusIndicator = ({ status }: { status: "good" | "warning" | "bad" }) => {
  const colors = {
    good: "bg-emerald-400/50 border-emerald-400",
    warning: "bg-yellow-400/50 border-yellow-400",
    bad: "bg-rose-400/50 border-rose-400",
  };
  return <div className={`w-2.5 h-2.5 rounded-full border ${colors[status]}`} />;
};

export default function WidgetResults({
  session,
  onShare,
  onBack: _onBack,
  updateSession,
}: WidgetResultsProps) {
  void _onBack;
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [, setMetrics] = useState<WidgetMetricResult[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (session.metrics && session.metrics.length > 0) {
      setMetrics(session.metrics);
      setScore(session.overallScore || calculateScore(session.metrics));
      setIsAnalyzing(false);
      return;
    }

    if (session.workSystem) {
      setScore(session.overallScore || session.workSystem.oei_score);
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
            Building your work system snapshot
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-[#94A9C2]">
          <Loader2 className="h-4 w-4 animate-spin" />
          This usually takes a few seconds
        </div>
      </div>
    );
  }

  const ws = session.workSystem;
  const oeiScore = ws?.oei_score ?? score;
  const hoursLost = ws?.hours_lost ?? 0;
  const executionTime = ws?.execution_time ?? (40 - hoursLost);
  const focusedWork = ws?.focused_work ?? 0;
  const strategicWork = ws?.strategic_work ?? 0;
  const nightWork = ws?.night_work ?? 0;
  const timeBreakdown = ws?.time_breakdown ?? { meetings: 0, coordination: 0, execution: 40 };
  const visibility = ws?.visibility ?? "moderate";
  const weeklyCost = ws?.estimated_cost ?? 0;
  const yearlyCost = weeklyCost * 52;
  const breakdownCategories = ws?.breakdown_categories ?? [];
  const insight = getMariaInsight(oeiScore, visibility);
  const heroInterpretation = getHeroInterpretation(oeiScore);

  const totalBarHours = timeBreakdown.meetings + timeBreakdown.coordination + timeBreakdown.execution;
  const meetingPct = totalBarHours > 0 ? (timeBreakdown.meetings / totalBarHours) * 100 : 0;
  const coordPct = totalBarHours > 0 ? (timeBreakdown.coordination / totalBarHours) * 100 : 0;
  const execPct = totalBarHours > 0 ? (timeBreakdown.execution / totalBarHours) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
        <div className="p-6">

          {/* 1. HEADER + HERO INTERPRETATION */}
          <div className="text-center py-[20px]">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-[#103257] mb-1">
              Your Work System Snapshot
            </h1>
            <p className="text-sm text-[#103257] font-medium max-w-md mx-auto mt-4">
              {heroInterpretation}
            </p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 2. HERO METRIC — Time lost to coordination */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              Coordination time lost this week
            </div>
            <div className="text-5xl font-bold font-mono text-[#103257]">
              {hoursLost} <span className="text-2xl font-normal">hours</span>
            </div>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 3. WORK WEEK BREAKDOWN */}
          <div className="py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-3">
              Where your week is going
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden border border-[#e2e8f0]">
              <div
                className="bg-[#103257] transition-all"
                style={{ width: `${meetingPct}%` }}
                title={`Meetings: ${timeBreakdown.meetings} hrs`}
              />
              <div
                className="bg-[#3A628F] transition-all"
                style={{ width: `${coordPct}%` }}
                title={`Coordination: ${timeBreakdown.coordination} hrs`}
              />
              <div
                className="bg-[#D9E7FF] transition-all"
                style={{ width: `${execPct}%` }}
                title={`Execution: ${timeBreakdown.execution} hrs`}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm text-[#3A628F]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#103257]" />
                Meetings — {timeBreakdown.meetings} hrs
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#3A628F]" />
                Coordination — {timeBreakdown.coordination} hrs
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#D9E7FF]" />
                Execution — {timeBreakdown.execution} hrs
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 4. EXECUTION CAPACITY */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              Time left for actual work
            </div>
            <div className="text-4xl font-bold font-mono text-[#103257]">
              {executionTime} <span className="text-xl font-normal">hours</span>
            </div>
            <p className="text-xs text-[#3A628F] mt-1">Out of your 40-hour week</p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 5. FOCUSED WORK */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              Focused work (deep execution time)
            </div>
            <div className="text-4xl font-bold font-mono text-[#103257]">
              {focusedWork} <span className="text-xl font-normal">hours</span>
            </div>
            <p className="text-xs text-[#3A628F] mt-1">After removing admin from execution time</p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 6. STRATEGIC WORK */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              Strategic work that gets noticed
            </div>
            <div className="text-4xl font-bold font-mono text-[#103257]">
              {strategicWork} <span className="text-xl font-normal">hours</span>
            </div>
            <p className="text-xs text-[#3A628F] mt-1">Work that gets finished, shipped, and recognized</p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 7. VISIBILITY */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              Work that gets recognized
            </div>
            <div className="text-3xl font-bold text-[#103257] capitalize">
              {visibility}
            </div>
            <p className="text-xs text-[#3A628F] mt-1">How much of your work is visible and valued</p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 8. NIGHT WORK */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              After-hours overflow
            </div>
            <div className="text-3xl font-bold font-mono text-[#103257]">
              {nightWork} <span className="text-xl font-normal">hours</span>
            </div>
            <p className="text-xs text-[#3A628F] mt-1">Work happening outside normal hours</p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 9. COST */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              Weekly cost of lost time
            </div>
            <div className="text-4xl font-bold font-mono text-[#103257]">
              ${weeklyCost.toLocaleString()}
            </div>
            <p className="text-xs text-[#3A628F] mt-1">Based on average US compensation for your role</p>
            {yearlyCost > 0 && (
              <p className="text-xs text-[#3A628F] mt-1">
                &asymp; ${yearlyCost.toLocaleString()} per year
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 10. OEI SCORE */}
          <div className="text-center py-[20px]">
            <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-2">
              OEI Score
            </div>
            <div className="flex items-center justify-center gap-3">
              <span
                className="text-5xl font-bold font-mono"
                style={{ color: getScoreColor(oeiScore) }}
              >
                {oeiScore}
              </span>
              <span className="text-lg text-[#3A628F]">—</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadgeClass(oeiScore)}`}
              >
                {getScoreLabel(oeiScore)}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 11. BREAKDOWN SECTION */}
          {breakdownCategories.length > 0 && (
            <div className="py-[20px] space-y-5">
              {breakdownCategories.map((category: BreakdownCategory) => (
                <div key={category.title}>
                  <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-3">
                    {category.title}
                  </div>
                  <div className="space-y-2">
                    {category.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#e2e8f0]"
                      >
                        <span className="text-sm text-[#103257]">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium font-mono text-[#103257]">
                            {metric.value}
                          </span>
                          <StatusIndicator status={metric.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 12. MARIA INSIGHT */}
      <div className="p-6 bg-white rounded-2xl border-2 border-[#e2e8f0]">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-[#103257] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <h4 className="font-semibold text-[#103257] mb-3">Maria&apos;s Insight</h4>
            <ul className="space-y-2 text-sm text-[#3A628F] leading-relaxed list-disc pl-4">
              <li>{insight.diagnosis}</li>
              <li>{insight.consequence}</li>
              <li className="text-[#103257] font-medium italic">{insight.emotional}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 13. CTA */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onShare}
          className="w-full bg-[#103257] hover:bg-[#1a4a7a] text-white py-3"
        >
          See how Maria fixes this
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          onClick={onShare}
          variant="outline"
          className="w-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Share your work system snapshot
        </Button>
      </div>
    </div>
  );
}
