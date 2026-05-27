import { getAudioContext } from './audioContext';

export const playThump = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  // 1. Deep low-frequency oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(10, now + 0.6);
  
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(250, now);
  filter.frequency.exponentialRampToValueAtTime(30, now + 0.6);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.7);
  
  // 2. White noise generator for explosion/crackling shatter
  try {
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.45);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.5);
  } catch (e) {
    console.warn("Explosion noise buffer failed", e);
  }
};

export const playGlassShatter = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Initial sharp crack (highpass filtered noise burst)
  try {
    const noiseLength = 0.15;
    const bufferSize = ctx.sampleRate * noiseLength;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(3200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1600, now + noiseLength);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLength);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + noiseLength + 0.05);
  } catch (e) {
    console.warn("Glass shatter noise failed", e);
  }

  // 2. Base physical impact (low-frequency thud for weight)
  const baseOsc = ctx.createOscillator();
  const baseGain = ctx.createGain();
  baseOsc.type = 'triangle';
  baseOsc.frequency.setValueAtTime(150, now);
  baseOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
  
  baseGain.gain.setValueAtTime(0.18, now);
  baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  
  baseOsc.connect(baseGain);
  baseGain.connect(ctx.destination);
  baseOsc.start(now);
  baseOsc.stop(now + 0.22);

  // 3. Shard clinks (10 cascading high-frequency resonant sine/triangle oscillators)
  const numShards = 10;
  for (let i = 0; i < numShards; i++) {
    const shardDelay = Math.random() * 0.32;
    const shardTime = now + shardDelay;
    
    const freq = 1800 + Math.random() * 3200; // 1800Hz to 5000Hz
    const shardOsc = ctx.createOscillator();
    const shardGain = ctx.createGain();
    
    shardOsc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
    shardOsc.frequency.setValueAtTime(freq, shardTime);
    shardOsc.frequency.exponentialRampToValueAtTime(freq * 0.82, shardTime + 0.15);
    
    shardGain.gain.setValueAtTime(0, shardTime);
    shardGain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.06, shardTime + 0.005);
    shardGain.gain.exponentialRampToValueAtTime(0.001, shardTime + 0.08 + Math.random() * 0.12);
    
    shardOsc.connect(shardGain);
    shardGain.connect(ctx.destination);
    
    shardOsc.start(shardTime);
    shardOsc.stop(shardTime + 0.25);
  }
};

export const playLegendaryChime = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  // Play detuned triumphant 80s arcade ascending arpeggio
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
  notes.forEach((freq, index) => {
    const noteTime = now + index * 0.065;
    const duration = 0.5;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, noteTime);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.005, noteTime); // detune slightly for rich chorus
    
    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(noteTime);
    osc2.start(noteTime);
    osc1.stop(noteTime + duration + 0.05);
    osc2.stop(noteTime + duration + 0.05);
  });

  // Glittering final decay chime
  const delayTime = now + notes.length * 0.065;
  const oscFinal = ctx.createOscillator();
  const gainFinal = ctx.createGain();
  oscFinal.type = 'sine';
  oscFinal.frequency.setValueAtTime(2093.00, delayTime);
  gainFinal.gain.setValueAtTime(0.15, delayTime);
  gainFinal.gain.exponentialRampToValueAtTime(0.001, delayTime + 1.2);
  oscFinal.connect(gainFinal);
  gainFinal.connect(ctx.destination);
  oscFinal.start(delayTime);
  oscFinal.stop(delayTime + 1.3);
};

export const playFlameWhoosh = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  try {
    const duration = 1.5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.4); // Sweeps up
    filter.frequency.exponentialRampToValueAtTime(120, now + duration); // Sweeps down
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3); // Exciting attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Fade out
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + duration + 0.05);
  } catch (e) {
    console.warn("Flame whoosh sound failed", e);
  }
};
