"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mail,
  LockOpen,
  Check,
  Copy,
  ArrowLeft,
  Loader2,
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



function getInsightText(key: string, ws: { meeting_hours: number; coordination_loss: number; interrupt_loss: number; system_loss: number; night_work: number; admin_ratio: number; visibility_score: number }): string {
  const tools = ws.system_loss > 0 ? Math.round(ws.system_loss / 0.8) : 4;
  switch (key) {
    case "meetings":
      return `Meetings are consuming ~${ws.meeting_hours} hours of your week, leaving limited time for execution. Consolidating them into fewer blocks would immediately free up usable time.`;
    case "coordination":
      return `You are losing ~${ws.coordination_loss} hours to follow-ups and waiting on others. This is slowing execution more than workload itself — centralizing ownership removes that delay.`;
    case "interruptions":
      return "Frequent interruptions are breaking your work into short fragments. Even when time is available, it is not usable — batching work restores real focus time.";
    case "tools":
      return `Working across ~${tools} tools is creating constant switching overhead. Each switch resets context and reduces output — consolidating systems reduces hidden time loss.`;
    case "night_work":
      return `You are working ~${ws.night_work} hours outside normal time to complete work. This indicates your day cannot support execution — fixing daytime capacity removes after-hours work.`;
    case "admin":
      return "A large portion of your time is going to admin rather than execution. This reduces how much real work can be completed — shifting this load frees up focused work time.";
    case "visibility":
      return "Much of your work is not being seen or recognized. This means effort is not translating into impact — making work visible increases its value and effect.";
    default:
      return "";
  }
}

