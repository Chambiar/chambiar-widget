"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Volume2,
  VolumeX,
  Share2,
  FileText,
  Link as LinkIcon,
  Linkedin,
  Instagram,
  Rss,
} from "lucide-react";
import {
  calculateWorkSystem,
  getAnswerTier,
  partialHoursLost,
  type AnswerTier,
} from "@/lib/workSystemCalculator";
import {
  playKey,
  playDing,
  playCrease,
  playScroll,
  playKaching,
  setMuted,
  unlockAudio,
} from "@/lib/sfx";

// ── Questions (mirrors WidgetFormDiagnostic; centralize later) ──────────
type Opt = { value: string; label: string };
type Q = { id: string; heading: string; options: Opt[] };

// Order and prompts are copy decisions; the `value` on every option is a key
// the scoring layer reads, so those stay exactly as they are. Role runs last
// because it only sets the hourly rate.
const QUESTIONS: Q[] = [
  {
    id: "interruptions",
    heading:
      "Slack pings. Notifications buzz. How often does that pull you out of what you're actually doing?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
  },
  {
    id: "coordination",
    heading: "How often are you the one chasing the update instead of doing the work?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
  },
  {
    id: "night_work",
    heading: "How many hours did work follow you home this week?",
    options: [
      { value: "0", label: "None" },
      { value: "1-3", label: "1 to 3" },
      { value: "4-6", label: "4 to 6" },
      { value: "7-10", label: "7 to 10" },
      { value: "10+", label: "10 or more" },
    ],
  },
  {
    id: "meetings",
    heading: "How many hours has this week already lost to meetings?",
    options: [
      { value: "lt5", label: "Under 5" },
      { value: "5-10", label: "5 to 10" },
      { value: "10-15", label: "10 to 15" },
      { value: "15-20", label: "15 to 20" },
      { value: "20+", label: "20 or more" },
    ],
  },
  {
    id: "admin_ratio",
    heading: "Be honest. When you look back, what actually got finished today?",
    options: [
      { value: "mostly_focused", label: "Mostly focused work" },
      { value: "half", label: "Half admin, half focus" },
      { value: "mostly_admin", label: "Mostly admin and coordination" },
    ],
  },
  {
    id: "visibility",
    heading: "When you do something great, does it actually get seen?",
    options: [
      { value: "regularly", label: "Regularly" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
    ],
  },
  {
    id: "tools",
    heading: "How many tabs and apps do you have open just to get one thing done?",
    options: [
      { value: "1-3", label: "1 to 3" },
      { value: "4-6", label: "4 to 6" },
      { value: "7-10", label: "7 to 10" },
      { value: "10+", label: "More than 10" },
    ],
  },
  {
    id: "role",
    heading: "What's closest to your role?",
    options: [
      { value: "founder", label: "Executive/Founder" },
      { value: "manager", label: "Manager/Team lead" },
      { value: "product_eng", label: "Product/Engineering" },
      { value: "sales", label: "Sales/Marketing" },
      { value: "ic", label: "Individual contributor" },
      { value: "ops", label: "Operations/Admin" },
      { value: "consultant", label: "Consultant/Independent" },
    ],
  },
];

// One dry line after an answer that cost something. Aimed at the system, not
// the person. Good answers get nothing, so the receipt stays quiet when
// there's nothing to charge for.
const REACTIONS: Record<string, Partial<Record<AnswerTier, string>>> = {
  interruptions: {
    warning: "That's the system talking over you.",
    bad: "Every one of those has a price.",
  },
  coordination: {
    warning: "That's time the process borrowed.",
    bad: "You're doing the system's job for it.",
  },
  night_work: {
    warning: "The week ran over. It'll do it again.",
    bad: "That isn't overtime, it's overflow.",
  },
  meetings: {
    warning: "That's a lot of week to book out.",
    bad: "There's barely a week left after that.",
  },
  admin_ratio: {
    warning: "Half the day went to running the day.",
    bad: "The work about work won.",
  },
  visibility: {
    warning: "Invisible work still costs the same.",
    bad: "It happened. Nobody logged it.",
  },
  tools: {
    warning: "Every switch costs you something.",
    bad: "That isn't a stack, it's a commute.",
  },
};

type Line = {
  text: string;
  kind: "head" | "rule" | "meta" | "item" | "q" | "total" | "note" | "react";
};

// Keyboard grid — fills the grey keypad region without overlap.
const KEY_COLS = 11;
const KEY_ROWS_N = 4;
const TOTAL_KEYS = KEY_COLS * KEY_ROWS_N;
const KEY_VARIANTS = ["/key-white.png", "/key 2.png"];
// Region rectangles as % of the register image (tweak to fit the grey keypad).
const SCREEN = { left: "34.5%", top: "38.5%", width: "32.5%", height: "15.5%" };
const KEYS = { left: "25%", top: "59%", width: "50%", height: "34%" };

// LCD type is sized against the register (container queries), not the viewport,
// so it tracks the art at every width — 1.7cqw reproduces the old 15px at the
// register's 880px max. The clamp floor keeps it legible once the register
// shrinks to phone width, where strict proportion would land near 6px.
// No `truncate`: labels wrap to a second line instead of losing their tails.
const LCD_TEXT = "text-[clamp(9px,1.7cqw,15px)] leading-[1.15]";
// The screen is only ~33px tall on a phone, so an arrow can't hold a 44px box
// inside it. The pseudo-element pushes the tappable area out onto the bezel —
// visual size unchanged, hit area big enough for a thumb.
const ARROW_HIT =
  "relative shrink-0 px-[0.6cqw] text-[clamp(13px,1.5cqw,16px)] leading-none " +
  "after:absolute after:-inset-x-[10px] after:-inset-y-[16px] after:content-['']";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gesture tuning. A trackpad flick emits dozens of wheel events, so steps are
// gated on distance travelled plus a cooldown — otherwise one flick spins the
// whole option list. SWIPE_PX is deliberately larger than a tap's jitter so
// tapping to confirm never registers as a swipe.
const WHEEL_PX = 40;
const SWIPE_PX = 26;
const STEP_MS = 90;

// Thumbtack drawn onto the downloaded PDF, in receipt CSS px. thumbtack-shadow.png
// is thumbtack-trim.png (PIN_SRC) with a drop shadow baked into the pixels —
// jsPDF draws a raw PNG and can't apply a CSS filter. The blur is oversized at
// source scale because the pin renders ~28x smaller than the art. PIN_OFF locates
// the pin within that sheet so it still lands at PIN_W wide in the same spot.
const PIN_W = 16;
const PIN_SRC = { w: 449, h: 714 };
const PIN_SHEET = { w: 749, h: 1014 };
const PIN_OFF = { x: 130, y: 105 }; // where the pin sits inside PIN_SHEET

async function fetchDataUrl(src: string): Promise<string | null> {
  try {
    const blob = await (await fetch(src)).blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Google Apps Script endpoint (same one the old Share step used).
const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwtXkMKUbPqGJMhCqnEnz1RAMZMEVz-8lLG-wkIevfHyGNtMNyghKT55adb_kn8GLj3/exec";

async function submitToSheet(
  email: string,
  ws: ReturnType<typeof calculateWorkSystem>,
) {
  const roleByRate: Record<number, string> = {
    90: "Executive/Founder",
    70: "Manager/Team Lead",
    75: "Product/Engineering",
    65: "Sales/Marketing",
    55: "IC",
    40: "Operations/Admin",
    85: "Consultant",
  };
  try {
    await fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        companyType: "",
        assessmentScope: "",
        teamSize: "",
        role: roleByRate[ws.hourly_rate] ?? "Other",
        tools: ws.system_loss ? Math.round(ws.system_loss / 0.8) : "",
        meetingHours: ws.meeting_hours ?? "",
        interruptions: ws.interrupt_loss ?? "",
        coordination: ws.coordination_loss ?? "",
        nightWork: ws.night_work ?? "",
        adminRatio: ws.admin_ratio ?? "",
        visibility: ws.visibility ?? "",
        hoursLost: ws.hours_lost ?? "",
        executionTime: ws.execution_time ?? "",
        focusedWork: ws.focused_work ?? "",
        strategicWork: ws.strategic_work ?? "",
        weeklyCost: ws.estimated_cost ?? "",
        yearlyCost: (ws.estimated_cost ?? 0) * 52,
        oeiScore: ws.oei_score ?? "",
        visibilityLevel: ws.visibility ?? "",
      }),
    });
  } catch {
    // no-cors — silent, never block the UX
  }
}

