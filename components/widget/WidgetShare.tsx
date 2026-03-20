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
  Clock,
  Moon,
  Inbox,
  Zap,
  FileText,
  Bell,
  Video,
  DollarSign,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Minus,
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

interface WidgetShareProps {
  session: WidgetSession;
  updateSession: (updates: Partial<WidgetSession>) => void;
  onBack: () => void;
}

const metricConfig: Record<
  MetricId,
  {
    label: string;
    icon: typeof Clock;
    color: string;
    format: (v: number) => string;
  }
> = {
  hoursWasted: {
    label: "Hours Wasted",
    icon: Clock,
    color: "#ef4444",
    format: (v) => `${v.toFixed(1)} hrs`,
  },
  afterHoursMeetings: {
    label: "After-Hours",
    icon: Moon,
    color: "#8b5cf6",
    format: (v) => `${v}`,
  },
  emailDebt: {
    label: "Email Debt",
    icon: Inbox,
    color: "#f97316",
    format: (v) => `${v}`,
  },
  responseTime: {
    label: "Response Time",
    icon: Zap,
    color: "#eab308",
    format: (v) => `${v.toFixed(1)} hrs`,
  },
  collaborationBottleneck: {
    label: "Stuck Docs",
    icon: FileText,
    color: "#14b8a6",
    format: (v) => `${v}`,
  },
  notificationOverload: {
    label: "Notifications",
    icon: Bell,
    color: "#ec4899",
    format: (v) => `${v}`,
  },
  zoomFatigue: {
    label: "Zoom Fatigue",
    icon: Video,
    color: "#2D8CFF",
    format: (v) => `${v.toFixed(1)} hrs`,
  },
  expenseBlindSpots: {
    label: "Blind Spots",
    icon: DollarSign,
    color: "#10b981",
    format: (v) => `$${v.toLocaleString()}`,
  },
  workStructure: {
    label: "Work Structure",
    icon: LayoutGrid,
    color: "#3A628F",
    format: (v) => v >= 7 ? "Coordination-heavy" : v >= 4 ? "Mixed" : "Independent",
  },
};

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

function ShareDropdown({ metrics, shareUrl }: { metrics: { id: MetricId; value: number; status: string }[]; shareUrl: string | null }) {
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
    const hoursWasted = metrics.find(m => m.id === "hoursWasted")?.value?.toFixed(1) || "X";
    window.open(
      `https://twitter.com/intent/tweet?text=I%20wasted%20${hoursWasted}%20hours%20in%20unnecessary%20meetings%20this%20week!%20Find%20out%20yours%3A&url=${encodeURIComponent(shareUrl || "")}`,
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

const nextStepsConfig: Record<MetricId, string> = {
  hoursWasted: "Block 2 days/week for deep work and require agendas for all meetings",
  afterHoursMeetings: "Set 'working hours' in your calendar and auto-decline outside requests",
  emailDebt: "Batch email processing to 3x daily using the 'Two-Minute Rule'",
  responseTime: "Set expectations in your signature: 'I check email at 9am, 1pm, and 5pm'",
  collaborationBottleneck: "Set 'review hours' to batch approvals and unblock others",
  notificationOverload: "Turn off non-essential notifications and check messages at scheduled times",
  zoomFatigue: "Request camera-off for some calls and take 5-minute breaks between meetings",
  expenseBlindSpots: "Audit all subscriptions this week and cancel unused tools",
  workStructure: "Restructure your week to protect at least 2 blocks of uninterrupted focus time",
};

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
  const metrics = session.metrics || [];

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === "up") return <TrendingUp className="h-2.5 w-2.5 text-red-500" />;
    if (trend === "down") return <TrendingDown className="h-2.5 w-2.5 text-green-500" />;
    return <Minus className="h-2.5 w-2.5 text-[#94A9C2]" />;
  };

  const StatusDot = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      good: "bg-emerald-400/50 border-emerald-400",
      warning: "bg-yellow-400/50 border-yellow-400",
      bad: "bg-rose-400/50 border-rose-400",
    };
    return <div className={`w-2.5 h-2.5 rounded-full border ${colors[status] || "bg-gray-300 border-gray-300"}`} />;
  };

  const PreviewModal = () => (
    <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-[#103257]">
            Your Shareable Report
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-lg overflow-hidden">
          <div className="bg-white p-4 text-center">
            <div className="text-2xl font-bold uppercase tracking-widest text-[#103257] mb-1">Work System Snapshot</div>
            <div className="text-base text-[#94A9C2] mt-[10px]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <p className="text-sm text-[#3A628F] max-w-md mx-auto my-[20px]">{getScoreSubline(score)}</p>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {metrics.map((metric) => {
                const config = metricConfig[metric.id];
                const Icon = config.icon;
                const isHero = metric.id === "hoursWasted";

                const statusStyles: Record<string, string> = {
                  good: "bg-emerald-50/60 border-emerald-200 text-emerald-700",
                  warning: "bg-yellow-50/60 border-yellow-200 text-yellow-600",
                  bad: "bg-rose-50/60 border-rose-200 text-rose-700",
                };
                const statusClass = statusStyles[metric.status] || "bg-[#f8fafc] border-[#e2e8f0] text-[#103257]";

                if (isHero) {
                  return (
                    <div
                      key={metric.id}
                      className={`flex items-center justify-between p-5 rounded-xl border-2 ${statusClass}`}
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
                    className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-[#e2e8f0]"
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

            <div className="border-t border-[#e2e8f0] my-5" />

            <div className="text-center">
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

        {/* Next Steps */}
        <div className="p-6 bg-white rounded-xl border-2 border-[#e2e8f0]">
          <h4 className="font-semibold text-[#103257] mb-3">Next Steps</h4>
          <div className="space-y-3">
            {metrics
              .filter(m => m.status === "bad" || m.status === "warning")
              .slice(0, 3)
              .map((metric, index) => (
                <div key={metric.id} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#103257] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-[#3A628F] leading-relaxed">
                    {nextStepsConfig[metric.id]}
                  </p>
                </div>
              ))}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#103257] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {Math.min(metrics.filter(m => m.status === "bad" || m.status === "warning").length, 3) + 1}
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

        {/* Maria&apos;s Insight */}
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
            <ShareDropdown metrics={metrics} shareUrl={shareUrl} />
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