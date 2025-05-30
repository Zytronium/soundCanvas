export function run (minFreq = 100, maxFreq = 800) {
  // Apply theme
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = './styles/themes/synth.css';
  document.head.appendChild(theme);

  const canvas = document.querySelector('.canvas');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Create a super-saw with detuning
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const subOsc = ctx.createOscillator(); // An octave down
  const gainA = ctx.createGain();
  const gainB = ctx.createGain();
  const subGain = ctx.createGain();

  // LFO for subtle tremolo
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  // Config
  oscA.type = 'sawtooth';
  oscB.type = 'square';
  subOsc.type = 'sine';

  oscA.detune.setValueAtTime(-10, ctx.currentTime);
  oscB.detune.setValueAtTime(10, ctx.currentTime);
  subOsc.detune.setValueAtTime(0, ctx.currentTime);

  gainA.gain.value = 0;
  gainB.gain.value = 0;
  subGain.gain.value = 0;

  // Connect tremolo
  lfo.frequency.setValueAtTime(0.7, ctx.currentTime); // slow pulse
  lfoGain.gain.value = 0.2;

  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.8;

  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);

  oscA.connect(gainA).connect(masterGain);
  oscB.connect(gainB).connect(masterGain);
  subOsc.connect(subGain).connect(masterGain);
  masterGain.connect(ctx.destination);

  oscA.start();
  oscB.start();
  subOsc.start();
  lfo.start();

  let isMouseDown = false;
  let globalMouseIsDown = false;

  function updateSound (x, y, width, height) {
    const normX = x / width;
    const normY = y / height;
    const freq = minFreq + normY * (maxFreq - minFreq);

    oscA.frequency.setValueAtTime(freq, ctx.currentTime);
    oscB.frequency.setValueAtTime(freq, ctx.currentTime);
    subOsc.frequency.setValueAtTime(freq / 2, ctx.currentTime); // Sub octave

    if (isMouseDown) {
      const attack = 0.3;
      const now = ctx.currentTime;

      gainA.gain.cancelScheduledValues(now);
      gainB.gain.cancelScheduledValues(now);
      subGain.gain.cancelScheduledValues(now);

      gainA.gain.setTargetAtTime(0.5 * (1 - normX), now, attack);
      gainB.gain.setTargetAtTime(0.5 * normX, now, attack);
      subGain.gain.setTargetAtTime(0.3, now, attack);
    }
  }

  function fadeOut () {
    isMouseDown = false;
    const now = ctx.currentTime;

    gainA.gain.setTargetAtTime(0, now, 0.2);
    gainB.gain.setTargetAtTime(0, now, 0.2);
    subGain.gain.setTargetAtTime(0, now, 0.2);
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0)
      return;

    isMouseDown = true;

    if (ctx.state === 'suspended') ctx.resume();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateSound(y, x, rect.height, rect.width);
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0)
      globalMouseIsDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      globalMouseIsDown = false;
      if (isMouseDown)
        fadeOut();
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (isMouseDown)
      fadeOut();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateSound(y, x, rect.height, rect.width);
  });

  canvas.addEventListener('mouseleave', () => {
    if (isMouseDown)
      fadeOut();
  });

  canvas.addEventListener('mouseenter', (e) => {
    if (globalMouseIsDown) {
      isMouseDown = true;

      if (ctx.state === 'suspended')
        ctx.resume();

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      updateSound(y, x, rect.height, rect.width);
    }
  });

  // Mobile event listeners
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Prevents the browser from scrolling
    isMouseDown = true;

    if (ctx.state === 'suspended') ctx.resume();

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    updateSound(y, x, rect.height, rect.width);
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isMouseDown) return;

    e.preventDefault(); // Prevents the browser from scrolling

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    updateSound(y, x, rect.height, rect.width);
  });

  canvas.addEventListener('touchend', () => {
    if (isMouseDown)
      fadeOut();
  });

}
