"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Volume2, VolumeX } from "lucide-react";
import { calculateWorkSystem } from "@/lib/workSystemCalculator";
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

const QUESTIONS: Q[] = [
  {
    id: "role",
    heading: "What best describes your role?",
    options: [
      { value: "founder", label: "Executive / Founder" },
      { value: "manager", label: "Manager / Team Lead" },
      { value: "product_eng", label: "Product / Engineering" },
      { value: "sales", label: "Sales / Marketing" },
      { value: "ic", label: "Individual Contributor" },
      { value: "ops", label: "Operations / Admin" },
      { value: "consultant", label: "Consultant / Independent" },
    ],
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
    heading: "Hours per week in meetings?",
    options: [
      { value: "lt5", label: "Less than 5" },
      { value: "5-10", label: "5–10" },
      { value: "10-15", label: "10–15" },
      { value: "15-20", label: "15–20" },
      { value: "20+", label: "20+" },
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
    heading: "How often do you chase updates?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "constantly", label: "Constantly" },
    ],
  },
  {
    id: "night_work",
    heading: "Hours per week outside normal hours?",
    options: [
      { value: "0", label: "0" },
      { value: "1-3", label: "1–3" },
      { value: "4-6", label: "4–6" },
      { value: "7-10", label: "7–10" },
      { value: "10+", label: "10+" },
    ],
  },
  {
    id: "admin_ratio",
    heading: "Focused work vs. admin?",
    options: [
      { value: "mostly_focused", label: "Mostly focused" },
      { value: "half", label: "About half & half" },
      { value: "mostly_admin", label: "Mostly admin" },
    ],
  },
  {
    id: "visibility",
    heading: "Is your work recognized / visible?",
    options: [
      { value: "regularly", label: "Regularly" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
    ],
  },
];

type Line = {
  text: string;
  kind: "head" | "rule" | "meta" | "item" | "q" | "total" | "note";
};

// Keyboard grid — fills the grey keypad region without overlap.
const KEY_COLS = 11;
const KEY_ROWS_N = 4;
const TOTAL_KEYS = KEY_COLS * KEY_ROWS_N;
const KEY_VARIANTS = ["/key.png", "/key 2.png"];
// Region rectangles as % of the register image (tweak to fit the grey keypad).
const SCREEN = { left: "34.5%", top: "38.5%", width: "32.5%", height: "15.5%" };
const KEYS = { left: "25%", top: "59%", width: "50%", height: "34%" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [overflow, setOverflow] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateWorkSystem> | null>(null);
  const [folding, setFolding] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const resolver = useRef<((v: string) => void) | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const label = q.options.find((o) => o.value === value)?.label ?? value;
        playDing();
        await typeLine({ text: `> ${label}`, kind: "item" }, 55);
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

  // Global keys: Enter starts / confirms, arrows scroll the options.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) {
        if (e.key === "Enter") begin();
        return;
      }
      if (pending?.type === "options") {
        const len = pending.q.options.length;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setOptIndex((i) => (i - 1 + len) % len);
          playKey();
          pressRandomKey();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setOptIndex((i) => (i + 1) % len);
          playKey();
          pressRandomKey();
        } else if (e.key === "Enter") {
          e.preventDefault();
          resolvePending(pending.q.options[optIndex].value);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, pending, optIndex]);

  // Measure how much of the receipt has printed past the navbar (locked height).
  useEffect(() => {
    const el = contentRef.current;
    const inner = innerRef.current;
    if (el && inner) setOverflow(Math.max(0, inner.offsetHeight - el.clientHeight));
  }, [lines, typing]);

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

  const lcd = typing?.text ?? (started ? "READY" : "SCROLL OR TYPE TO BEGIN");

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
        {/* Try Blue! sticker — top-right, links to Chambiar */}
        <a
          href="https://www.chambiar.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Try Blue — visit Chambiar"
          onClick={() => setFolding(true)}
          className="fixed right-[3vw] top-[116px] z-40 w-[min(115px,23vw)]"
        >
          <div
            className={`relative aspect-square w-full rotate-[8deg] [container-type:size] ${
              folding ? "sticker-fold" : ""
            }`}
            style={{ filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.25))" }}
          >
            <Image src="/Try Blue!.png" alt="Try Blue" fill sizes="150px" className="object-contain" />
            <div className="absolute inset-0 flex items-center justify-center pl-[6%] pr-[26%]">
              <span className="text-center font-extrabold uppercase leading-[1.05] tracking-tight text-[#103257] text-[16cqw]">
                Try<br />Blue!
              </span>
            </div>
          </div>
        </a>

        {/* Post-it — bottom-left, links to Chambiar */}
        <a
          href="https://www.chambiar.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Try our work engine — visit Chambiar"
          className="fixed bottom-[13vh] left-[3vw] z-40 w-[min(190px,38vw)]"
        >
          <div
            className="relative aspect-square w-full -rotate-[4deg] [container-type:size]"
            style={{ filter: "drop-shadow(0 6px 8px rgba(60,70,90,0.28))" }}
          >
            <Image src="/post it.png" alt="" fill sizes="190px" className="object-contain" />
            <div className="absolute inset-0 flex items-center justify-center px-[15%] pb-[10%] pt-[24%]">
              <span
                className="text-center font-bold leading-[1.1] text-[#103257] text-[16cqw]"
                style={{ fontFamily: "var(--font-hand), cursive" }}
              >
                Like these insights? Try our work engine!
              </span>
            </div>
          </div>
        </a>

        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center px-4 pt-[102px] pb-20">
          {/* Printer slot (pulled up so the bar — not the transparent top — sits by the navbar) */}
          <div
            className="relative z-20 w-[390px] max-w-[90vw]"
            style={{ marginTop: "calc(min(390px, 90vw) * -0.42)" }}
          >
            <Image
              src="/slot.png"
              alt=""
              width={1080}
              height={1080}
              priority
              className="h-auto w-full"
            />
          </div>

          {/* Dispensed receipt — emerges from the slot's black line, in front */}
          <div
            className="relative z-30 w-[86%] max-w-[280px]"
            style={{
              marginTop: "calc(min(390px, 90vw) * -0.49)",
              filter: "drop-shadow(0 18px 30px rgba(60,70,90,0.32))",
            }}
          >
            <div className="receipt-dispense rounded-[20px] bg-white px-5 pt-8 pb-8 font-mono text-[12px] leading-[1.7] text-[#1c1a17]">
              <div className="text-center text-lg font-bold leading-tight tracking-tight text-[#103257]">
                CHAMBIAR&apos;S<br />WORK RECEIPT
              </div>
              <div className="mt-2 text-center font-bold text-[#6a6456]">{interp}</div>

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              <div className="flex justify-between">
                <span>OEI SCORE</span>
                <span className="font-bold">{oei}/100</span>
              </div>

              <div className="my-2 border-t border-solid border-[#cfc8b6]" />
              <div className="text-[#6a6456]">TIME LOST — COORDINATION</div>
              <div className="flex justify-between">
                <span>This week</span>
                <span className="font-bold">{result.hours_lost} hrs</span>
              </div>

              <div className="mt-3 text-[#6a6456]">WHERE YOUR WEEK GOES</div>
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
                  {cat.metrics.map((m) => (
                    <div key={m.label} className="flex justify-between gap-2">
                      <span className="truncate">{m.label}</span>
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
              <div className="flex justify-between text-[15px] font-bold text-[#12a468]">
                <span>TOTAL</span>
                <span>${result.estimated_cost}/wk</span>
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div
                  className="h-10 w-[72%]"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, #1c1a17 0 2px, transparent 2px 4px, #1c1a17 4px 5px, transparent 5px 8px, #1c1a17 8px 10px, transparent 10px 11px, #1c1a17 11px 14px, transparent 14px 16px)",
                  }}
                />
                <div className="mt-1 text-[10px] tracking-[0.25em] text-[#6a6456]">
                  CHAMBIAR.AI — {dateStr}
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

      {/* Receipt paper — grows up from the slot, locks at the navbar */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-[min(332px,36vw)] z-10 w-[min(300px,34vw)] ${
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
          className="receipt-torn-top flex flex-col justify-end overflow-hidden px-5 pt-7 pb-24 font-mono text-[12px] leading-[1.7] text-[#1c1a17]"
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Register machine (sits in front of the paper) */}
      <div
        className={`absolute left-1/2 bottom-0 -translate-x-1/2 z-20 w-[min(880px,96vw)] aspect-[16/9] ${
          launching ? "register-bop" : ""
        }`}
      >
        <Image
          src="/register-v2.png"
          alt=""
          fill
          priority
          className="object-contain pointer-events-none select-none"
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

        {/* LCD screen — where the questions are answered (scroll / type + Enter) */}
        <div className="absolute z-30 flex items-center justify-center px-[2%]" style={SCREEN}>
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
              className={`w-full bg-transparent text-center font-mono text-[clamp(9px,1.5vw,15px)] outline-none ${
                emailError
                  ? "text-[#b91c1c] placeholder-[#b91c1c]"
                  : "text-[#33310f] placeholder-[#6f6a38]"
              }`}
            />
          ) : pending?.type === "options" ? (
            <div
              className="flex w-full items-center justify-between gap-1 font-mono text-[#33310f]"
              onWheel={(e) => {
                const len = pending.q.options.length;
                playKey();
                pressRandomKey();
                setOptIndex((i) => (e.deltaY > 0 ? (i + 1) % len : (i - 1 + len) % len));
              }}
            >
              <button
                onClick={() => {
                  const len = pending.q.options.length;
                  playKey();
                  pressRandomKey();
                  setOptIndex((i) => (i - 1 + len) % len);
                }}
                className="shrink-0 px-1 text-[#5a5620] hover:text-[#33310f]"
                aria-label="Previous"
              >
                ▲
              </button>
              <button
                onClick={() => resolvePending(pending.q.options[optIndex].value)}
                className="min-w-0 flex-1 truncate text-center text-[clamp(9px,1.5vw,15px)]"
                title="Enter to confirm"
              >
                {pending.q.options[optIndex]?.label}
              </button>
              <button
                onClick={() => {
                  const len = pending.q.options.length;
                  playKey();
                  pressRandomKey();
                  setOptIndex((i) => (i + 1) % len);
                }}
                className="shrink-0 px-1 text-[#5a5620] hover:text-[#33310f]"
                aria-label="Next"
              >
                ▼
              </button>
            </div>
          ) : (
            <div className="w-full truncate text-center font-mono text-[clamp(9px,1.5vw,15px)] text-[#33310f]">
              {lcd}
              {started && <span className="animate-pulse">▮</span>}
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
            // Drop the leftmost and rightmost columns (keep empty cells in place).
            if (col === 0 || col === KEY_COLS - 1) return <span key={idx} />;
            const down = pressed === idx;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={keyVariants[idx]}
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

      {/* Pop-up sticker — angled top-left; shrinks 50% once printing starts */}
      <div className="pointer-events-none absolute left-[2vw] top-[88px] z-40 animate-slow-float">
        <div
          className="relative aspect-square w-[min(423px,34.6vw)] origin-top-left transition-transform duration-500 [container-type:size]"
          style={{ transform: `rotate(-10deg) scale(${started ? 0.5 : 1})` }}
        >
          <Image src="/pop up.png" alt="" fill priority sizes="423px" className="object-contain" />
          <div className="absolute inset-0 flex -translate-x-[10px] items-center justify-center px-[19%]">
            <span className="text-center font-extrabold uppercase leading-[1.05] tracking-tight text-white text-[6.5cqw] drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
              Print your receipt!
            </span>
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
    return <div className={`${base} text-center text-lg font-bold tracking-tight`}>{line.text}</div>;
  if (line.kind === "meta")
    return <div className={`${base} text-center text-[#6a6456]`}>{line.text}</div>;
  if (line.kind === "note")
    return <div className={`${base} text-center text-[#8a8577] py-2`}>{line.text}</div>;
  if (line.kind === "q")
    return (
      <div className={`${base} font-bold text-[#103257] mt-1`}>
        {line.text}
        {caret && <span className="animate-pulse">▌</span>}
      </div>
    );
  if (line.kind === "total")
    return (
      <div className={`${base} font-bold text-[#12a468] text-[14px]`}>
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
