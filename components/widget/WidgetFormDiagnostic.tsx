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
  allowOther?: boolean;
}

const questions: Question[] = [
  {
    id: "role",
    heading: "What best describes your role?",
    options: [
      { value: "founder", label: "Executive / Founder" },
      { value: "manager", label: "Manager / Team Lead" },
      { value: "product_eng", label: "Product / Engineering" },
      { value: "sales", label: "Sales / Marketing" },
      { value: "ic", label: "Individual Contributor (IC)" },
      { value: "ops", label: "Operations / Admin" },
      { value: "consultant", label: "Consultant / Independent" },
      { value: "other", label: "Other" },
    ],
    allowOther: true,
  },
  {
    id: "tools",
    heading: "How many tools do you use daily?",
    options: [
      { value: "1-3", label: "1–3" },
      { value: "4-6", label: "4–6" },
      { value: "7-10", label: "7–10" },
      { value: "10+", label: "10+" },
    ],
  },
  {
    id: "meetings",
    heading: "How many hours per week do you spend in meetings?",
    options: [
      { value: "lt5", label: "Less than 5 hours" },
      { value: "5-10", label: "5–10 hours" },
      { value: "10-15", label: "10–15 hours" },
      { value: "15-20", label: "15–20 hours" },
      { value: "20+", label: "20+ hours" },
    ],
  },
  {
    id: "interruptions",
    heading: "How often are you interrupted?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
  },
  {
    id: "coordination",
    heading: "How often do you chase updates or follow-ups?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
  },
  {
    id: "night_work",
    heading: "How many hours per week do you work outside normal hours?",
    options: [
      { value: "0", label: "0" },
      { value: "1-3", label: "1–3 hours" },
      { value: "4-6", label: "4–6 hours" },
      { value: "7-10", label: "7–10 hours" },
      { value: "10+", label: "10+ hours" },
    ],
  },
  {
    id: "admin_ratio",
    heading: "How much of your work is focused vs admin?",
    options: [
      { value: "mostly_focused", label: "Mostly focused work" },
      { value: "half", label: "About half and half" },
      { value: "mostly_admin", label: "Mostly admin" },
    ],
  },
  {
    id: "visibility",
    heading: "How often is your work recognized or visible?",
    options: [
      { value: "regularly", label: "Regularly" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
    ],
  },
];

type Answers = Record<string, string>;

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
      const role = answers.role || "other";
      const workSystem = calculateWorkSystem(answers, role);
      onComplete([], workSystem.oei_score, workSystem);
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
