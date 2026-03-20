import Image from "next/image";
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
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { MetricId, WidgetMetricResult } from "@/lib/widget/types";

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

const metricConfig: Record<
  MetricId,
  {
    label: string;
    icon: typeof Clock;
    color: string;
    format: (v: number) => string;
    description: string;
    whyItMatters: string;
  }
> = {
  hoursWasted: {
    label: "Hours Wasted in Meetings",
    icon: Clock,
    color: "#ef4444",
    format: (v) => `${v.toFixed(1)} hrs`,
    description: "Time spent in meetings that could have been emails, async updates, or skipped entirely.",
    whyItMatters: "Every unnecessary meeting fragments your deep work time and reduces productivity by up to 40%.",
  },
  afterHoursMeetings: {
    label: "After-Hours Meetings",
    icon: Moon,
    color: "#8b5cf6",
    format: (v) => `${v} meetings`,
    description: "Meetings scheduled outside of standard work hours (before 9am or after 6pm).",
    whyItMatters: "After-hours work erodes work-life boundaries and leads to burnout. Recovery time is essential for sustained performance.",
  },
  emailDebt: {
    label: "Email Debt",
    icon: Inbox,
    color: "#f97316",
    format: (v) => `${v} emails`,
    description: "Unread or unreplied emails that have been sitting in your inbox for over 48 hours.",
    whyItMatters: "Email debt creates mental overhead and anxiety. Each pending email occupies cognitive space even when you&apos;re not looking at it.",
  },
  responseTime: {
    label: "Avg Response Time",
    icon: Zap,
    color: "#eab308",
    format: (v) => `${v.toFixed(1)} hrs`,
    description: "The average time it takes you to respond to emails and messages.",
    whyItMatters: "Slow response times can block colleagues and create bottlenecks. But too-fast responses may indicate reactive rather than proactive work.",
  },
  collaborationBottleneck: {
    label: "Stuck Documents",
    icon: FileText,
    color: "#14b8a6",
    format: (v) => `${v} docs`,
    description: "Shared documents awaiting your review, approval, or input for more than 3 days.",
    whyItMatters: "Stalled documents delay entire projects. Your input might be the blocker preventing others from moving forward.",
  },
  notificationOverload: {
    label: "Daily Notifications",
    icon: Bell,
    color: "#ec4899",
    format: (v) => `${v} alerts`,
    description: "Total Slack messages, mentions, and channel notifications received per day.",
    whyItMatters: "Each notification interrupts focus. It takes an average of 23 minutes to fully regain concentration after an interruption.",
  },
  zoomFatigue: {
    label: "Video Call Hours",
    icon: Video,
    color: "#2D8CFF",
    format: (v) => `${v.toFixed(1)} hrs`,
    description: "Total time spent on video calls this week.",
    whyItMatters: "Video calls are more cognitively demanding than in-person meetings. Prolonged video exposure leads to 'Zoom fatigue' and reduced effectiveness.",
  },
  expenseBlindSpots: {
    label: "Expense Blind Spots",
    icon: DollarSign,
    color: "#10b981",
    format: (v) => `$${v.toLocaleString()}`,
    description: "Recurring subscriptions and expenses that may be unused or underutilized.",
    whyItMatters: "Hidden costs add up. Regular expense audits can save 10-20% of operational costs.",
  },
  workStructure: {
    label: "Work Structure",
    icon: LayoutGrid,
    color: "#3A628F",
    format: (v) => v >= 7 ? "Coordination-heavy" : v >= 4 ? "Mixed" : "Independent",
    description: "How your time is split between independent work and meetings/coordination.",
    whyItMatters: "When most of your time is spent coordinating, execution suffers. The best teams protect maker time.",
  },
};

function getScoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

const benchmarks: Record<MetricId, { average: number; percentile: (v: number) => number }> = {
  hoursWasted: { average: 8.5, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 20) * 100)) },
  afterHoursMeetings: { average: 3, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 10) * 100)) },
  emailDebt: { average: 85, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 300) * 100)) },
  responseTime: { average: 4.2, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 12) * 100)) },
  collaborationBottleneck: { average: 4, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 15) * 100)) },
  notificationOverload: { average: 250, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 600) * 100)) },
  zoomFatigue: { average: 6.5, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 15) * 100)) },
  expenseBlindSpots: { average: 1200, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 5000) * 100)) },
  workStructure: { average: 5, percentile: (v) => Math.max(0, Math.min(100, 100 - (v / 10) * 100)) },
};

