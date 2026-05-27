import { getAudioContext } from './audioContext';

export const playRaceBell = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  // Classic high-pitched double bell ding (ding ding!)
  const playDing = (delay) => {
    const t = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1567.98, t); // G6 note
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  };
  
  playDing(0);
  playDing(0.12);
};

export const playHorseNeigh = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const duration = 0.8;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, now);
  
  // Tremolo/Pitch modulation for the whinny vibrato
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  mod.frequency.setValueAtTime(25, now); // Fast modulation (25Hz)
  modGain.gain.setValueAtTime(60, now); // Amplitude of pitch modulation
  
  // Sweep pitch down over time
  osc.frequency.exponentialRampToValueAtTime(350, now + duration);
  modGain.gain.exponentialRampToValueAtTime(10, now + duration);
  
  mod.connect(modGain);
  modGain.connect(osc.frequency);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  mod.start(now);
  osc.start(now);
  mod.stop(now + duration + 0.05);
  osc.stop(now + duration + 0.05);
};

export const playHoofbeat = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Very low bandpass filtered wood block sound
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
  
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.05);
};
