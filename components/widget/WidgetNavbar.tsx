"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WidgetNavbar() {
  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md shadow-md"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center">
        <a
          href="/"
          className="flex items-center space-x-2"
          onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}
        >
          <Image
            src="/Chambiar Logo.svg"
            alt="Chambiar Logo"
            width={100}
            height={100}
            style={{ height: "auto" }}
            className="object-contain w-20 sm:w-24 md:w-[100px]"
            priority
          />
        </a>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <a href="https://dev.chambiar.ai/signup" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="text-xs sm:text-sm px-3 sm:px-4">
              Sign Up for Chambiar
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}