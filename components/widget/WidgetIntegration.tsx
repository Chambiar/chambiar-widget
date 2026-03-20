"use client";

import { useState } from "react";
import {
  Calendar,
  MessageSquare,
  Check,
  Loader2,
  ArrowLeft,
  Inbox,
  FileText,
  Table,
  Video,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetSession } from "@/app/page";
import type { IntegrationId } from "@/lib/widget/types";

interface WidgetIntegrationProps {
  session: WidgetSession;
  updateSession: (updates: Partial<WidgetSession>) => void;
  onComplete: () => void;
  onBack: () => void;
}

const iconMap = {
  Calendar,
  Inbox,
  FileText,
  Table,
  MessageSquare,
  Video,
  DollarSign,
};

const integrations = [
  {
    id: "googleCalendar" as IntegrationId,
    name: "Google Calendar",
    icon: "Calendar",
    description: "Hours wasted, after-hours meetings",
    color: "#4285F4",
    metrics: ["Hours Wasted", "After-Hours Meetings"],
  },
  {
    id: "gmail" as IntegrationId,
    name: "Gmail",
    icon: "Inbox",
    description: "Email debt & response time",
    color: "#EA4335",
    metrics: ["Email Debt", "Response Time"],
  },
  {
    id: "googleDocs" as IntegrationId,
    name: "Google Docs",
    icon: "FileText",
    description: "Document collaboration analysis",
    color: "#4285F4",
    metrics: ["Collaboration Bottleneck"],
  },
  {
    id: "googleSheets" as IntegrationId,
    name: "Google Sheets",
    icon: "Table",
    description: "Spreadsheet collaboration analysis",
    color: "#0F9D58",
    metrics: ["Collaboration Bottleneck"],
  },
  {
    id: "slack" as IntegrationId,
    name: "Slack",
    icon: "MessageSquare",
    description: "Notification overload analysis",
    color: "#E8912D",
    metrics: ["Notification Overload"],
  },
  {
    id: "zoom" as IntegrationId,
    name: "Zoom",
    icon: "Video",
    description: "Video call fatigue tracking",
    color: "#2D8CFF",
    metrics: ["Zoom Fatigue Score"],
  },
  {
    id: "xero" as IntegrationId,
    name: "Xero",
    icon: "DollarSign",
    description: "Expense blind spots",
    color: "#13B5EA",
    metrics: ["Expense Blind Spots"],
  },
];

export default function WidgetIntegration({
  session,
  updateSession,
  onComplete,
  onBack,
}: WidgetIntegrationProps) {
  const [connecting, setConnecting] = useState<IntegrationId | null>(null);

  const handleConnect = async (integrationId: IntegrationId) => {
    setConnecting(integrationId);

    // TODO: Replace with real OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500));

    updateSession({
      integrations: {
        ...session.integrations,
        [integrationId]: true,
      },
    });
    setConnecting(null);
  };

  const connectedCount = Object.values(session.integrations).filter(Boolean).length;
  const hasAnyIntegration = connectedCount > 0;

  const availableMetrics = new Set<string>();
  integrations.forEach((integration) => {
    if (session.integrations[integration.id]) {
      integration.metrics.forEach((m) => availableMetrics.add(m));
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#103257]">
          Connect Your Apps
        </h2>
        <p className="text-[#3A628F]">
          The more you connect, the more insights you&apos;ll get.
        </p>
      </div>

      {/* Connected metrics preview */}
      {hasAnyIntegration && (
        <div className="p-3 bg-[#D9E7FF]/30 rounded-xl border border-[#D9E7FF]">
          <div className="text-xs text-[#3A628F] mb-2">Metrics unlocked:</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(availableMetrics).map((metric) => (
              <span
                key={metric}
                className="px-2 py-1 bg-white text-[#103257] text-xs rounded-full border border-[#e2e8f0]"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Integration options */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.icon as keyof typeof iconMap];
          const isConnected = session.integrations[integration.id];
          const isConnecting = connecting === integration.id;

          return (
            <div
              key={integration.id}
              className={`p-3 bg-white rounded-xl border-2 transition-all ${
                isConnected
                  ? "border-[#def4c4] bg-[#def4c4]/10"
                  : "border-[#e2e8f0] hover:border-[#94A9C2]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${integration.color}15` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: integration.color }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#103257] text-sm">
                      {integration.name}
                    </h3>
                    <p className="text-xs text-[#3A628F] truncate">
                      {integration.description}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-1.5 shrink-0" style={{ color: "#0F9D58" }}>
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    disabled={isConnecting || connecting !== null}
                    variant="outline"
                    size="sm"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onComplete}
          disabled={!hasAnyIntegration}
          variant="outline"
        >
          Analyze ({connectedCount} app{connectedCount !== 1 ? "s" : ""})
        </Button>
      </div>

      {!hasAnyIntegration && (
        <p className="text-center text-sm text-[#94A9C2]">
          Connect at least one app to continue
        </p>
      )}
    </div>
  );
}