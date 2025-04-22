export function run(minFreq = 40, maxFreq = 1600) {
  const canvas = document.querySelector('.canvas');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Apply theme
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = './styles/themes/thx.css';
  document.head.appendChild(theme);

  const NUM_OSCILLATORS = 32;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const convolver = ctx.createConvolver();
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.3; // subtle reverb blend
  convolver.connect(reverbGain).connect(ctx.destination);

  // Generate simple impulse for reverb
  function createImpulse(seconds = 3, decay = 3) {
    const rate = ctx.sampleRate;
    const length = rate * seconds;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }
  convolver.buffer = createImpulse();

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(200, ctx.currentTime);
  lowpass.frequency.linearRampToValueAtTime(16000, ctx.currentTime + 15);
  masterGain.connect(lowpass).connect(convolver);

  const targetFrequencies = [261.63, 329.63, 392.00];

  // Random helper to pick a target freq from the chord
  const pickTargetFreq = () =>
    targetFrequencies[Math.floor(Math.random() * targetFrequencies.length)];

  // Create and start oscillators
  for (let i = 0; i < NUM_OSCILLATORS; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    // Super low starting point for THX-like growl
    const startFreq = minFreq + Math.random() * 80;
    const targetFreq = pickTargetFreq() * (1 + (Math.random() - 0.5) * 0.02); // slight detune

    // Add rich texture
    const types = ['sawtooth', 'square', 'triangle', 'sine'];
    osc.type = types[Math.floor(Math.random() * types.length)];
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);

    // Glide with exponential or cubic feel using multiple ramps
    osc.frequency.exponentialRampToValueAtTime(targetFreq * 0.6, ctx.currentTime + 8);
    osc.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 15);

    // Optional subtle LFO (modulation)
    if (Math.random() < 0.4) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.3, ctx.currentTime);
      lfoGain.gain.setValueAtTime(2 + Math.random() * 8, ctx.currentTime);
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start();
      lfo.stop(ctx.currentTime + 20);
    }

    // Volume fade-in
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1 / NUM_OSCILLATORS, ctx.currentTime + 10);

    // Stereo spread
    pan.pan.setValueAtTime((Math.random() * 2 - 1), ctx.currentTime);

    osc.connect(gain).connect(pan).connect(masterGain);
    osc.start();

    // Fade out
    setTimeout(() => {
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 2);
      osc.stop(now + 2);
    }, 19500);
  }

  // Dynamic low drones with slow glide
  const dynamicLowFreqs = [55, 65, 75, 85];
  dynamicLowFreqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const type = ['sine', 'triangle', 'square'][Math.floor(Math.random() * 3)];

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freq + Math.random() * 10, ctx.currentTime + 15);

    // Fade in gain over first 10 seconds
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 10);

    pan.pan.setValueAtTime((Math.random() * 2 - 1), ctx.currentTime);

    osc.connect(gain).connect(pan).connect(masterGain);
    osc.start();

    // Fade out after 19.5 seconds
    setTimeout(() => {
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 2);
      osc.stop(now + 2);
    }, 19500);
  });

  // Dynamic high shimmer tones with subtle movement and quieter volume
  const dynamicHighFreqs = [1000, 1200, 1400, 1600];
  dynamicHighFreqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = ['triangle', 'sine', 'square'][Math.floor(Math.random() * 3)];
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freq - Math.random() * 100, ctx.currentTime + 15);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 20);

    pan.pan.setValueAtTime((Math.random() * 2 - 1), ctx.currentTime);

    osc.connect(gain).connect(pan).connect(masterGain);
    osc.start();

    setTimeout(() => {
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 2);
      osc.stop(now + 2);
    }, 19500);
  });

  // Resume on first interaction
  function resumeContext() {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  canvas.addEventListener('mousedown', resumeContext);
  canvas.addEventListener('touchstart', resumeContext);
}
