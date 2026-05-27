import { getAudioContext } from './audioContext';

export const playTick = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Triangle wave gives a softer, wooden mechanical peg-clicking noise
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
  
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.06);
};

export const playLanding = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Ascending arpeggio chime (C5 -> E5 -> G5 -> C6)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const durations = [0.12, 0.12, 0.12, 0.45];
  const delays = [0, 0.09, 0.18, 0.27];
  
  notes.forEach((freq, index) => {
    const noteTime = now + delays[index];
    const duration = durations[index];
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Combine sine with a tiny bit of triangle for warmth
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);
    
    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(noteTime);
    osc.stop(noteTime + duration + 0.05);
  });
};

export const playFanfare = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Triumphant brass/trumpet arpeggio: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
  const delays = [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48];
  const durations = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.8];
  
  notes.forEach((freq, index) => {
    const startTime = now + delays[index];
    const duration = durations[index];
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 1.008, startTime); // Slight detune for brass chorus
    
    // LFO Vibrato (6Hz modulation)
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 6.2;
    vibratoGain.gain.value = freq * 0.007;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);
    
    // Brassy filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, startTime);
    filter.frequency.exponentialRampToValueAtTime(1800, startTime + 0.04); // Fast attack
    filter.frequency.exponentialRampToValueAtTime(700, startTime + duration); // Slow decay
    
    // Amp Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.14, startTime + 0.03); // Punchy attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    vibrato.start(startTime);
    osc1.start(startTime);
    osc2.start(startTime);
    
    vibrato.stop(startTime + duration + 0.05);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  });
};

export const playTensionRiser = () => {
  // Removed buildup sound
};

export const stopTensionRiser = () => {
  // Removed buildup sound
};