export default function WidgetReceipt() {
  const [started, setStarted] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState<Line | null>(null);
  const [pending, setPending] = useState<
    { type: "options"; q: Q } | { type: "email" } | null
  >(null);
  const [email, setEmail] = useState("");
  const [pressed, setPressed] = useState<number | null>(null);
  const [optIndex, setOptIndex] = useState(0);
  // Mirror of the flow's local `answers`, so the running total can re-render.
  const [answered, setAnswered] = useState<Record<string, string>>({});
  const [overflow, setOverflow] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateWorkSystem> | null>(null);
  const [folding, setFolding] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const resolver = useRef<((v: string) => void) | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelAcc = useRef(0);
  const stepLock = useRef(0);
  const touchY = useRef<number | null>(null);

  // Deterministic pseudo-random keycap pattern (stable across SSR + client).
  const keyVariants = useMemo(
    () =>
      Array.from({ length: TOTAL_KEYS }, (_, i) => {
        const h = Math.sin(i * 127.1 + 311.7) * 43758.5453;
        return KEY_VARIANTS[h - Math.floor(h) < 0.5 ? 0 : 1];
      }),
    [],
  );

  const pressRandomKey = () => {
    setPressed(Math.floor(Math.random() * TOTAL_KEYS));
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => mounted.current && setPressed(null), 90);
  };

  // Drives the on-screen arrows. The window listeners step through their own
  // throttled path, since wheel and touch arrive as streams rather than taps.
  const bump = (dir: 1 | -1) => {
    if (pending?.type !== "options") return;
    const len = pending.q.options.length;
    setOptIndex((i) => (i + dir + len) % len);
    playKey();
    pressRandomKey();
  };

  const typeLine = async (line: Line, cps = 42) => {
    for (let i = 1; i <= line.text.length; i++) {
      if (!mounted.current) return;
      setTyping({ ...line, text: line.text.slice(0, i) });
      if (line.text[i - 1] !== " ") {
        playKey();
        pressRandomKey();
      }
      await sleep(1000 / cps);
    }
    if (!mounted.current) return;
    setLines((l) => [...l, line]);
    setTyping(null);
  };

  const printInstant = async (line: Line, gap = 120) => {
    if (!mounted.current) return;
    setLines((l) => [...l, line]);
    await sleep(gap);
  };

  const waitFor = <T extends string>(p: typeof pending) => {
    setPending(p);
    return new Promise<T>((res) => {
      resolver.current = res as (v: string) => void;
    });
  };

  const resolvePending = (value: string) => {
    const r = resolver.current;
    resolver.current = null;
    setPending(null);
    r?.(value);
  };

  // ── Flow ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    mounted.current = true;
    const answers: Record<string, string> = {};

    (async () => {
      await typeLine({ text: "CHAMBIAR'S WORK RECEIPT", kind: "head" }, 26);
      await printInstant({ text: "----------------------------", kind: "rule" });
      await typeLine({ text: "Where does your time go?", kind: "meta" }, 50);
      await printInstant({ text: "----------------------------", kind: "rule" });

      for (const q of QUESTIONS) {
        if (!mounted.current) return;
        await typeLine({ text: q.heading, kind: "q" }, 55);
        const value = await waitFor<string>({ type: "options", q });
        if (!mounted.current) return;
        answers[q.id] = value;
        setAnswered({ ...answers }); // drives the running total below
        const label = q.options.find((o) => o.value === value)?.label ?? value;
        playDing();
        await typeLine({ text: `> ${label}`, kind: "item" }, 55);

        // Anything that cost something gets a line. "good" prints clean.
        const tier = getAnswerTier(q.id, value);
        const reaction = tier && tier !== "good" ? REACTIONS[q.id]?.[tier] : undefined;
        if (reaction) {
          if (!mounted.current) return;
          await typeLine({ text: reaction, kind: "react" }, 60);
        }

        await printInstant({ text: "", kind: "rule" });
        await sleep(120);
      }

      await printInstant({ text: "----------------------------", kind: "rule" });
      await typeLine({ text: "Where should we send it?", kind: "q" }, 55);
      const addr = await waitFor<string>({ type: "email" });
      if (!mounted.current) return;
      playKey();
      await typeLine({ text: `EMAIL: ${addr}`, kind: "item" }, 55);
      await sleep(200);

      // Result for the results page
      const ws = calculateWorkSystem(answers, answers.role || "other");

      // Send the collected data to the Google Sheet (fire-and-forget).
      void submitToSheet(addr, ws);

      // Launch: bounce, then shoot up with a paper-scroll + ka-ching; register bops down
      if (!mounted.current) return;
      setLaunching(true);
      await sleep(1000);
      if (!mounted.current) return;
      playScroll();
      playKaching();
      await sleep(1200);
      if (!mounted.current) return;
      setResult(ws);
      playScroll();
      setDone(true);
    })();

    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const begin = () => {
    unlockAudio();
    setStarted(true);
  };

  const handleDownloadPdf = async () => {
    const el = receiptRef.current;
    if (!el) return;
    setShareOpen(false);
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    try {
      const cssW = el.offsetWidth;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        // Clone-only padding makes room for the pin. The live page is never
        // touched, so the receipt doesn't flash during capture.
        onclone: (_doc, node) => {
          node.style.paddingTop = "62px";
        },
      });
      // Receipt at half the page width so it reads small, but the page height
      // hugs it so there's no dead space at the bottom.
      const w = canvas.width * 0.5;
      const h = canvas.height * 0.5;
      const pad = w * 0.1;
      const pageW = canvas.width;
      const pageH = h + pad * 2;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pageW, pageH],
      });
      const x0 = (pageW - w) / 2;
      const y0 = pad;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", x0, y0, w, h);

      // Pin goes straight onto the PDF — html2canvas won't rasterize an <img>
      // injected into its clone, so drawing it here is what actually sticks.
      const pinData = await fetchDataUrl("/thumbtack-shadow.png");
      if (pinData) {
        const s = w / cssW; // CSS px -> PDF px
        const k = (PIN_W / PIN_SRC.w) * s; // pin source px -> PDF px
        const pinX = x0 + (cssW / 2 - PIN_W / 2 - 50) * s;
        const pinY = y0 + 16 * s;
        pdf.addImage(
          pinData,
          "PNG",
          pinX - PIN_OFF.x * k,
          pinY - PIN_OFF.y * k,
          PIN_SHEET.w * k,
          PIN_SHEET.h * k,
        );
      }
      pdf.save("chambiar-work-receipt.pdf");
    } catch (err) {
      console.error("[work-receipt] PDF export failed:", err);
    }
  };

  const toggleMute = () => {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  };

  const onEmailKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (EMAIL_RE.test(email.trim())) {
        setEmailError(false);
        resolvePending(email.trim());
      } else {
        setEmailError(true);
      }
    } else if (e.key.length === 1) {
      playKey();
      pressRandomKey();
      if (emailError) setEmailError(false);
    }
  };

  // Reset the scroller whenever a new question appears.
  useEffect(() => {
    setOptIndex(0);
  }, [pending]);

  // Global input while a question is up: arrows / wheel / swipe move the
  // selector, Enter confirms. These listen on window rather than the LCD —
  // the screen is ~120px wide on a phone, far too small to aim a gesture at.
  useEffect(() => {
    if (!started || pending?.type !== "options") return;
    const len = pending.q.options.length;

    const step = (dir: 1 | -1) => {
      setOptIndex((i) => (i + dir + len) % len);
      playKey();
      pressRandomKey();
    };
    // Wheel and swipe arrive as streams; keys arrive one at a time already.
    const gestureStep = (dir: 1 | -1) => {
      const now = performance.now();
      if (now - stepLock.current < STEP_MS) return;
      stepLock.current = now;
      step(dir);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        resolvePending(pending.q.options[optIndex].value);
      }
    };

    const onWheel = (e: WheelEvent) => {
      wheelAcc.current += e.deltaY;
      if (Math.abs(wheelAcc.current) < WHEEL_PX) return;
      const dir = wheelAcc.current > 0 ? 1 : -1;
      wheelAcc.current = 0;
      gestureStep(dir);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY.current === null) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - touchY.current;
      if (Math.abs(dy) < SWIPE_PX) return;
      touchY.current = y;
      gestureStep(dy < 0 ? 1 : -1); // swipe up reads as "next", like a real reel
    };
    const onTouchEnd = () => {
      touchY.current = null;
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, pending, optIndex]);

  const runningHours = partialHoursLost(answered);

  // Measure how much of the receipt has printed past the navbar (locked height).
  useEffect(() => {
    const el = contentRef.current;
    const inner = innerRef.current;
    if (el && inner) setOverflow(Math.max(0, inner.offsetHeight - el.clientHeight));
  }, [lines, typing, runningHours]);

  // Start on the first interaction anywhere — no need to click the sticker.
  useEffect(() => {
    if (started) return;
    const start = () => begin();
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("wheel", start, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("wheel", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // "type" promised a keyboard the phone doesn't have, and scroll alone never
  // confirmed an answer — it only ever moved the selector.
  const lcd = typing?.text ?? (started ? "READY" : "SCROLL OR TAP TO BEGIN");

  // Results page — the full receipt dispenses out of the slot.
  if (done && result) {
    const oei = result.oei_score;
    const tb = result.time_breakdown;
    const interp =
      oei >= 71
        ? "Mostly efficient — some time lost to coordination overhead."
        : oei >= 51
        ? "A lot of your week goes to coordination rather than execution."
        : oei >= 31
        ? "Most of your week is spent managing work, not completing it."
        : "Coordination dominates your week. Little time left for focused work.";
    const mark = (s: "good" | "warning" | "bad") =>
      s === "good" ? "OK" : s === "warning" ? "!!" : "XX";
    const d = new Date();
    const dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate(),
    ).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;

    return (
      <div className="fixed inset-0 z-0 overflow-y-auto bg-[#eef1f5]">
        {/* Share button (10px below the navbar) */}
        <button
          data-noprint
          onClick={() => setShareOpen(true)}
          className="fixed right-[3vw] top-[82px] z-50 flex items-center gap-2 rounded-full bg-[#103257] px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#1a4a7a]"
        >
          <Share2 className="h-4 w-4" />
          {linkCopied ? "Copied!" : "Share"}
        </button>

        {/* Share modal — centered */}
        {shareOpen && (
          <div
            data-noprint
            onClick={() => setShareOpen(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
            >
              <div className="text-center text-base font-bold text-[#103257]">
                Share your Work Receipt
              </div>
              <p className="mb-4 mt-1 text-center text-xs text-[#6b82a3]">
                Download it or send someone the link
              </p>

              <button
                onClick={handleDownloadPdf}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-[#103257] hover:bg-[#f1f5fb]"
              >
                <FileText className="h-4 w-4" /> Download as PDF
              </button>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/?ref=${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;
                  try {
                    await navigator.clipboard.writeText(url);
                  } catch {}
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                  setShareOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#103257] px-4 py-3 text-sm font-medium text-white hover:bg-[#1a4a7a]"
              >
                <LinkIcon className="h-4 w-4" />{" "}
                {linkCopied ? "Link copied!" : "Copy shareable link"}
              </button>

              <div className="mt-4 flex items-center justify-center gap-6 border-t border-[#e2e8f0] pt-4">
                <a
                  href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fworkreceipt.chambiar.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                  className="text-[#3A628F] transition-colors hover:text-[#103257]"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-[#3A628F] transition-colors hover:text-[#103257]"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Substack"
                  className="text-[#3A628F] transition-colors hover:text-[#103257]"
                >
                  <Rss className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Try Blue! sticker — top-right, links to Chambiar */}
        <a
          href="https://www.chambiar.ai/"
          aria-label="Try Blue — visit Chambiar" data-noprint
          onClick={(e) => {
            e.preventDefault();
            if (folding) return;
            setFolding(true);
            window.setTimeout(() => {
              window.location.href = "https://www.chambiar.ai/";
            }, 600);
          }}
          className="fixed right-[1vw] top-[316px] z-40 w-[min(115px,22vw)] lg:right-[calc(3vw+160px)] lg:w-[min(115px,23vw)]"
        >
          <div
            className={`relative aspect-square w-full rotate-[15deg] [container-type:size] ${
              folding ? "sticker-fold" : ""
            }`}
            style={{ filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.25))" }}
          >
            <Image src="/Try Blue!.png" alt="Try Blue" fill sizes="150px" className="object-contain" />
            <div className="absolute inset-0 flex items-center justify-center pl-[6%] pr-[26%]">
              <span className="text-center font-extrabold uppercase leading-[1.05] tracking-tight text-[#103257] text-[10.4cqw]">
                Try<br />Blue!
              </span>
            </div>
          </div>
        </a>

        {/* Blue mascot wave card — right middle, tucked under the Try Blue sticker */}
        <a
          href="https://www.chambiar.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join our pre-launch — visit Chambiar" data-noprint
          className="fixed right-[1vw] top-[300px] z-30 w-[min(340px,24vw)] rotate-[2deg] lg:w-[min(340px,58vw)]"
        >
          <div className="relative aspect-square w-full [container-type:size]">
            <Image src="/Blue Wave.png" alt="" fill sizes="340px" className="object-contain" />
            <div className="absolute inset-0 flex items-center justify-center pl-[8%] pr-[42%]">
              <span
                className="text-center font-bold leading-[1.1] text-[#103257] text-[8.5cqw]"
                style={{ fontFamily: "var(--font-hand), cursive" }}
              >
                Join our pre-launch!
              </span>
            </div>
          </div>
        </a>

        {/* Post-it — bottom-left, links to Chambiar */}
        <a
          href="https://www.chambiar.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Try our work engine — visit Chambiar" data-noprint
          className="fixed bottom-[13vh] left-[2vw] z-40 w-[min(190px,26vw)] lg:left-[3vw] lg:w-[min(190px,38vw)]"
        >
          <div
            className="relative aspect-square w-full -rotate-[4deg] [container-type:size]"
            style={{ filter: "drop-shadow(0 6px 8px rgba(60,70,90,0.28))" }}
          >
            <Image src="/post it.png" alt="" fill sizes="190px" className="object-contain" />
            <div className="absolute inset-0 flex items-center justify-center px-[15%] pb-[10%] pt-[24%]">
              <span
                className="text-center font-bold leading-[1.1] text-[#103257] text-[12.8cqw]"
                style={{ fontFamily: "var(--font-hand), cursive" }}
              >
                Like these insights - Try our work engine!
              </span>
            </div>
          </div>
        </a>

        <div className="mx-auto flex w-full max-w-[640px] flex-col items-center px-4 pt-[102px] pb-20">
          {/* Printer slot (pulled up so the bar — not the transparent top — sits by the navbar) */}
          <div
            className="relative z-20 w-[468px] max-w-[96vw]"
            style={{ marginTop: "calc(min(468px, 96vw) * -0.42)" }}
          >
            <Image
              src="/slot.png"
              alt=""
              width={1080}
              height={1080}
              priority
              className="h-auto w-full drop-shadow-[0_14px_24px_rgba(40,55,85,0.28)]"
            />
          </div>

          {/* Dispensed receipt — emerges from the slot's black line, in front.
              Everything here is a ratio of the slot rather than a pixel offset.
              The old `w-[82%] max-w-[380px]` measured against the text column,
              not the slot, so below 380px the receipt stopped tracking the art;
              `-translate-x-[42px]` then compensated for centring maths that only
              balanced at exactly 380px, and the text walked off the paper's left
              edge on a phone. 0.812 and 0.107 are those same desktop offsets
              (380/468, 50/468) expressed against the slot, so the desktop
              rendering is unchanged and every narrower width now follows it. */}
          <div
            className="relative z-30 w-[calc(min(468px,96vw)*0.812)] translate-x-[calc(min(468px,96vw)*0.107)] [container-type:inline-size]"
            style={{
              marginTop: "calc(min(468px, 96vw) * -0.49 - 30px)",
              filter: "drop-shadow(0 9px 20px rgba(60,70,90,0.18))",
            }}
          >
            <div
              ref={receiptRef}
              className="receipt-dispense relative pb-[16.8cqw] pt-[10.5cqw] font-mono text-[clamp(9px,3.16cqw,12px)] leading-[1.7] text-[#1c1a17]"
              style={{
                backgroundImage: "url('/receipt-paper.png')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Text column, as a fraction of the paper: 215/380 wide, starting
                  40.5/380 in — i.e. exactly where it sat on desktop. */}
              <div className="ml-[10.66%] w-[56.58%]">
              <div className="text-center text-[clamp(13px,4.74cqw,18px)] font-bold leading-tight tracking-tight text-[#103257]">
                CHAMBIAR&apos;S<br />WORK RECEIPT
              </div>
              <div className="mt-2 text-center text-[#6a6456]">{interp}</div>

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              <div className="flex justify-between">
                <span>OEI SCORE</span>
                <span className="font-bold">{oei}/100</span>
              </div>

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              <div className="font-bold text-[#6a6456]">TIME LOST — COORDINATION</div>
              <div className="flex justify-between">
                <span>This week</span>
                <span className="font-bold">{result.hours_lost} hrs</span>
              </div>

              <div className="mt-3 font-bold text-[#6a6456]">WHERE YOUR WEEK GOES</div>
              <div className="flex justify-between">
                <span>Meetings</span>
                <span>{tb.meetings} hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Coordination</span>
                <span>{tb.coordination} hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Execution</span>
                <span>{tb.execution} hrs</span>
              </div>

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              {result.breakdown_categories.map((cat) => (
                <div key={cat.title} className="mb-2">
                  <div className="font-bold text-[#103257]">{cat.title}</div>
                  {/* No `truncate`: "Admin vs focused" + "Mostly focused [OK]"
                      overruns this column at every width, desktop included, so
                      truncating just hid the label's tail everywhere. Letting it
                      wrap is both honest and how a real receipt behaves. */}
                  {cat.metrics.map((m) => (
                    <div key={m.label} className="flex justify-between gap-2">
                      <span className="min-w-0">{m.label}</span>
                      <span className="shrink-0">
                        {m.value} [{mark(m.status)}]
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              <div className="flex justify-between">
                <span>Hours lost/wk</span>
                <span>{result.hours_lost} hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Rate</span>
                <span>${result.hourly_rate}/hr</span>
              </div>

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              <div className="flex justify-between text-[clamp(11px,3.95cqw,15px)] font-bold text-[#12a468]">
                <span>TOTAL</span>
                <span>${result.estimated_cost}/wk</span>
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div
                  className="h-[10.5cqw] max-h-10 w-[72%]"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, #1c1a17 0 2px, transparent 2px 4px, #1c1a17 4px 5px, transparent 5px 8px, #1c1a17 8px 10px, transparent 10px 11px, #1c1a17 11px 14px, transparent 14px 16px)",
                  }}
                />
                <div className="mt-1 text-[clamp(7.5px,2.63cqw,10px)] tracking-[0.25em] text-[#6a6456]">
                  CHAMBIAR.AI — {dateStr}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#eef1f5]">
      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute top-4 right-4 z-40 h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-[#3A628F] shadow-md hover:text-[#103257]"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Receipt paper — grows up from the slot, locks at the navbar. Its width
          tracks the register's paper feed (300px at desktop, ~130px on a
          phone), so the type inside must scale with it via container queries —
          held at 12px it printed ~12 chars per line and every reaction wrapped
          to five lines. */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-[min(332px,36vw)] z-10 w-[min(300px,34vw)] [container-type:inline-size] ${
          launching ? "receipt-launch" : ""
        }`}
        style={{ filter: "drop-shadow(0 16px 28px rgba(60,70,90,0.4))" }}
      >
        {/* Shadow receipt — appears once full; drapes DOWN from the navbar,
            10px to the right, BEHIND the original, darker, no text */}
        {overflow > 4 && (
          <div
            aria-hidden
            className="absolute left-[10px] top-0 -z-[1] w-full"
            style={{
              height: `${Math.min(overflow, 680)}px`,
              background:
                "repeating-linear-gradient(#d7cfbb 0 20px, #cbc2ac 20px 21px), #d3cab5",
              boxShadow: "0 8px 16px -8px rgba(0,0,0,0.35)",
              borderRadius: "0 0 3px 3px",
            }}
          />
        )}

        {/* Active paper — bottom-anchored, grows up, caps at the navbar */}
        <div
          ref={contentRef}
          className="receipt-torn-top flex flex-col justify-end overflow-hidden px-[clamp(10px,6.6cqw,20px)] pt-7 pb-24 font-mono text-[clamp(9px,4cqw,12px)] leading-[1.7] text-[#1c1a17]"
          style={{
            maxHeight: "calc(100vh - 80px - min(332px, 36vw))",
            background: "#f4efe3",
          }}
        >
          <div ref={innerRef} className="flex flex-col">
            {started && (
              <>
                {lines.map((l, i) => (
                  <ReceiptRow key={i} line={l} />
                ))}
                {typing && <ReceiptRow line={typing} caret />}

                {/* Running total. Hours rather than dollars: the rate comes
                    from role, which is the last question, so a cost here would
                    have to invent one and then jump when role lands. Only the
                    four inputs that feed hours_lost move this, so it holds
                    steady through the after-hours / admin / visibility
                    questions rather than ticking on every answer. */}
                {runningHours > 0 && (
                  <div className="mt-2 flex justify-between border-t border-solid border-[#bcb49f] pt-1 font-bold text-[#103257]">
                    <span>RUNNING TOTAL</span>
                    <span>{runningHours} hrs</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Register machine (sits in front of the paper) */}
      <div
        className={`absolute left-1/2 bottom-0 -translate-x-1/2 z-20 w-[min(880px,96vw)] aspect-[16/9] [container-type:inline-size] ${
          launching ? "register-bop" : ""
        }`}
      >
        <Image
          src="/register-v3.png"
          alt=""
          fill
          priority
          className="object-contain pointer-events-none select-none drop-shadow-[0_16px_28px_rgba(40,55,85,0.3)]"
        />

        {/* Email sticker — stuck flat on the register's top-left, like a real sticker */}
        {pending?.type === "email" && (
          <div className="pointer-events-none absolute left-[calc(17%+100px)] top-[calc(11%+45px)] z-40 w-[7.84%]">
            <div className="relative aspect-square w-full -rotate-[10deg] [container-type:size]">
              <Image src="/sticker.png" alt="" fill sizes="150px" className="object-contain" />
              <div className="absolute inset-0 flex items-center justify-center px-[16%]">
                <span className="text-center font-extrabold uppercase leading-[1.05] tracking-tight text-[#103257] text-[16cqw]">
                  Enter Email!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LCD screen — where the questions are answered (scroll / tap + Enter) */}
        <div
          className="absolute z-30 flex items-center justify-center overflow-hidden px-[2%]"
          style={SCREEN}
        >
          {pending?.type === "email" ? (
            <input
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(false);
              }}
              onKeyDown={onEmailKey}
              placeholder={emailError ? "enter a valid email ⏎" : "you@work.com  ⏎"}
              className={`w-full bg-transparent text-center font-mono ${LCD_TEXT} outline-none ${
                emailError
                  ? "text-[#b91c1c] placeholder-[#b91c1c]"
                  : "text-[#17324f] placeholder-[#6f83a3]"
              }`}
            />
          ) : pending?.type === "options" ? (
            // Wheel/swipe are handled on window (see the input effect) so the
            // gesture isn't confined to this ~120px-wide screen on a phone.
            <div className="flex w-full items-center justify-between gap-[0.5cqw] font-mono text-[#17324f]">
              <button
                onClick={() => bump(-1)}
                className={`${ARROW_HIT} text-[#3a628f] hover:text-[#17324f]`}
                aria-label="Previous option"
              >
                ▲
              </button>
              <button
                onClick={() => resolvePending(pending.q.options[optIndex].value)}
                className={`min-w-0 flex-1 text-center ${LCD_TEXT}`}
                title="Tap or press Enter to confirm"
              >
                {pending.q.options[optIndex]?.label}
              </button>
              <button
                onClick={() => bump(1)}
                className={`${ARROW_HIT} text-[#3a628f] hover:text-[#17324f]`}
                aria-label="Next option"
              >
                ▼
              </button>
            </div>
          ) : (
            // Bottom-anchored so the newest characters stay on screen. The
            // prompts run ~100 chars and the LCD holds ~2 lines on a phone, so
            // anything top-anchored would type its way off the screen and sit
            // there looking frozen. The receipt below carries the full text.
            <div className="flex h-full w-full flex-col justify-end overflow-hidden py-[1%]">
              <div className={`text-center font-mono ${LCD_TEXT} text-[#17324f]`}>
                {lcd}
                {started && <span className="animate-pulse">▮</span>}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard — grid of keycaps filling the grey keypad */}
        <div
          className="absolute z-30 grid"
          style={{
            ...KEYS,
            gridTemplateColumns: `repeat(${KEY_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${KEY_ROWS_N}, 1fr)`,
            columnGap: "0.5%",
            rowGap: "0.2%",
          }}
        >
          {Array.from({ length: TOTAL_KEYS }).map((_, idx) => {
            const col = idx % KEY_COLS;
            const row = Math.floor(idx / KEY_COLS);
            const down = pressed === idx;
            // Drop the leftmost and rightmost columns (keep empty cells in place).
            if (col === 0 || col === KEY_COLS - 1) return <span key={idx} />;
            // The 3rd row's visible ends get the pink "Total (Enter)" keycap.
            const isRowEnd = row === 2 && (col === 1 || col === KEY_COLS - 2);
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={isRowEnd ? "/key 3.png" : keyVariants[idx]}
                alt=""
                style={{ transform: down ? "scale(1.5) translateY(9%)" : "scale(1.5)" }}
                className={`h-full w-full object-contain transition-transform duration-75 ${
                  down ? "brightness-90" : ""
                }`}
              />
            );
          })}
        </div>

      </div>

      {/* Corner ribbon. Anything centered on the blue band satisfies
          left% + top% = 66.2% (measured off the trimmed art, excluding the grey
          folded caps — they jut past the band and skew the centerline low).
          The band's bottom edge is 90.9%; lower left% slides toward bottom-left. */}
      <div className="pointer-events-none absolute left-0 top-[72px] z-40 w-[min(430px,36vw)]">
        <div className="relative aspect-square w-full [container-type:size]">
          <Image
            src="/pop-up-heading-1-trim.png"
            alt=""
            fill
            priority
            sizes="430px"
            className="object-contain drop-shadow-[0_8px_16px_rgba(40,55,85,0.28)]"
          />
          <span
            className="absolute left-[33.1%] top-[33.1%] w-[104cqw] -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] text-center font-black uppercase leading-[1.05] tracking-tight text-[#103257] text-[10.8cqw] [-webkit-text-stroke:0.6px_#103257]"
          >
            Your time
            <br />
            is costing you.
          </span>

          {/* Pop-up sticker — rides the band's bottom-left, fixed size */}
          <div
            className="absolute left-[35%] top-[72%] aspect-square w-[47cqw] -translate-x-1/2 -translate-y-1/2 rotate-[-20deg] drop-shadow-[0_7px_12px_rgba(40,55,85,0.38)] [container-type:size]"
          >
            <Image src="/pop up.png" alt="" fill priority sizes="203px" className="object-contain" />
            <div className="absolute inset-0 flex -translate-x-[2.4cqw] items-center justify-center px-[19%]">
              <span className="text-center font-extrabold uppercase leading-[1.05] tracking-tight text-white text-[6.5cqw] drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                Want Your Receipt?
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ line, caret }: { line: Line; caret?: boolean }) {
  const base = "whitespace-pre-wrap";
  if (line.kind === "rule")
    return <div aria-hidden className="my-1.5 border-t border-solid border-[#bcb49f]" />;
  if (line.kind === "head")
    return <div className={`${base} text-center text-[clamp(13px,6cqw,18px)] font-bold tracking-tight`}>{line.text}</div>;
  if (line.kind === "meta")
    return <div className={`${base} text-center text-[#6a6456]`}>{line.text}</div>;
  if (line.kind === "note")
    return <div className={`${base} text-center text-[#8a8577] py-2`}>{line.text}</div>;
  if (line.kind === "react")
    return (
      <div className={`${base} pl-2 text-[#8a8577]`}>
        {line.text}
        {caret && <span className="animate-pulse">▌</span>}
      </div>
    );
  if (line.kind === "q")
    return (
      <div className={`${base} font-bold text-[#103257] mt-1`}>
        {line.text}
        {caret && <span className="animate-pulse">▌</span>}
      </div>
    );
  if (line.kind === "total")
    return (
      <div className={`${base} font-bold text-[#12a468] text-[clamp(10px,4.6cqw,14px)]`}>
        {line.text}
        {caret && <span className="animate-pulse">▌</span>}
      </div>
    );
  return (
    <div className={base}>
      {line.text}
      {caret && <span className="animate-pulse">▌</span>}
    </div>
  );
}
