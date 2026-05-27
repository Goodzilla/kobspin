import { getAudioContext } from './audioContext';

export const playChestOpen = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  // 1. Creaky wood/hinge friction (triangle frequency sweep upwards with minor pitch changes)
  const creakOsc = ctx.createOscillator();
  const creakGain = ctx.createGain();
  creakOsc.type = 'triangle';
  creakOsc.frequency.setValueAtTime(250, now);
  creakOsc.frequency.exponentialRampToValueAtTime(720, now + 0.35);
  
  creakGain.gain.setValueAtTime(0, now);
  creakGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
  creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  
  creakOsc.connect(creakGain);
  creakGain.connect(ctx.destination);
  creakOsc.start(now);
  creakOsc.stop(now + 0.45);

  // 2. Heavy lid slamming open (deep low thump)
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = 'sawtooth';
  thudOsc.frequency.setValueAtTime(95, now + 0.2);
  thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.65);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, now + 0.2);
  
  thudGain.gain.setValueAtTime(0, now + 0.2);
  thudGain.gain.linearRampToValueAtTime(0.24, now + 0.22);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  
  thudOsc.connect(filter);
  filter.connect(thudGain);
  thudGain.connect(ctx.destination);
  
  thudOsc.start(now + 0.2);
  thudOsc.stop(now + 0.7);

  // 3. Magical burst shimmer (cascading high frequency sine wave chimes)
  const shimmerCount = 5;
  for (let i = 0; i < shimmerCount; i++) {
    const delay = 0.2 + i * 0.05;
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(950 + i * 200, now + delay);
    
    chimeGain.gain.setValueAtTime(0, now + delay);
    chimeGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.02);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
    
    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    
    chimeOsc.start(now + delay);
    chimeOsc.stop(now + delay + 0.25);
  }
};

export const playCrateLatch = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  // Heavy metallic latch click
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
  
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
  
  // High metal snap/click
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'sine';
  clickOsc.frequency.setValueAtTime(2200, now);
  clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
  
  clickGain.gain.setValueAtTime(0.1, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.06);
};

export const playCrateImpact = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  // Heavy metallic thud
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(10, now + 0.4);
  
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, now);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.45);
};
