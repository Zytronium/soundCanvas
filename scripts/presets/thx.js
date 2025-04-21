export function run(minFreq = 200, maxFreq = 1200) {
  const canvas = document.querySelector('.canvas');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Apply theme
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = './styles/themes/thx.css';
  document.head.appendChild(theme);

  const NUM_OSCILLATORS = 30;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.5; // Set starting volume
  masterGain.connect(ctx.destination);

  const targetFrequencies = [
    261.63,
    329.63,
    392.00
  ];

  // Containers for future access if needed
  const oscillators = [];
  const gains = [];

  // Random helper to pick a target freq from the chord
  const pickTargetFreq = () =>
    targetFrequencies[Math.floor(Math.random() * targetFrequencies.length)];

  // Create and start oscillators
  for (let i = 0; i < NUM_OSCILLATORS; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Start with random low frequency
    const startFreq = minFreq + Math.random() * (maxFreq - minFreq) * 0.3;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);

    // Use a mix of waveforms for richness
    osc.type = ['sine', 'square', 'sawtooth', 'triangle'][i % 4];

    // Glide up over time
    const glideTime = 6 + Math.random() * 2; // 6-8 seconds glide
    const targetFreq = pickTargetFreq();
    osc.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + glideTime);

    // Volume ramp-in for cinematic effect
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1 / NUM_OSCILLATORS, ctx.currentTime + 4); // soft blend

    osc.connect(gain).connect(masterGain);
    osc.start();

    // Sustain — don’t stop yet
    // Optionally: osc.stop(ctx.currentTime + 10); // if you want it to end later

    oscillators.push(osc);
    gains.push(gain);
  }

  // Resume on first interaction
  function resumeContext() {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  canvas.addEventListener('mousedown', resumeContext);
  canvas.addEventListener('touchstart', resumeContext);
}
