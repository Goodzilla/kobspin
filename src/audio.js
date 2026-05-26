class AudioEngine {
  constructor() {
    this.ctx = null;
    this.riserOsc = null;
    this.riserGain = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTick() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Triangle wave gives a softer, wooden mechanical peg-clicking noise
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playLanding() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Ascending arpeggio chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const durations = [0.12, 0.12, 0.12, 0.45];
    const delays = [0, 0.09, 0.18, 0.27];
    
    notes.forEach((freq, index) => {
      const noteTime = now + delays[index];
      const duration = durations[index];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Combine sine with a tiny bit of triangle for warmth
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.05);
    });
  }

  playFanfare() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Triumphant brass/trumpet arpeggio: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const delays = [0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48];
    const durations = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.8];
    
    notes.forEach((freq, index) => {
      const startTime = now + delays[index];
      const duration = durations[index];
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 1.008, startTime); // Slight detune for brass chorus
      
      // LFO Vibrato (6Hz modulation)
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
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
      gain.connect(this.ctx.destination);
      
      vibrato.start(startTime);
      osc1.start(startTime);
      osc2.start(startTime);
      
      vibrato.stop(startTime + duration + 0.05);
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    });
  }

  playTensionRiser() {
    // Removed buildup sound
  }

  stopTensionRiser() {
    // Removed buildup sound
  }

  playThump() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    // 1. Deep low-frequency oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.6);
    
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + 0.6);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.7);
    
    // 2. White noise generator for explosion/crackling shatter
    try {
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.45);
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      noise.start(now);
      noise.stop(now + 0.5);
    } catch (e) {
      console.warn("Explosion noise buffer failed", e);
    }
  }

  playGlassShatter() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Initial sharp crack (highpass filtered noise burst)
    try {
      const noiseLength = 0.15;
      const bufferSize = this.ctx.sampleRate * noiseLength;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(3200, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(1600, now + noiseLength);
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLength);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      noise.start(now);
      noise.stop(now + noiseLength + 0.05);
    } catch (e) {
      console.warn("Glass shatter noise failed", e);
    }

    // 2. Base physical impact (low-frequency thud for weight)
    const baseOsc = this.ctx.createOscillator();
    const baseGain = this.ctx.createGain();
    baseOsc.type = 'triangle';
    baseOsc.frequency.setValueAtTime(150, now);
    baseOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    
    baseGain.gain.setValueAtTime(0.18, now);
    baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    baseOsc.connect(baseGain);
    baseGain.connect(this.ctx.destination);
    baseOsc.start(now);
    baseOsc.stop(now + 0.22);

    // 3. Shard clinks (10 cascading high-frequency resonant sine/triangle oscillators)
    const numShards = 10;
    for (let i = 0; i < numShards; i++) {
      const shardDelay = Math.random() * 0.32;
      const shardTime = now + shardDelay;
      
      const freq = 1800 + Math.random() * 3200; // 1800Hz to 5000Hz
      const shardOsc = this.ctx.createOscillator();
      const shardGain = this.ctx.createGain();
      
      shardOsc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
      shardOsc.frequency.setValueAtTime(freq, shardTime);
      shardOsc.frequency.exponentialRampToValueAtTime(freq * 0.82, shardTime + 0.15);
      
      shardGain.gain.setValueAtTime(0, shardTime);
      shardGain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.06, shardTime + 0.005);
      shardGain.gain.exponentialRampToValueAtTime(0.001, shardTime + 0.08 + Math.random() * 0.12);
      
      shardOsc.connect(shardGain);
      shardGain.connect(this.ctx.destination);
      
      shardOsc.start(shardTime);
      shardOsc.stop(shardTime + 0.25);
    }
  }

  playLegendaryChime() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    // Play detuned triumphant 80s arcade ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, index) => {
      const noteTime = now + index * 0.065;
      const duration = 0.5;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, noteTime);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.005, noteTime); // detune slightly for rich chorus
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc1.start(noteTime);
      osc2.start(noteTime);
      osc1.stop(noteTime + duration + 0.05);
      osc2.stop(noteTime + duration + 0.05);
    });

    // Glittering final decay chime
    const delayTime = now + notes.length * 0.065;
    const oscFinal = this.ctx.createOscillator();
    const gainFinal = this.ctx.createGain();
    oscFinal.type = 'sine';
    oscFinal.frequency.setValueAtTime(2093.00, delayTime);
    gainFinal.gain.setValueAtTime(0.15, delayTime);
    gainFinal.gain.exponentialRampToValueAtTime(0.001, delayTime + 1.2);
    oscFinal.connect(gainFinal);
    gainFinal.connect(this.ctx.destination);
    oscFinal.start(delayTime);
    oscFinal.stop(delayTime + 1.3);
  }

  playFlameWhoosh() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    try {
      const duration = 1.5;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.4); // Sweeps up
      filter.frequency.exponentialRampToValueAtTime(120, now + duration); // Sweeps down
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.3); // Exciting attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Fade out
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noise.start(now);
      noise.stop(now + duration + 0.05);
    } catch (e) {
      console.warn("Flame whoosh sound failed", e);
    }
  }

  playChestOpen() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    // 1. Creaky wood/hinge friction (triangle frequency sweep upwards with minor pitch changes)
    const creakOsc = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creakOsc.type = 'triangle';
    creakOsc.frequency.setValueAtTime(250, now);
    creakOsc.frequency.exponentialRampToValueAtTime(720, now + 0.35);
    
    creakGain.gain.setValueAtTime(0, now);
    creakGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    creakOsc.connect(creakGain);
    creakGain.connect(this.ctx.destination);
    creakOsc.start(now);
    creakOsc.stop(now + 0.45);

    // 2. Heavy lid slamming open (deep low thump)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sawtooth';
    thudOsc.frequency.setValueAtTime(95, now + 0.2);
    thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.65);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now + 0.2);
    
    thudGain.gain.setValueAtTime(0, now + 0.2);
    thudGain.gain.linearRampToValueAtTime(0.24, now + 0.22);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    
    thudOsc.connect(filter);
    filter.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    
    thudOsc.start(now + 0.2);
    thudOsc.stop(now + 0.7);

    // 3. Magical burst shimmer (cascading high frequency sine wave chimes)
    const shimmerCount = 5;
    for (let i = 0; i < shimmerCount; i++) {
      const delay = 0.2 + i * 0.05;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(950 + i * 200, now + delay);
      
      chimeGain.gain.setValueAtTime(0, now + delay);
      chimeGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      
      chimeOsc.start(now + delay);
      chimeOsc.stop(now + delay + 0.25);
    }
  }

  playCrateLatch() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Heavy metallic latch click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
    
    // High metal snap/click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(2200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    
    clickGain.gain.setValueAtTime(0.1, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);
  }

  playCrateImpact() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Heavy metallic thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.4);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  playRaceBell() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Classic high-pitched double bell ding (ding ding!)
    const playDing = (delay) => {
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1567.98, t); // G6 note
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    };
    
    playDing(0);
    playDing(0.12);
  }

  playHorseNeigh() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const duration = 0.8;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    
    // Tremolo/Pitch modulation for the whinny vibrato
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
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
    gain.connect(this.ctx.destination);
    
    mod.start(now);
    osc.start(now);
    mod.stop(now + duration + 0.05);
    osc.stop(now + duration + 0.05);
  }

  playHoofbeat() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Very low bandpass filtered wood block sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audio = new AudioEngine();
