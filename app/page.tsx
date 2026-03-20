"use client";

import { useState } from "react";
import WidgetLanding from "@/components/widget/WidgetLanding";
import WidgetChoice from "@/components/widget/WidgetChoice";
import WidgetFormDiagnostic from "@/components/widget/WidgetFormDiagnostic";
import WidgetIntegration from "@/components/widget/WidgetIntegration";
import WidgetResults from "@/components/widget/WidgetResults";
import WidgetShare from "@/components/widget/WidgetShare";
import type { IntegrationId, WidgetMetricResult } from "@/lib/widget/types";
import type { WorkSystemResult } from "@/lib/workSystemCalculator";

export type WidgetStep = "landing" | "choice" | "form" | "integrate" | "results" | "share";

export type CompanyType = "smb" | "consultant" | "enterprise";
export type AssessmentScope = "individual" | "team";

export interface WidgetSession {
  id: string;
  integrations: Partial<Record<IntegrationId, boolean>>;
  metrics?: WidgetMetricResult[];
  overallScore?: number;
  workSystem?: WorkSystemResult;
  email?: string;
  shareSlug?: string;
  dataSource?: "form" | "apps";
  companyType?: CompanyType;
  assessmentScope?: AssessmentScope;
  teamSize?: number;
}

export default function WidgetPage() {
  const [step, setStep] = useState<WidgetStep>("landing");
  const [session, setSession] = useState<WidgetSession>({
    id: crypto.randomUUID(),
    integrations: {},
  });

  const updateSession = (updates: Partial<WidgetSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
  };

  const getProgressSteps = () => {
    return ["landing", "form", "results", "share"];
  };

  const progressSteps = getProgressSteps();

  const handleFormComplete = (metrics: WidgetMetricResult[], score: number, workSystem?: WorkSystemResult) => {
    updateSession({
      metrics,
      overallScore: workSystem?.oei_score ?? score,
      workSystem,
      dataSource: "form",
    });
    setStep("results");
  };

  const handleAppsComplete = () => {
    updateSession({ dataSource: "apps" });
    setStep("results");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {progressSteps.map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step === s
                  ? "w-8 bg-[#103257]"
                  : i < progressSteps.indexOf(step)
                  ? "w-2 bg-[#3A628F]"
                  : "w-2 bg-[#94A9C2]"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {step === "landing" && (
          <WidgetLanding
            onStart={(companyType, assessmentScope, teamSize) => {
              updateSession({ companyType, assessmentScope, teamSize });
              setStep("form");
            }}
          />
        )}

        {step === "choice" && (
          <WidgetChoice
            onChooseForm={() => setStep("form")}
            onChooseApps={() => setStep("integrate")}
            onBack={() => setStep("landing")}
          />
        )}

        {step === "form" && (
          <WidgetFormDiagnostic
            onComplete={handleFormComplete}
            onBack={() => setStep("landing")}
            onSwitchToApps={() => {}}
          />
        )}

        {step === "integrate" && (
          <WidgetIntegration
            session={session}
            updateSession={updateSession}
            onComplete={handleAppsComplete}
            onBack={() => setStep("landing")}
          />
        )}

        {step === "results" && (
          <WidgetResults
            session={session}
            updateSession={updateSession}
            onShare={() => setStep("share")}
            onBack={() => session.dataSource === "form" ? setStep("form") : setStep("integrate")}
            onConnectApps={session.dataSource === "form" ? () => setStep("integrate") : undefined}
          />
        )}

        {step === "share" && (
          <WidgetShare
            session={session}
            updateSession={updateSession}
            onBack={() => setStep("results")}
          />
        )}
      </div>
    </div>
  );
}