const recommendations: Record<MetricId, { bad: string; warning: string; good: string }> = {
  hoursWasted: { bad: "Try the 'No Meeting Wednesday' experiment. Block 2 days/week for deep work and require agendas for all meetings.", warning: "You&apos;re close to healthy. Review recurring meetings monthly—cancel any that lack clear outcomes.", good: "Great meeting hygiene! Consider sharing your approach with your team." },
  afterHoursMeetings: { bad: "Set 'working hours' in your calendar and auto-decline outside requests. Your boundaries teach others how to treat you.", warning: "A few after-hours meetings is normal. Consider moving recurring ones to core hours.", good: "Excellent work-life boundaries. This protects your long-term productivity." },
  emailDebt: { bad: "Try the 'Two-Minute Rule': if it takes less than 2 minutes, do it now. Batch email processing to 3x daily.", warning: "Schedule 30 minutes daily for email processing. Unsubscribe aggressively from newsletters.", good: "You&apos;re staying on top of communications. Well done!" },
  responseTime: { bad: "Slow responses block others. Set expectations: 'I check email at 9am, 1pm, and 5pm' in your signature.", warning: "Your response time is acceptable but could improve during collaborative projects.", good: "Fast but not reactive—the ideal balance." },
  collaborationBottleneck: { bad: "You may be a bottleneck. Delegate review authority or set 'review hours' to batch approvals.", warning: "A few pending docs is normal. Try setting a 48-hour review SLA with yourself.", good: "You&apos;re enabling your team to move fast. Keep it up!" },
  notificationOverload: { bad: "Turn off all non-essential Slack notifications. Check channels at scheduled times, not in real-time.", warning: "Consider leaving low-value channels. Use 'Do Not Disturb' during focus time.", good: "You've mastered notification management. Share your settings with overwhelmed colleagues." },
  zoomFatigue: { bad: "Request camera-off for some calls. Take 5-minute breaks between meetings. Suggest async updates for status meetings.", warning: "You&apos;re in a lot of video calls. Try walking meetings or audio-only for internal syncs.", good: "Sustainable video call load. You&apos;re protecting your cognitive energy." },
  expenseBlindSpots: { bad: "Audit all subscriptions this week. Cancel unused tools. Consolidate overlapping services.", warning: "Some optimization possible. Review annual renewals before they auto-charge.", good: "Lean operations. You&apos;re running efficiently." },
  workStructure: { bad: "Your time is dominated by coordination. Restructure your week to protect at least 2 blocks of uninterrupted focus time.", warning: "A mixed schedule is common but watch for coordination creep. Guard your focus blocks.", good: "Your time structure supports deep work. Keep protecting your independent work blocks." },
};

// TODO: Replace with real data fetching from database
async function getSharedInsight(slug: string) {
  const mockMetrics: WidgetMetricResult[] = [
    { id: "hoursWasted", value: 12.5, trend: "up", status: "bad" },
    { id: "afterHoursMeetings", value: 6, trend: "up", status: "bad" },
    { id: "emailDebt", value: 147, trend: "up", status: "bad" },
    { id: "responseTime", value: 6.3, trend: "neutral", status: "warning" },
    { id: "notificationOverload", value: 427, trend: "up", status: "bad" },
    { id: "zoomFatigue", value: 9.2, trend: "up", status: "warning" },
  ];

  return {
    id: slug,
    createdAt: new Date().toISOString(),
    overallScore: 32,
    metrics: mockMetrics,
    mariaSummary:
      "This person's work patterns show significant room for improvement. They spent 12.5 hours in meetings that could have been emails, and received over 400 Slack messages in a single day. Setting boundaries around notifications and declining unnecessary meetings could dramatically improve their work health.",
  };
}

