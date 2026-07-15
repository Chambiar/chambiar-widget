// Procedural sound effects via the Web Audio API — no audio files needed.
// Four voices: key clack (typing), carriage ding (enter), paper crease
// (email), register ka-ching (total reveal). All respect a global mute.

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
}
export function getMuted() {
  return muted;
}
// Call once on a user gesture to unlock audio on iOS/Safari.
export function unlockAudio() {
  ac();
}

function noiseBuffer(c: AudioContext, dur: number): AudioBuffer {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Clacky plastic typewriter/register key: a bright noise tick + low thunk.
export function playKey() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.05);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1900 + Math.random() * 400;
  bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.06);

  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(170, t);
  o.frequency.exponentialRampToValueAtTime(85, t + 0.05);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.exponentialRampToValueAtTime(0.22, t + 0.003);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g2).connect(c.destination);
  o.start(t);
  o.stop(t + 0.07);
}

// Carriage-return bell — the typewriter "ding" on Enter / line advance.
export function playDing() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  [1180, 1770].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    const amp = i === 0 ? 0.28 : 0.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.55);
  });
}

// Paper crease / feed — a filtered noise sweep as the receipt folds.
export function playCrease() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.4);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(3200, t);
  bp.frequency.exponentialRampToValueAtTime(500, t + 0.34);
  bp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.42);
}

// Long paper scroll — the receipt feeding fast as it shoots up.
export function playScroll() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.95);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1100, t);
  bp.frequency.linearRampToValueAtTime(2800, t + 0.9);
  bp.Q.value = 0.5;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
  g.gain.setValueAtTime(0.22, t + 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.92);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 0.95);
}

// Register ka-ching — two-note bell + drawer thunk.
export function playKaching() {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  ([
    [t, 1568],
    [t + 0.1, 2093],
  ] as const).forEach(([tt, f]) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, tt);
    g.gain.exponentialRampToValueAtTime(0.28, tt + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.6);
    o.connect(g).connect(c.destination);
    o.start(tt);
    o.stop(tt + 0.65);
  });
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.setValueAtTime(230, t + 0.26);
  o2.frequency.exponentialRampToValueAtTime(70, t + 0.46);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.0001, t + 0.26);
  g2.gain.exponentialRampToValueAtTime(0.3, t + 0.28);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o2.connect(g2).connect(c.destination);
  o2.start(t + 0.26);
  o2.stop(t + 0.55);
}
