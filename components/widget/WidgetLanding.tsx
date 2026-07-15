"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Briefcase, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompanyType, AssessmentScope } from "@/app/page";

interface WidgetLandingProps {
  onStart: (companyType: CompanyType, assessmentScope: AssessmentScope, teamSize?: number) => void;
}

type CompanyOption = {
  id: CompanyType;
  label: string;
  subline: string;
  icon: typeof Building2;
  button: string;    // 3D button image behind the icon
  chip: string;      // icon-chip gradient (legacy, used for selected ring/glow)
  glow: string;      // colored shadow when selected
  tint: string;      // selected bg tint
  ring: string;      // selected ring
  border: string;    // selected border
};

const companyOptions: CompanyOption[] = [
  {
    id: "smb",
    label: "SMB",
    subline: "Small to mid-sized team with fewer layers and fast-moving work",
    icon: Building2,
    button: "/btn-smb.png",
    chip: "from-[#5ab0ff] to-[#1f77ea]",
    glow: "rgba(63,143,224,0.42)",
    tint: "bg-[#3f8fe0]/[0.10]",
    ring: "ring-[#3f8fe0]/45",
    border: "border-[#3f8fe0]/45",
  },
  {
    id: "consultant",
    label: "Consultant",
    subline: "You primarily manage your own work or serve clients directly",
    icon: Briefcase,
    button: "/btn-consultant.png",
    chip: "from-[#4dd69b] to-[#12a468]",
    glow: "rgba(47,174,122,0.42)",
    tint: "bg-[#2fae7a]/[0.10]",
    ring: "ring-[#2fae7a]/45",
    border: "border-[#2fae7a]/45",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    subline: "Large organization with multiple teams, layers, and structured workflows",
    icon: Building,
    button: "/btn-enterprise.png",
    chip: "from-[#8ea0ff] to-[#5157e6]",
    glow: "rgba(96,114,219,0.42)",
    tint: "bg-[#6072db]/[0.10]",
    ring: "ring-[#6072db]/45",
    border: "border-[#6072db]/45",
  },
];

export default function WidgetLanding({ onStart }: WidgetLandingProps) {
  const [selected, setSelected] = useState<CompanyType | null>(null);
  const [scope, setScope] = useState<AssessmentScope | null>(null);
  const [teamSize, setTeamSize] = useState<string>("");

  return (
    <div className="relative text-left space-y-8 flex flex-col items-start justify-center min-h-[80vh]">
      {/* Curled receipt — right side, overlaps the cards, unfolds on load */}
      <div
        aria-hidden
        className="pointer-events-none select-none fixed z-30 top-[90px] right-[50px] h-[90vh] origin-top-right rotate-[8deg]"
      >
        <Image
          src="/receipt.png"
          alt=""
          width={400}
          height={600}
          priority
          className="receipt-unfold h-full w-auto max-w-none"
          style={{ filter: "drop-shadow(0 20px 30px rgba(60,80,120,0.26))" }}
        />
      </div>

      {/* Bounce animation styles */}
      <style jsx>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          60% {
            opacity: 1;
            transform: scale(1.03) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .pop-in-1 {
          animation: popIn 0.5s ease-out forwards;
          opacity: 0;
        }
        .pop-in-2 {
          animation: popIn 0.5s ease-out 0.3s forwards;
          opacity: 0;
        }
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
      <div className="relative z-20 w-full flex flex-col items-start text-left gap-3 sm:gap-4 mt-[50px] pl-4 sm:pl-5 max-w-[560px] min-h-[170px] sm:min-h-[200px]">
        {/* Glass panel floating behind the full text block */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -inset-y-8 rounded-[2rem] sm:rounded-[2.5rem] clay-panel animate-slow-float"
        />

        <h1
          className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold text-[#103257] leading-tight uppercase tracking-wide pop-in-1"
          style={{ textShadow: "0 2px 10px rgba(120,140,180,0.35)" }}
        >
          Are you wasting time?
        </h1>

        <p className="relative z-10 text-base sm:text-lg text-[#103257] max-w-md px-0">
          You might not like the answer.
        </p>
        <p className="relative z-10 text-xs sm:text-sm text-[#3A628F] max-w-md px-0">
          You worked all day. But how much of that was actual work?
        </p>
      </div>

      {/* Company Type Selection */}
      <div className="relative grid grid-cols-1 gap-3 py-5 w-full max-w-[560px]">
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
              className={`flex items-center gap-4 text-left p-4 sm:p-5 rounded-[1.75rem] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bounce-in bounce-in-${i + 1}${i >= 1 ? " relative z-40" : ""} ${
                isSelected
                  ? `clay-pressed ring-2 ${option.ring}`
                  : "clay hover:translate-x-3 hover:scale-[1.05]"
              }`}
            >
              <span className="relative shrink-0 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center">
                <Image
                  src={option.button}
                  alt=""
                  width={128}
                  height={128}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                />
                <Icon className="relative h-5 w-5 sm:h-6 sm:w-6 text-black" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-[#103257]">{option.label}</h3>
                <p className="text-xs sm:text-sm text-[#3A628F] mt-0.5 leading-snug">{option.subline}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Individual / Team Toggle */}
      {selected && (
        <div className="relative z-20 flex items-center justify-center gap-2 clay rounded-full p-1.5">
          <button
            onClick={() => { setScope("individual"); setTeamSize(""); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              scope === "individual"
                ? "bg-[#103257] text-white shadow-[0_6px_16px_-6px_rgba(16,50,87,0.5)]"
                : "text-[#3A628F] hover:bg-white/50"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setScope("team")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              scope === "team"
                ? "bg-[#103257] text-white shadow-[0_6px_16px_-6px_rgba(16,50,87,0.5)]"
                : "text-[#3A628F] hover:bg-white/50"
            }`}
          >
            Team
          </button>
        </div>
      )}

      {/* Team Size Input */}
      {selected && scope === "team" && (
        <div className="relative z-20 flex flex-col items-center gap-2">
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
            className="w-32 text-center px-4 py-2.5 clay-input rounded-xl text-[#103257] font-medium focus:outline-none focus:ring-2 focus:ring-[#2fae7a]/45 transition-all"
          />
        </div>
      )}

      {/* CTA */}
      {selected && scope && (scope === "individual" || (scope === "team" && teamSize && Number(teamSize) >= 2)) && (
        <div className="relative z-20 bounce-in-cta">
          <Button
            onClick={() => onStart(selected, scope, scope === "team" ? Number(teamSize) : undefined)}
            className="text-lg px-9 py-4 h-auto rounded-full border-0 text-white font-semibold bg-gradient-to-b from-[#3fc78d] to-[#1f9d68] clay-cta hover:from-[#48d197] hover:to-[#1c9260] hover:-translate-y-1 transition-all"
          >
            Get My Receipt <span className="ml-1">&rarr;</span>
          </Button>
        </div>
      )}

    </div>
  );
}