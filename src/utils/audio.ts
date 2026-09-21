// Synthetic mechanical shutter sound using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playShutterSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Initial mechanical shutter click
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'triangle';
  clickOsc.frequency.setValueAtTime(320, now);
  clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
  clickGain.gain.setValueAtTime(0.35, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.05);

  // 2. Mirror/Curtain friction noise
  const bufferSize = ctx.sampleRate * 0.06;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
  }
  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.Q.setValueAtTime(1.5, now);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.25, now + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  whiteNoise.start(now + 0.005);
  whiteNoise.stop(now + 0.07);

  // 3. Secondary curtain return click (twin blade mechanical action)
  const returnOsc = ctx.createOscillator();
  const returnGain = ctx.createGain();
  returnOsc.type = 'triangle';
  returnOsc.frequency.setValueAtTime(450, now + 0.08);
  returnOsc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
  returnGain.gain.setValueAtTime(0.2, now + 0.08);
  returnGain.gain.exponentialRampToValueAtTime(0.001, now + 0.125);
  returnOsc.connect(returnGain);
  returnGain.connect(ctx.destination);
  returnOsc.start(now + 0.08);
  returnOsc.stop(now + 0.13);
}
