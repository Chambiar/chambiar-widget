"use client";

import { Zap, ArrowRight, ArrowLeft, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetChoiceProps {
  onChooseForm: () => void;
  onChooseApps: () => void;
  onBack: () => void;
}

export default function WidgetChoice({ onChooseForm, onChooseApps, onBack }: WidgetChoiceProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-[#103257] leading-tight">
          How do you want to get your receipt?
        </h1>

        <p className="text-lg text-[#3A628F] max-w-md mx-auto">
          Both create a receipt: One is instant. One is deeper.
        </p>
      </div>

      {/* Two options - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Form-based */}
        <button
          onClick={onChooseForm}
          className="group relative p-5 bg-white rounded-2xl border-2 border-[#e2e8f0] hover:border-[#103257] transition-all text-left shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-[#D9E7FF] rounded-xl group-hover:bg-[#103257] transition-colors">
              <FileText className="h-6 w-6 text-[#103257] group-hover:text-white transition-colors" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#103257]">Quick Form</h2>
              <p className="text-sm text-[#3A628F] mt-1">
                Answer a few questions about your work habits
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#94A9C2]">
                <Clock className="h-3.5 w-3.5" />
                ~2 min
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[#94A9C2] group-hover:text-[#103257] transition-colors mt-2" />
          </div>
        </button>

        {/* Option 2: Connect apps - Default highlighted */}
        <button
          onClick={onChooseApps}
          className="group relative p-5 bg-white rounded-2xl border-2 border-[#103257] hover:border-[#103257] transition-all text-left shadow-md hover:shadow-lg"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-[#103257] rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#103257]">Connect Apps</h2>
              <p className="text-sm text-[#3A628F] mt-1">
                Link our integrated apps for precise insights
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#94A9C2]">
                <Clock className="h-3.5 w-3.5" />
                ~30 sec
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[#103257] mt-2" />
          </div>
        </button>
      </div>

      {/* Back button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );
}