function ShareDropdown({ shareUrl }: { shareUrl: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    setIsOpen(false);
  };

  const handleDownloadPDF = () => {
    window.print();
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
        {linkCopied ? "Link Copied!" : "Share"}
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg border border-[#e2e8f0] shadow-lg overflow-hidden z-50">
          <button
            onClick={handleDownloadPDF}
            className="w-full px-4 py-2.5 text-sm text-[#103257] hover:bg-[#f8fafc] flex items-center gap-2 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Download as PDF
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2.5 text-sm text-[#103257] hover:bg-[#f8fafc] flex items-center gap-2 border-t border-[#e2e8f0] transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy Link
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
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleGenerateLink = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setIsGenerating(true);

    // Send data to Google Sheets
    const ws = session.workSystem;
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbwtXkMKUbPqGJMhCqnEnz1RAMZMEVz-8lLG-wkIevfHyGNtMNyghKT55adb_kn8GLj3/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            companyType: session.companyType ?? "",
            assessmentScope: session.assessmentScope ?? "",
            teamSize: session.teamSize ?? "",
            role: ws ? ({ 90: "Executive/Founder", 70: "Manager/Team Lead", 75: "Product/Engineering", 65: "Sales/Marketing", 55: "IC", 40: "Operations/Admin", 85: "Consultant" }[ws.hourly_rate] ?? "Other") : "",
            tools: ws?.system_loss ? Math.round(ws.system_loss / 0.8) : "",
            meetingHours: ws?.meeting_hours ?? "",
            interruptions: ws?.interrupt_loss ?? "",
            coordination: ws?.coordination_loss ?? "",
            nightWork: ws?.night_work ?? "",
            adminRatio: ws?.admin_ratio ?? "",
            visibility: ws?.visibility ?? "",
            hoursLost: ws?.hours_lost ?? "",
            executionTime: ws?.execution_time ?? "",
            focusedWork: ws?.focused_work ?? "",
            strategicWork: ws?.strategic_work ?? "",
            weeklyCost: ws?.estimated_cost ?? "",
            yearlyCost: (ws?.estimated_cost ?? 0) * 52,
            oeiScore: ws?.oei_score ?? "",
            visibilityLevel: ws?.visibility ?? "",
          }),
        }
      );
    } catch {
      // Silently fail — don't block the user experience
    }

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


  const heroInterpretation = getHeroInterpretation(oeiScore);

  const totalBarHours = timeBreakdown.meetings + timeBreakdown.coordination + timeBreakdown.execution;
  const meetingPct = totalBarHours > 0 ? (timeBreakdown.meetings / totalBarHours) * 100 : 0;
  const coordPct = totalBarHours > 0 ? (timeBreakdown.coordination / totalBarHours) * 100 : 0;
  const execPct = totalBarHours > 0 ? (timeBreakdown.execution / totalBarHours) * 100 : 0;

  // Determine top signals for next steps
  const signalPriority: { key: string; severity: number }[] = ws ? [
    { key: "meetings", severity: ws.meeting_hours },
    { key: "coordination", severity: ws.coordination_loss },
    { key: "interruptions", severity: ws.interrupt_loss },
    { key: "tools", severity: ws.system_loss },
    { key: "night_work", severity: ws.night_work },
    { key: "admin", severity: ws.admin_ratio * 10 },
    { key: "visibility", severity: (1 - ws.visibility_score) * 10 },
  ] : [];
  signalPriority.sort((a, b) => b.severity - a.severity);
  const topSignals = signalPriority.slice(0, 3);

  const PreviewModal = () => (
    <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Your Full Work Receipt</DialogTitle>
        </DialogHeader>

        <div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">

            {/* 1. HEADER + HERO INTERPRETATION — receipt printout style */}
            <div className="py-[20px] text-center font-mono">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#3A628F] mb-2">
                Chambiar · Work Receipt
              </p>
              <p className="text-[10px] text-[#94A9C2] mb-5">
                {new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
              <h1 className="text-2xl font-bold uppercase tracking-[0.18em] text-[#103257] mb-1">
                Your Full Work Receipt
              </h1>
              <p className="text-sm text-[#103257] font-medium mt-4">
                {heroInterpretation}
              </p>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            {/* 2. HERO METRIC */}
            <div className="py-[20px]">
              <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
                Coordination time lost this week
              </div>
              <div className="text-3xl font-bold font-mono text-[#103257]">
                {hoursLost} <span className="text-lg font-normal">hours</span>
              </div>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            {/* 3. WORK WEEK BREAKDOWN */}
            <div className="py-[20px]">
              <div className="text-xs text-[#3A628F] uppercase tracking-wider mb-3">
                Where your week is going
              </div>
              <div className="flex h-5 rounded-lg overflow-hidden border border-[#e2e8f0]">
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
            <div className="py-[20px]">
              <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
                Time left for actual work
              </div>
              <div className="text-3xl font-bold font-mono text-[#103257]">
                {executionTime} <span className="text-lg font-normal">hours</span>
              </div>
              <p className="text-xs text-[#3A628F] mt-1">Out of your 40-hour week</p>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            {/* 5. FOCUSED WORK */}
            <div className="py-[20px]">
              <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
                Focused work (deep execution time)
              </div>
              <div className="text-3xl font-bold font-mono text-[#103257]">
                {focusedWork} <span className="text-lg font-normal">hours</span>
              </div>
              <p className="text-xs text-[#3A628F] mt-1">After removing admin from execution time</p>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            {/* 6. STRATEGIC WORK + VISIBILITY */}
            <div className="py-[20px]">
              <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
                Strategic work that gets noticed
              </div>
              <div className="text-3xl font-bold font-mono text-[#103257]">
                {strategicWork} <span className="text-lg font-normal">hours</span>
              </div>
              <p className="text-xs text-[#3A628F] mt-1">
                Visibility: <span className="capitalize font-medium">{visibility}</span> — how much of your work is seen and valued
              </p>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            {/* 8. NIGHT WORK */}
            <div className="py-[20px]">
              <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
                After-hours overflow
              </div>
              <div className="text-3xl font-bold font-mono text-[#103257]">
                {nightWork} <span className="text-lg font-normal">hours</span>
              </div>
              <p className="text-xs text-[#3A628F] mt-1">Work happening outside normal hours</p>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            {/* 9. COST — team only — receipt TOTAL block */}
            {session.assessmentScope === "team" && (
              <>
                <div className="py-[24px] font-mono">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[#3A628F]">
                      Weekly cost of lost time
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-[#103257]">
                      ${weeklyCost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#3A628F] mt-3">
                    Based on average US compensation for your role
                  </p>
                  {yearlyCost > 0 && (
                    <p className="text-[11px] text-[#3A628F] mt-1">
                      &asymp; ${yearlyCost.toLocaleString()} per year
                    </p>
                  )}
                </div>

                {/* Double dashed divider — closes the total receipt-style */}
                <div className="border-t border-dashed border-[#e2e8f0]" />
                <div className="border-t border-dashed border-[#e2e8f0] mt-[3px]" />
              </>
            )}

            {/* 10. OEI SCORE */}
            <div className="py-[20px]">
              <div className="text-sm text-[#3A628F] uppercase tracking-wider mb-2">
                OEI score
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-3xl font-bold font-mono"
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
              <p className="text-xs text-[#3A628F] mt-1">How efficiently your work system converts effort into output</p>
            </div>

            <div className="border-t border-dashed border-[#e2e8f0]" />

            <p className="text-xs text-[#94A9C2] text-center italic py-[20px]">
              Derived from real-world work patterns and coordination data
            </p>

          </div>
        </div>


        {/* 13. Next Steps */}
        <div className="p-6 bg-white rounded-xl border-2 border-[#e2e8f0]">
          <h4 className="font-semibold text-[#103257] mb-3">Maria&apos;s Insights</h4>
          <div className="space-y-3">
            {ws && topSignals.map((signal, index) => (
              <div key={signal.key} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#103257] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-[#3A628F] leading-relaxed">
                  {getInsightText(signal.key, ws)}
                </p>
              </div>
            ))}
            <p className="text-sm text-[#103257] font-medium mt-4 italic">
              Fix this with Maria — connect your tools and reclaim your time.
            </p>
            <a
              href="https://www.chambiar.ai/betasignup"
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
          <LockOpen className="h-8 w-8 text-[#103257]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#103257]">
          Unlock Your Full Work Breakdown
        </h2>
        <p className="text-[#3A628F]">
          Enter your email to see Maria&apos;s deeper analysis
        </p>
      </div>

      <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
        <h3 className="font-semibold text-[#103257] mb-3 text-sm">Your full report includes:</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>Execution capacity</strong> — How much time is left for real work
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>Focused & strategic work</strong> — Deep execution time and what gets noticed
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>Cost analysis</strong> — What your lost time is costing weekly and yearly
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span className="text-sm text-[#3A628F]">
              <strong>OEI Score + Maria&apos;s Insight</strong> — Your efficiency rating and what it means
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-[18px] h-5 w-5 text-[#94A9C2]" />
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
          <p className="text-xs text-[#94A9C2] mt-1 text-center">Your email is only used to save your results. We won&apos;t spam you.</p>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://www.chambiar.ai/betasignup"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center px-4 py-3 bg-[#103257] text-white text-sm font-semibold rounded-lg hover:bg-[#1a4a7a] transition-colors"
          >
            Sign Up for Chambiar
          </a>
          <button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-white text-[#103257] text-sm font-semibold rounded-lg border-2 border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                View Full Receipt
              </>
            )}
          </button>
        </div>
      </div>

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
