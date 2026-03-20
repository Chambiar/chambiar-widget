"use client";

import { useState } from "react";
import { Building2, Briefcase, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompanyType, AssessmentScope } from "@/app/page";

interface WidgetLandingProps {
  onStart: (companyType: CompanyType, assessmentScope: AssessmentScope, teamSize?: number) => void;
}

const companyOptions: { id: CompanyType; label: string; subline: string; icon: typeof Building2 }[] = [
  {
    id: "smb",
    label: "SMB",
    subline: "Small to mid-sized team with fewer layers and fast-moving work",
    icon: Building2,
  },
  {
    id: "consultant",
    label: "Consultant",
    subline: "You primarily manage your own work or serve clients directly",
    icon: Briefcase,
  },
  {
    id: "enterprise",
    label: "Enterprise",
    subline: "Large organization with multiple teams, layers, and structured workflows",
    icon: Building,
  },
];

export default function WidgetLanding({ onStart }: WidgetLandingProps) {
  const [selected, setSelected] = useState<CompanyType | null>(null);
  const [scope, setScope] = useState<AssessmentScope | null>(null);
  const [teamSize, setTeamSize] = useState<string>("");

  return (
    <div className="text-center space-y-8 flex flex-col items-center justify-center min-h-[80vh]">
      {/* Bounce animation styles */}
      <style jsx>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            transform: scale(1.05) translateY(-5px);
          }
          70% {
            transform: scale(0.95) translateY(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounceInBig {
          0% {
            opacity: 0;
            transform: scale(0.2) translateY(40px);
          }
          40% {
            transform: scale(1.2) translateY(-15px);
          }
          60% {
            transform: scale(0.9) translateY(8px);
          }
          80% {
            transform: scale(1.08) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .bounce-in {
          animation: bounceIn 0.6s ease-out forwards;
          opacity: 0;
        }
        .bounce-in-1 { animation-delay: 0.1s; }
        .bounce-in-2 { animation-delay: 0.2s; }
        .bounce-in-3 { animation-delay: 0.3s; }
        .bounce-in-cta {
          animation: bounceInBig 0.8s ease-out forwards;
          animation-delay: 0.6s;
          opacity: 0;
        }
      `}</style>

      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-[#103257] leading-tight uppercase tracking-wide mt-[20px]">
          HOW DOES YOUR WORK SYSTEM <span className="text-[#3A628F]">BEHAVE</span>?
        </h1>

        <p className="text-lg text-[#103257] max-w-md mx-auto mt-[30px]">
          Answer a few questions and Chambiar&apos;s AI coworker, Maria, will generate a snapshot of how your work environment is affecting you.
        </p>
      </div>

      {/* Company Type Selection */}
      <div className="grid grid-cols-3 gap-3 py-5 w-full">
        {companyOptions.map((option, i) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => {
                setSelected(option.id);
                setScope(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all text-center bounce-in bounce-in-${i + 1} ${
                isSelected
                  ? "border-[#103257] bg-[#103257]/5 shadow-md"
                  : "border-[#e2e8f0] bg-white hover:-translate-y-1 hover:shadow-md"
              }`}
            >
              <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? "text-[#103257]" : "text-[#3A628F]"}`} strokeWidth={1.5} />
              <h3 className={`font-semibold text-sm ${isSelected ? "text-[#103257]" : "text-[#103257]"}`}>{option.label}</h3>
              <p className="text-xs text-[#3A628F] mt-1 leading-snug">{option.subline}</p>
            </button>
          );
        })}
      </div>

      {/* Individual / Team Toggle */}
      {selected && (
        <div className="flex items-center justify-center gap-2 bg-white border-2 border-[#e2e8f0] rounded-full p-1">
          <button
            onClick={() => { setScope("individual"); setTeamSize(""); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              scope === "individual"
                ? "bg-[#103257] text-white"
                : "text-[#3A628F] hover:bg-[#103257]/5"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setScope("team")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              scope === "team"
                ? "bg-[#103257] text-white"
                : "text-[#3A628F] hover:bg-[#103257]/5"
            }`}
          >
            Team
          </button>
        </div>
      )}

      {/* Team Size Input */}
      {selected && scope === "team" && (
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="team-size" className="text-sm font-medium text-[#103257]">
            How many people are on your team?
          </label>
          <input
            id="team-size"
            type="number"
            min="2"
            placeholder="e.g. 12"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            className="w-32 text-center px-4 py-2 border-2 border-[#e2e8f0] rounded-lg text-[#103257] font-medium focus:outline-none focus:border-[#103257] transition-colors"
          />
        </div>
      )}

      {/* CTA */}
      {selected && scope && (scope === "individual" || (scope === "team" && teamSize && Number(teamSize) >= 2)) && (
        <div className="bounce-in-cta">
          <Button
            onClick={() => onStart(selected, scope, scope === "team" ? Number(teamSize) : undefined)}
            variant="outline"
            className="text-lg px-8 py-4 h-auto border-2 bg-white hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            Generate Work Recap! <span className="ml-1">&rarr;</span>
          </Button>
        </div>
      )}

      <p className="text-lg text-[#103257]">
        Free • No account required!
      </p>
    </div>
  );
}