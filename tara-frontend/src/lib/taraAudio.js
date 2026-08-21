// TaraAudio — dependency-free, synthesized sound effects for the live app.
//
// This is the same engine as public/tara-audio/tara-audio.js (kept there,
// unchanged, as a standalone file the team can open directly to audition
// and retune sounds without running the app) — ported here as a proper ES
// module so the rest of the React app can `import` it normally. Every
// sound is generated live with oscillators and gain envelopes; nothing is
// an audio file, so there's nothing to license.

let ctx = null
let masterGain = null
const DEFAULT_VOLUME = 0.35 // modest by default — won't blow out laptop speakers in a demo room

function init() {
  if (!ctx) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return
    ctx = new AudioContextCtor()
    masterGain = ctx.createGain()
    masterGain.gain.value = DEFAULT_VOLUME
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
}

function setVolume(value) {
  if (!masterGain) return
  const clamped = Math.max(0, Math.min(1, value))
  masterGain.gain.setTargetAtTime(clamped, ctx.currentTime, 0.01)
}

function ready() {
  if (!ctx || !masterGain) init()
  return !!ctx
}

function makeVoice(type, freq) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  osc.connect(gain)
  gain.connect(masterGain)
  return { osc, gain }
}

function stopAndCleanup(osc, gain, at) {
  osc.stop(at)
  osc.onended = () => {
    try {
      osc.disconnect()
      gain.disconnect()
    } catch {
      /* already disconnected */
    }
  }
}

// Rising pad (220Hz -> 440Hz over 1.3s, neutral/investigative) resolving
// into a tritone stab (110Hz vs 155.56Hz, dissonant on purpose) — the
// "checking... and here's what we found" sting for opening a verdict.
function playReveal() {
  if (!ready()) return
  const t0 = ctx.currentTime

  const pad = makeVoice('triangle', 220)
  pad.osc.frequency.exponentialRampToValueAtTime(440, t0 + 1.3)
  pad.gain.gain.setValueAtTime(0.0001, t0)
  pad.gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.25)
  pad.gain.gain.setValueAtTime(0.5, t0 + 1.05)
  pad.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.35)
  pad.osc.start(t0)
  stopAndCleanup(pad.osc, pad.gain, t0 + 1.4)

  const stabAt = t0 + 1.3
  const stabDur = 1.1
  ;[110, 155.56].forEach((freq, i) => {
    const stab = makeVoice('sawtooth', freq)
    stab.gain.gain.setValueAtTime(0.0001, stabAt)
    stab.gain.gain.exponentialRampToValueAtTime(0.35, stabAt + 0.02)
    stab.gain.gain.exponentialRampToValueAtTime(0.0001, stabAt + stabDur)
    stab.osc.start(stabAt + i * 0.01)
    stopAndCleanup(stab.osc, stab.gain, stabAt + stabDur + 0.05)
  })
}

// Three quick pulses (900/906/900Hz, middle one detuned) — the reusable
// "something needs your attention" alert for a flagged-cluster banner.
function playAlert() {
  if (!ready()) return
  const t0 = ctx.currentTime
  const pulseFreqs = [900, 906, 900]
  const pulseGap = 0.14

  pulseFreqs.forEach((freq, i) => {
    const t = t0 + i * pulseGap
    const voice = makeVoice('sine', freq)
    voice.gain.gain.setValueAtTime(0.0001, t)
    voice.gain.gain.exponentialRampToValueAtTime(0.4, t + 0.012)
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    voice.osc.start(t)
    stopAndCleanup(voice.osc, voice.gain, t + 0.1)
  })
}

// A single quiet 1800Hz tick — routine/ambient confirmation, meant to sit
// in the background rather than draw attention.
function playVerifiedTick() {
  if (!ready()) return
  const t0 = ctx.currentTime
  const voice = makeVoice('sine', 1800)
  voice.gain.gain.setValueAtTime(0.0001, t0)
  voice.gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.005)
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.13)
  voice.osc.start(t0)
  stopAndCleanup(voice.osc, voice.gain, t0 + 0.15)
}

// A low (100Hz), filtered, long-release tone — the "verdict has landed"
// closing beat, like a soft mallet hit.
function playVerdictStamp() {
  if (!ready()) return
  const t0 = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(100, t0)
  osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.9)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(300, t0)
  filter.Q.setValueAtTime(0.7, t0)

  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.6, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)
  osc.start(t0)
  stopAndCleanup(osc, gain, t0 + 1.05)
}

// A fast upward pitch-snap (500Hz -> 1050Hz in ~40ms) then a fast decay —
// the "something just appeared" pop, for a node landing in the graph or a
// panel popping into view.
function playPop() {
  if (!ready()) return
  const t0 = ctx.currentTime
  const voice = makeVoice('triangle', 500)
  voice.osc.frequency.setValueAtTime(500, t0)
  voice.osc.frequency.exponentialRampToValueAtTime(1050, t0 + 0.04)
  voice.gain.gain.setValueAtTime(0.0001, t0)
  voice.gain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.015)
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18)
  voice.osc.start(t0)
  stopAndCleanup(voice.osc, voice.gain, t0 + 0.2)
}

export const taraAudio = {
  init,
  setVolume,
  playReveal,
  playAlert,
  playVerifiedTick,
  playVerdictStamp,
  playPop,
}

export default taraAudio
