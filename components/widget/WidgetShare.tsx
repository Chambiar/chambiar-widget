"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mail,
  Link2,
  Check,
  Copy,
  ArrowLeft,
  Loader2,
  X,
  FileText,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WidgetSession } from "@/app/page";
import type { MetricId } from "@/lib/widget/types";
import type { BreakdownCategory } from "@/lib/workSystemCalculator";

interface WidgetShareProps {
  session: WidgetSession;
  updateSession: (updates: Partial<WidgetSession>) => void;
  onBack: () => void;
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

const nextStepsConfig: Record<string, string> = {
  meetings: "Reduce or batch meetings into fewer blocks to protect execution time",
  tools: "Consolidate into fewer systems to eliminate switching overhead",
  interruptions: "Batch work and reduce real-time interruptions",
  coordination: "Centralize communication and force decisions to reduce chasing",
  night_work: "Fix daytime capacity so work fits into your day",
  admin: "Reduce admin and protect focus blocks for deep work",
  visibility: "Surface and track meaningful work centrally",
};

function ShareDropdown({ shareUrl }: { shareUrl: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShareX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=I%20just%20got%20my%20Work%20System%20Snapshot%20from%20Chambiar.%20Find%20out%20yours%3A&url=${encodeURIComponent(shareUrl || "")}`,
      "_blank"
    );
    setIsOpen(false);
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl || "")}`,
      "_blank"
    );
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg border border-[#e2e8f0] shadow-lg overflow-hidden z-50">
          <button
            onClick={handleShareX}
            className="w-full px-4 py-2.5 text-sm text-[#103257] hover:bg-[#f8fafc] flex items-center gap-2 transition-colors"
          >
            <X className="h-4 w-4" />
            Share on X
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="w-full px-4 py-2.5 text-sm text-[#103257] hover:bg-[#f8fafc] flex items-center gap-2 border-t border-[#e2e8f0] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Share on LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}

export default function WidgetShare({
  session,
  updateSession,
  onBack,
}: WidgetShareProps) {
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleGenerateLink = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setIsGenerating(true);

    // TODO: Replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockSlug = Math.random().toString(36).substring(2, 8);
    const generatedUrl = `${window.location.origin}/share/${mockSlug}`;

    updateSession({
      email,
      shareSlug: mockSlug,
    });

    setShareUrl(generatedUrl);
    setIsGenerating(false);
    setShowPreviewModal(true);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const score = session.overallScore || 0;
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

  // Determine top signals for next steps
  const signalPriority: { key: string; severity: number }[] = [];
  if (ws) {
    if (timeBreakdown.meetings >= 12) signalPriority.push({ key: "meetings", severity: timeBreakdown.meetings });
    if (ws.hours_lost - timeBreakdown.meetings >= 10) signalPriority.push({ key: "coordination", severity: ws.hours_lost - timeBreakdown.meetings });
    if (nightWork >= 4) signalPriority.push({ key: "night_work", severity: nightWork });
    if (ws.admin_ratio >= 0.55) signalPriority.push({ key: "admin", severity: ws.admin_ratio * 10 });
    if (visibility === "low" || visibility === "moderate") signalPriority.push({ key: "visibility", severity: visibility === "low" ? 8 : 5 });
  }
  signalPriority.sort((a, b) => b.severity - a.severity);
  const topSignals = signalPriority.slice(0, 3);

  const PreviewModal = () => (
    <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-[#103257]">
            Your Shareable Report
          </DialogTitle>
        </DialogHeader>

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

            {/* 2. HERO METRIC */}
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
                <div className="bg-[#103257] transition-all" style={{ width: `${meetingPct}%` }} />
                <div className="bg-[#3A628F] transition-all" style={{ width: `${coordPct}%` }} />
                <div className="bg-[#D9E7FF] transition-all" style={{ width: `${execPct}%` }} />
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
                OEI score
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

            {/* 11. BREAKDOWN */}
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

        {/* 13. Next Steps */}
        <div className="p-6 bg-white rounded-xl border-2 border-[#e2e8f0]">
          <h4 className="font-semibold text-[#103257] mb-3">Next Steps</h4>
          <div className="space-y-3">
            {topSignals.map((signal, index) => (
              <div key={signal.key} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#103257] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-[#3A628F] leading-relaxed">
                  {nextStepsConfig[signal.key]}
                </p>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#103257] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {topSignals.length + 1}
              </div>
              <p className="text-sm text-[#3A628F] leading-relaxed font-medium">
                Get Chambiar to let Maria automate your workflow and improve your score
              </p>
            </div>
            <a
              href="https://www.chambiar.ai/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-3 bg-[#103257] text-white text-sm font-semibold rounded-lg hover:bg-[#1a4a7a] transition-colors"
            >
              Sign Up for Chambiar
            </a>
          </div>
        </div>

        {/* Share Actions */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-[#f8fafc] rounded-lg font-mono text-xs text-[#103257] truncate border">
              {shareUrl}
            </div>
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="p-3 bg-[#D9E7FF]/30 rounded-lg border border-[#D9E7FF]">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#3A628F]" />
              <p className="text-xs text-[#103257]">
                Copy sent to <strong>{email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShareDropdown shareUrl={shareUrl} />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPreviewModal(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <PreviewModal />

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D9E7FF] rounded-full mb-4">
          <Link2 className="h-8 w-8 text-[#103257]" />
        </div>
        <h2 className="text-2xl font-bold text-[#103257]">
          Save & Share Your Results
        </h2>
        <p className="text-[#3A628F]">
          Enter your email to get your personalized report
        </p>
      </div>

      <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
        <h3 className="font-semibold text-[#103257] mb-3 text-sm">What you&apos;ll receive:</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>Shareable link</strong> — Compare scores with your team
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>PDF report</strong> — Detailed breakdown with next-step recommendations
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>Benchmark comparison</strong> — See how you stack up against others
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>Action plan</strong> — Top 3 priorities to improve this week
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A9C2]" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="pl-10 py-6 text-lg border-[#e2e8f0] focus:border-[#103257] focus:ring-[#103257]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={handleGenerateLink}
          disabled={isGenerating}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Your Report...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Generate My Report
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-[#94A9C2]">
        Your email is only used to save your results. We won&apos;t spam you.
      </p>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>
      </div>
    </div>
  );
}
