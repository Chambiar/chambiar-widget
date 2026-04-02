"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetSession } from "@/app/page";
import type { WidgetMetricResult } from "@/lib/widget/types";


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


function getHeroInterpretation(score: number): string {
  if (score >= 71) return "Your work system is mostly efficient, with some time lost to coordination overhead.";
  if (score >= 51) return "A significant portion of your week is going to coordination rather than execution.";
  if (score >= 31) return "Most of your week is being spent managing work, not completing it.";
  return "Your week is dominated by coordination. Very little time remains for focused work.";
}



export default function WidgetResults({
  session,
  onShare,
  onBack,
  updateSession,
}: WidgetResultsProps) {
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
  const timeBreakdown = ws?.time_breakdown ?? { meetings: 0, coordination: 0, execution: 40 };
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
              Your Work Breakdown
            </h1>
            <p className="text-sm text-[#103257] font-medium mt-4">
              {heroInterpretation}
            </p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 2. HERO METRIC — Time lost to coordination */}
          <div className="text-center py-[20px]">
            <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
              Coordination time lost this week
            </div>
            <div className="text-3xl font-bold font-mono text-[#103257]">
              {hoursLost} <span className="text-lg font-normal">hours</span>
            </div>
            <p className="text-xs text-[#3A628F] mt-2">Meetings, interruptions, and switching between tools</p>
          </div>

          <div className="border-t border-dashed border-[#e2e8f0]" />

          {/* 3. WORK WEEK BREAKDOWN */}
          <div className="py-[20px]">
            <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-3 text-center">
              Where your week is going
            </div>
            <div className="flex h-5 rounded-lg overflow-hidden border border-[#e2e8f0]">
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
            <p className="text-xs text-[#3A628F] mt-3 text-center">Only {timeBreakdown.execution} hours left for execution this week</p>
          </div>

        </div>
      </div>

      {/* CTA */}
      <p className="text-sm text-[#3A628F] text-center font-medium">
        See Maria&apos;s Insights & Deeper Outcomes Next
      </p>
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onShare}
          className="w-full bg-[#103257] hover:bg-[#1a4a7a] text-white py-3"
        >
          View Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}
