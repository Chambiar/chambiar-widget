"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetMetricResult } from "@/lib/widget/types";
import { calculateWorkSystem, type WorkSystemResult } from "@/lib/workSystemCalculator";

interface WidgetFormDiagnosticProps {
  onComplete: (metrics: WidgetMetricResult[], score: number, workSystem?: WorkSystemResult) => void;
  onBack: () => void;
  onSwitchToApps: () => void;
}

interface Question {
  id: string;
  heading: string;
  options: { value: string; label: string }[];
  signal: string;
  allowOther?: boolean;
}

const questions: Question[] = [
  {
    id: "role",
    heading: "What best describes your role?",
    options: [
      { value: "founder", label: "Executive / Founder" },
      { value: "manager", label: "Manager / Team Lead" },
      { value: "ic", label: "Individual Contributor" },
      { value: "product_eng", label: "Product / Engineering" },
      { value: "sales", label: "Sales / Marketing" },
      { value: "ops", label: "Operations / Admin" },
      { value: "consultant", label: "Consultant / Independent" },
      { value: "other", label: "Other" },
    ],
    signal: "role",
    allowOther: true,
  },
  {
    id: "work_structure",
    heading: "How is your time typically structured?",
    options: [
      { value: "independent", label: "Mostly independent" },
      { value: "mix", label: "Mix of meetings and individual work" },
      { value: "meetings", label: "Mostly meetings and coordination" },
    ],
    signal: "work_structure",
  },
  {
    id: "meeting_load",
    heading: "How many hours did you spend in meetings last week?",
    options: [
      { value: "lt5", label: "Less than 5 hours" },
      { value: "5-10", label: "5–10 hours" },
      { value: "10-15", label: "10–15 hours" },
      { value: "15-20", label: "15–20 hours" },
      { value: "20+", label: "20+ hours" },
    ],
    signal: "meeting_load",
  },
  {
    id: "focus_fragmentation",
    heading: "Did meetings interrupt your focus?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
    signal: "focus_fragmentation",
  },
  {
    id: "email_backlog",
    heading: "How many emails are waiting for your response?",
    options: [
      { value: "0-10", label: "0–10" },
      { value: "10-30", label: "10–30" },
      { value: "30-60", label: "30–60" },
      { value: "60+", label: "60+" },
    ],
    signal: "email_backlog",
  },
  {
    id: "notification_pressure",
    heading: "How often do notifications interrupt your work?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
    signal: "notification_pressure",
  },
];

type Answers = Record<string, string>;

function convertAnswersToMetrics(answers: Answers): WidgetMetricResult[] {
  const metrics: WidgetMetricResult[] = [];

  // Meeting load → hoursWasted
  const meetingMap: Record<string, number> = {
    lt5: 3,
    "5-10": 7,
    "10-15": 12,
    "15-20": 17,
    "20+": 22,
  };
  const meetingVal = meetingMap[answers.meeting_load] ?? 7;
  metrics.push({
    id: "hoursWasted",
    value: meetingVal,
    trend: "neutral",
    status: meetingVal >= 15 ? "bad" : "warning",
  });

  // Focus fragmentation → collaborationBottleneck
  const focusMap: Record<string, number> = {
    rarely: 1,
    sometimes: 3,
    often: 6,
    constantly: 9,
  };
  const focusVal = focusMap[answers.focus_fragmentation] ?? 3;
  metrics.push({
    id: "collaborationBottleneck",
    value: focusVal,
    trend: "neutral",
    status: focusVal >= 6 ? "bad" : focusVal >= 3 ? "warning" : "good",
  });

  // Email backlog → emailDebt
  const emailMap: Record<string, number> = {
    "0-10": 5,
    "10-30": 20,
    "30-60": 45,
    "60+": 80,
  };
  const emailVal = emailMap[answers.email_backlog] ?? 20;
  metrics.push({
    id: "emailDebt",
    value: emailVal,
    trend: "neutral",
    status: emailVal >= 45 ? "bad" : emailVal >= 20 ? "warning" : "good",
  });

  // Notification pressure → notificationOverload
  const notifMap: Record<string, number> = {
    rarely: 30,
    sometimes: 80,
    often: 150,
    constantly: 300,
  };
  const notifVal = notifMap[answers.notification_pressure] ?? 80;
  metrics.push({
    id: "notificationOverload",
    value: notifVal,
    trend: "neutral",
    status: notifVal >= 150 ? "bad" : notifVal >= 80 ? "warning" : "good",
  });

  // Work structure → workStructure
  const structureMap: Record<string, number> = {
    independent: 1,
    mix: 5,
    meetings: 9,
  };
  const structureVal = structureMap[answers.work_structure] ?? 5;
  metrics.push({
    id: "workStructure",
    value: structureVal,
    trend: "neutral",
    status: structureVal >= 7 ? "bad" : structureVal >= 4 ? "warning" : "good",
  });

  return metrics;
}

function calculateScore(metrics: WidgetMetricResult[]): number {
  if (metrics.length === 0) return 50;
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

export default function WidgetFormDiagnostic({
  onComplete,
  onBack,
}: WidgetFormDiagnosticProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const goToNext = () => {
    if (isLastQuestion) {
      const metrics = convertAnswersToMetrics(answers);
      const score = calculateScore(metrics);
      const role = answers.role || "other";
      const workSystem = calculateWorkSystem(answers, role);
      onComplete(metrics, workSystem.oei_score, workSystem);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  const isOtherSelected = question.allowOther && answers[question.id] === "other";
  const hasAnswer = !!answers[question.id] && (!isOtherSelected || !!otherText[question.id]?.trim());

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-[#3A628F]">
          <span>Question {currentQuestion + 1}</span>
          <span>{currentQuestion + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#103257] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#103257] mb-6">
          {question.heading}
        </h2>

        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full p-4 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                answers[question.id] === option.value
                  ? "border-[#103257] bg-[#D9E7FF] text-[#103257]"
                  : "border-[#e2e8f0] hover:border-[#3A628F] text-[#3A628F]"
              }`}
            >
              {option.label}
            </button>
          ))}

          {/* Text input for "Other" */}
          {isOtherSelected && (
            <input
              type="text"
              placeholder="Please specify your role..."
              value={otherText[question.id] || ""}
              onChange={(e) => setOtherText((prev) => ({ ...prev, [question.id]: e.target.value }))}
              className="w-full p-4 rounded-lg border-2 border-[#103257] bg-white text-sm text-[#103257] placeholder-[#94A9C2] outline-none focus:ring-2 focus:ring-[#D9E7FF]"
              autoFocus
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={goToPrevious} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button onClick={goToNext} variant="outline" disabled={!hasAnswer}>
          {isLastQuestion ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              See My Results
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}