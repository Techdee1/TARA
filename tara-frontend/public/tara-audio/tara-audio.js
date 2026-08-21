/**
 * TaraAudio — dependency-free, synthesized sound effects for TARA.
 *
 * Every sound here is generated live with the Web Audio API — oscillators
 * and gain envelopes only. No audio files, no third-party sound libraries,
 * so there is nothing to license or attribute in a public hackathon repo.
 *
 * Plain script on purpose (no import/export syntax): this file can be
 * opened directly as a classic <script> in the demo harness (works over
 * file://, no dev server or module resolution needed), and it can equally
 * be pulled into the Vite app with `import './lib/tara-audio.js'` — the
 * import just runs this file for its side effect of setting
 * `window.TaraAudio`, which the rest of the app then calls into.
 *
 * Usage:
 *   TaraAudio.init()              // call once, inside a user-gesture handler
 *   TaraAudio.setVolume(0.5)      // 0–1, defaults to a demo-room-safe 0.35
 *   TaraAudio.playReveal()
 *   TaraAudio.playAlert()
 *   TaraAudio.playVerifiedTick()
 *   TaraAudio.playVerdictStamp()
 *   TaraAudio.playPop()
 */
(function () {
  'use strict';

  let ctx = null;
  let masterGain = null;
  const DEFAULT_VOLUME = 0.35; // modest by default — won't blow out laptop speakers in a demo room

  /**
   * Lazily creates the shared AudioContext and master gain node, and
   * resumes the context if it's suspended (browsers require an audio
   * context to be created/resumed from inside a user-gesture handler, e.g.
   * the first click after page load — calling init() from a click handler
   * satisfies that).
   */
  function init() {
    if (!ctx) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return; // Web Audio unsupported — every play* call below no-ops safely
      ctx = new AudioContextCtor();
      masterGain = ctx.createGain();
      masterGain.gain.value = DEFAULT_VOLUME;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /** Scales the shared master gain node. Clamped to [0, 1]. */
  function setVolume(value) {
    if (!masterGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    masterGain.gain.setTargetAtTime(clamped, ctx.currentTime, 0.01);
  }

  // Every play* method below no-ops if init() hasn't run yet (or Web Audio
  // isn't supported), rather than throwing — sound is a nice-to-have, it
  // should never be able to break the app it's wired into.
  function ready() {
    if (!ctx || !masterGain) {
      // Best-effort: try to init anyway (covers callers that forgot to call
      // init() from a gesture handler — this may silently fail to resume a
      // suspended context until the next real user gesture, which is a
      // browser policy we can't override, not a bug in this file).
      init();
    }
    return !!ctx;
  }

  /**
   * Creates an oscillator + its own gain node, both routed through the
   * shared master gain, and schedules them to stop/disconnect after
   * `stopAt` (absolute AudioContext time) — this is the cleanup pattern
   * every play* method below reuses so a long demo loop never leaks nodes.
   */
  function makeVoice(type, freq) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    gain.connect(masterGain);
    return { osc, gain };
  }

  function stopAndCleanup(osc, gain, at) {
    osc.stop(at);
    // onended fires after the node has actually stopped — disconnect there
    // rather than immediately, so nothing gets cut off mid-decay.
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* already disconnected — fine */
      }
    };
  }

  // ── playReveal() — the "is this cluster clean or coordinated" sting ─────
  // Layer A: a rising pad (220Hz -> 440Hz, one octave) over 1.3s reads as
  // neutral/investigative — "checking...". Layer B lands right as the pad
  // resolves: two low oscillators a tritone apart (an unsettling interval,
  // no consonant harmony) in a percussive envelope — "...and here's what
  // we found." Restrained on purpose: no pitch-bend siren, no cartoon stab.
  function playReveal() {
    if (!ready()) return;
    const t0 = ctx.currentTime;

    // Layer A — rising pad, ~1.3s, gentle attack/release so it has no click.
    const pad = makeVoice('triangle', 220);
    pad.osc.frequency.exponentialRampToValueAtTime(440, t0 + 1.3);
    pad.gain.gain.setValueAtTime(0.0001, t0);
    pad.gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.25); // attack
    pad.gain.gain.setValueAtTime(0.5, t0 + 1.05);
    pad.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.35); // release into the stab
    pad.osc.start(t0);
    stopAndCleanup(pad.osc, pad.gain, t0 + 1.4);

    // Layer B — dissonant two-note stab (tritone: 110Hz vs 155.56Hz), short
    // percussive envelope, timed to land as the pad fades out.
    const stabAt = t0 + 1.3;
    const stabDur = 1.1; // total ~2.4s for the whole sting, within the 2–3s spec
    [110, 155.56].forEach((freq, i) => {
      const stab = makeVoice('sawtooth', freq);
      stab.gain.gain.setValueAtTime(0.0001, stabAt);
      stab.gain.gain.exponentialRampToValueAtTime(0.35, stabAt + 0.02); // fast percussive attack
      stab.gain.gain.exponentialRampToValueAtTime(0.0001, stabAt + stabDur);
      stab.osc.start(stabAt + i * 0.01); // 10ms offset between the two notes softens the onset
      stopAndCleanup(stab.osc, stab.gain, stabAt + stabDur + 0.05);
    });
  }

  // ── playAlert() — reusable UI alert, "ping-ping-ping" ────────────────────
  // Three quick pulses, 900Hz / 906Hz / 900Hz — the middle pulse is
  // detuned by 6Hz (a few Hz, per spec) so the triplet reads as synthetic/
  // digital rather than a plain repeated beep. Short envelopes (~90ms per
  // pulse) keep it snappy rather than alarm-like, and it's cheap enough to
  // play on every flagged-cluster event without fatigue.
  function playAlert() {
    if (!ready()) return;
    const t0 = ctx.currentTime;
    const pulseFreqs = [900, 906, 900]; // middle pulse detuned ~6Hz for a synthetic edge
    const pulseGap = 0.14; // seconds between pulse onsets

    pulseFreqs.forEach((freq, i) => {
      const t = t0 + i * pulseGap;
      const voice = makeVoice('sine', freq);
      voice.gain.gain.setValueAtTime(0.0001, t);
      voice.gain.gain.exponentialRampToValueAtTime(0.4, t + 0.012); // snappy attack
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); // short decay — no siren tail
      voice.osc.start(t);
      stopAndCleanup(voice.osc, voice.gain, t + 0.1);
    });
  }

  // ── playVerifiedTick() — quiet ambient tick for routine events ──────────
  // A single high (1800Hz) sine with a very fast envelope and low gain —
  // deliberately unobtrusive, meant to sit in the background (e.g. a node
  // quietly landing in the graph after a clean verification) rather than
  // draw attention like playAlert() does.
  function playVerifiedTick() {
    if (!ready()) return;
    const t0 = ctx.currentTime;
    const voice = makeVoice('sine', 1800);
    voice.gain.gain.setValueAtTime(0.0001, t0);
    voice.gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.005); // near-instant attack — reads as a "tick"
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13); // ~130ms decay
    voice.osc.start(t0);
    stopAndCleanup(voice.osc, voice.gain, t0 + 0.15);
  }

  // ── playVerdictStamp() — closing beat when a trust verdict lands ────────
  // One low (100Hz) triangle tone through a lowpass filter, long release
  // (~1s) — meant to feel like a soft mallet hit landing with weight, the
  // audio equivalent of a rubber stamp coming down. No harmonics above the
  // filter cutoff, so it stays warm rather than buzzy.
  function playVerdictStamp() {
    if (!ready()) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t0);
    osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.9); // slight downward drift adds "weight"

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t0); // strips harmonics above the fundamental — keeps it a "thud", not a buzz
    filter.Q.setValueAtTime(0.7, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.6, t0 + 0.015); // fast, firm attack — the "impact"
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0); // slow release — the "resonance"

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    stopAndCleanup(osc, gain, t0 + 1.05);
  }

  // ── playPop() — short punchy "pop" for things appearing on screen ───────
  // A single oscillator that snaps upward in pitch (500Hz -> 1050Hz) over
  // the first ~40ms — that fast upward pitch-bend is what reads as a "pop"
  // rather than a flat beep — immediately followed by a fast gain decay
  // over the rest of the ~180ms so it's crisp and short, not ringing.
  function playPop() {
    if (!ready()) return;
    const t0 = ctx.currentTime;
    const voice = makeVoice('triangle', 500);

    // Pitch snap: 500Hz -> 1050Hz in the first 40ms.
    voice.osc.frequency.setValueAtTime(500, t0);
    voice.osc.frequency.exponentialRampToValueAtTime(1050, t0 + 0.04);

    // Gain: quick attack, then a fast decay over the remaining ~140ms.
    voice.gain.gain.setValueAtTime(0.0001, t0);
    voice.gain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.015);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

    voice.osc.start(t0);
    stopAndCleanup(voice.osc, voice.gain, t0 + 0.2);
  }

  window.TaraAudio = {
    init,
    setVolume,
    playReveal,
    playAlert,
    playVerifiedTick,
    playVerdictStamp,
    playPop,
  };
})();
