export function run() {
  const canvas = document.querySelector('.canvas');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Apply theme
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = './styles/themes/thx.css';
  document.head.appendChild(theme);

  // Set frequency values in control panel
  const minFreqElmnt = document.getElementById('minFreq');
  const maxFreqElmnt = document.getElementById('maxFreq');
  const minFreqResetBtn = document.getElementById('minFreqReset');
  const maxFreqResetBtn = document.getElementById('maxFreqReset');

  minFreqElmnt.value = 37.5;
  maxFreqElmnt.value = 1800;
  minFreqElmnt.disabled = true;
  maxFreqElmnt.disabled = true;
  minFreqResetBtn.disabled = true;
  maxFreqResetBtn.disabled = true;

  // Timing constants (in seconds)
  const INITIAL_HOLD = 3;   // initial chaotic cluster hold
  const SWEEP_TIME   = 6.0;    // glissando duration
  const TARGET_HOLD  = 3.5;    // final chord hold
  const DECAY_TIME   = 6.0;    // fade-out duration

  const NUM_OSCILLATORS = 30;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1, ctx.currentTime);
  masterGain.connect(ctx.destination);

  // Create reverb effect
  const convolver = ctx.createConvolver();
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 2.25; // Reverb blend
  convolver.connect(reverbGain).connect(ctx.destination);
  convolver.buffer = createImpulse();

  // Lowpass filter to make it feel like it's opening
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(200, ctx.currentTime);
  lowpass.frequency.linearRampToValueAtTime(16000, ctx.currentTime + INITIAL_HOLD + SWEEP_TIME);
  masterGain.connect(lowpass).connect(convolver);

  // Final Pythagorean‑tuned target frequencies for 30 voices
  const targetFrequencies = [
    1800.0,1800.0,1800.0,
    1500.0,1500.0,
    1200.0,1200.0,1200.0,1200.0,
    900.0,900.0,900.0,900.0,
    600.0,600.0,600.0,
    300.0,300.0,300.0,300.0,
    150.0,150.0,150.0,150.0,
    75.0,75.0,75.0,
    37.5,37.5,37.5
  ];

  // Create and start oscillators
  for (let i = 0; i < NUM_OSCILLATORS; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan  = ctx.createStereoPanner();

    // Initial random starting frequency for THX Deep Note cluster
    const initialFreq = 160 + Math.random() * 200; // 160–360 Hz
    osc.frequency.setValueAtTime(initialFreq, ctx.currentTime);

    // Determine target frequency with slight detune for richness
    const targetFreq = targetFrequencies[i] * (1 + (Math.random() - 0.5) * 0.005);

    // Linear glissando from initial cluster to final chord
    osc.frequency.setValueAtTime(initialFreq, ctx.currentTime + INITIAL_HOLD);
    osc.frequency.linearRampToValueAtTime(
      targetFreq,
      ctx.currentTime + INITIAL_HOLD + SWEEP_TIME
    );

    // Adjust gain based on target frequency (low = louder, high = softer)
    const maxGain = 0.2;
    const minGain = 0.05;
    const freqScale = (1 / targetFreq);
    const scaledGain = Math.min(maxGain, Math.max(minGain, freqScale * 20));

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(scaledGain, ctx.currentTime + INITIAL_HOLD);
    gain.gain.setValueAtTime(scaledGain, ctx.currentTime + INITIAL_HOLD + SWEEP_TIME + TARGET_HOLD);
    gain.gain.linearRampToValueAtTime(
      0,
      ctx.currentTime + INITIAL_HOLD + SWEEP_TIME + TARGET_HOLD + DECAY_TIME
    );

    // Stereo spread
    pan.pan.setValueAtTime((Math.random() * 2 - 1), ctx.currentTime);

    osc.connect(gain).connect(pan).connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + INITIAL_HOLD + SWEEP_TIME + TARGET_HOLD + DECAY_TIME);
  }

  canvas.addEventListener('mousedown', resumeContext);
  canvas.addEventListener('touchstart', resumeContext);

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

  // Resume on first interaction
  function resumeContext() {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

}