export default async function SharedInsightPage({ params }: SharePageProps) {
  const { slug } = await params;
  const insight = await getSharedInsight(slug);

  if (!insight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#103257]">Insight Not Found</h1>
          <p className="text-[#3A628F]">This link may have expired or doesn&apos;t exist.</p>
          <Link href="/">
            <Button variant="outline">Create Your Own</Button>
          </Link>
        </div>
      </div>
    );
  }

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-[#94A9C2]" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      good: "bg-green-100 text-green-700 border-green-200",
      warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
      bad: "bg-red-100 text-red-700 border-red-200",
    };
    const labels: Record<string, string> = { good: "Healthy", warning: "Needs Attention", bad: "Critical" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      <header className="border-b border-[#e2e8f0] bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-3xl">
          <Link href="/" className="flex items-center">
            <Image src="/Chambiar Logo.svg" alt="Chambiar" width={100} height={30} style={{ height: "auto" }} className="object-contain" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#3A628F]">
            <Clock className="h-4 w-4" />
            Work Health Report
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#103257] mb-2">Work Health Check Results</h1>
          <p className="text-[#3A628F]">A snapshot of work patterns and productivity metrics</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center md:text-left flex-1">
              <div className="text-sm text-[#3A628F] mb-1">Overall Work Health Score</div>
              <div className="text-7xl font-bold" style={{ color: getScoreColor(insight.overallScore) }}>{insight.overallScore}</div>
              <div className="text-xl font-medium" style={{ color: getScoreColor(insight.overallScore) }}>{getScoreLabel(insight.overallScore)}</div>
            </div>
            <div className="flex-1 text-sm text-[#3A628F] bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
              <p className="mb-2"><strong className="text-[#103257]">What is this score?</strong></p>
              <p>The Work Health Score (0-100) measures the balance between productivity and sustainable work habits. It accounts for meeting load, communication patterns, and work-life boundaries.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#103257] rounded-xl shrink-0">
              <span className="text-white text-lg font-bold">M</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-[#103257]">Maria&apos;s Analysis</h2>
                <span className="text-xs px-2 py-0.5 bg-[#D9E7FF] text-[#103257] rounded-full">AI-Powered</span>
              </div>
              <p className="text-[#3A628F] leading-relaxed">{insight.mariaSummary}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#103257] mb-4">Detailed Breakdown</h2>
          <div className="space-y-4">
            {insight.metrics.map((metric) => {
              const config = metricConfig[metric.id];
              const benchmark = benchmarks[metric.id];
              const recommendation = recommendations[metric.id];
              const Icon = config.icon;
              const percentile = Math.round(benchmark.percentile(metric.value));
              const vsAverage = metric.value - benchmark.average;
              const vsAveragePercent = Math.round((vsAverage / benchmark.average) * 100);

              return (
                <div key={metric.id} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: `${config.color}15` }}>
                      <Icon className="h-6 w-6" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-[#103257]">{config.label}</h3>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={metric.status} />
                          <TrendIcon trend={metric.trend} />
                        </div>
                      </div>

                      <div className="flex items-end gap-4 mb-3">
                        <div className="text-3xl font-bold text-[#103257]">{config.format(metric.value)}</div>
                        <div className="text-sm text-[#94A9C2] pb-1">
                          {vsAverage > 0 ? (
                            <span className="text-red-500">+{vsAveragePercent}% vs avg</span>
                          ) : vsAverage < 0 ? (
                            <span className="text-green-500">{vsAveragePercent}% vs avg</span>
                          ) : (
                            <span>at average</span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-[#94A9C2] mb-1">
                          <span>Compared to others</span>
                          <span className="font-medium text-[#103257]">Better than {percentile}%</span>
                        </div>
                        <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentile}%`,
                              backgroundColor: percentile >= 70 ? "#10b981" : percentile >= 40 ? "#eab308" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-[#3A628F] mb-3">{config.description}</p>

                      <div className="p-3 rounded-lg border" style={{
                        backgroundColor: metric.status === "bad" ? "#fef2f2" : metric.status === "warning" ? "#fefce8" : "#f0fdf4",
                        borderColor: metric.status === "bad" ? "#fecaca" : metric.status === "warning" ? "#fef08a" : "#bbf7d0",
                      }}>
                        <div className="flex items-start gap-2">
                          <span className="text-sm">💡</span>
                          <div>
                            <div className="text-xs font-semibold text-[#103257] mb-0.5">
                              {metric.status === "bad" ? "Action Required" : metric.status === "warning" ? "Suggestion" : "Keep It Up"}
                            </div>
                            <p className="text-xs text-[#3A628F]">
                              {recommendation[metric.status as keyof typeof recommendation] || recommendation.warning}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-[#103257] mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Top 3 Actions This Week
          </h2>
          <div className="space-y-3">
            {insight.metrics
              .filter((m) => m.status === "bad")
              .slice(0, 3)
              .map((metric, index) => {
                const config = metricConfig[metric.id];
                const recommendation = recommendations[metric.id];
                return (
                  <div key={metric.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#103257] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-[#103257]">{config.label}</div>
                      <p className="text-sm text-[#3A628F]">{recommendation.bad}</p>
                    </div>
                  </div>
                );
              })}
            {insight.metrics.filter((m) => m.status === "bad").length === 0 && (
              <p className="text-[#3A628F]">No critical issues found! Focus on maintaining your healthy habits.</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#103257] to-[#1e4d7b] rounded-2xl p-8 text-center text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">
            What&apos;s <em>your</em> work health score?
          </h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Connect your calendar and work tools to get a personalized analysis
            of your work patterns—free and anonymous.
          </p>
          <Link href="/">
            <Button size="lg" variant="outline" className="bg-white text-[#103257] border-white hover:bg-white/90">
              Run This For Your Own Work
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-white/60 mt-4">
            30 seconds • No account required • Your data stays private
          </p>
        </div>

        <footer className="pt-6 border-t border-[#e2e8f0] text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image src="/Chambiar Logo.svg" alt="Chambiar" width={80} height={24} style={{ height: "auto" }} className="object-contain opacity-60" />
          </div>
          <p className="text-xs text-[#94A9C2]">
            Work Engine Widget • Helping teams work smarter
          </p>
        </footer>
      </div>
    </div>
  );
}