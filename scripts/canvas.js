export function runPreset({
  themePath = './styles/themes/classic.css',
  osc1Type = 'sine',
  osc2Type = 'triangle',
  initialMinFreq = 100,
  initialMaxFreq = 1000
  } = {}) {
  // Settings
  let minFreq = initialMinFreq;
  let maxFreq = initialMaxFreq;

  // Apply theme
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = themePath;
  document.head.appendChild(theme);

  const canvas = document.querySelector('.canvas');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Oscillators for sound blending
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  osc1.type = osc1Type;
  osc2.type = osc2Type;

  osc1.connect(gain1).connect(ctx.destination);
  osc2.connect(gain2).connect(ctx.destination);

  osc1.start();
  osc2.start();

  let mouseIsDown = false;
  let globalMouseIsDown = false;

  function updateSound(x, y, width, height) {
    const normX = x / width;
    const normY = y / height;
    const freq = minFreq + normX * (maxFreq - minFreq);

    osc1.frequency.setValueAtTime(freq, ctx.currentTime);
    osc2.frequency.setValueAtTime(freq * 0.75, ctx.currentTime);

    if (mouseIsDown) {
      gain1.gain.setTargetAtTime(1 - normY, ctx.currentTime, 0.01);
      gain2.gain.setTargetAtTime(normY, ctx.currentTime, 0.01);
    }
  }

  function fadeOutSound() {
    mouseIsDown = false;

    const now = ctx.currentTime;
    gain1.gain.setValueAtTime(gain1.gain.value, now);
    gain1.gain.linearRampToValueAtTime(0, now + 0.125);

    gain2.gain.setValueAtTime(gain2.gain.value, now);
    gain2.gain.linearRampToValueAtTime(0, now + 0.125);
  }

  function handleMouseEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateSound(x, y, rect.width, rect.height);
  }

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) globalMouseIsDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      globalMouseIsDown = false;
      if (mouseIsDown) fadeOutSound();
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0)
      return;

    mouseIsDown = true;

    if (ctx.state === 'suspended')
      ctx.resume();

    const now = ctx.currentTime;

    gain1.gain.cancelScheduledValues(now);
    gain2.gain.cancelScheduledValues(now);

    handleMouseEvent(e);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (mouseIsDown)
      handleMouseEvent(e);
  });

  canvas.addEventListener('mouseleave', () => {
    if (mouseIsDown)
      fadeOutSound();
  });

  canvas.addEventListener('mouseenter', (e) => {
    if (globalMouseIsDown) {
      mouseIsDown = true;

      if (ctx.state === 'suspended')
        ctx.resume();

      const now = ctx.currentTime;
      gain1.gain.cancelScheduledValues(now);
      gain2.gain.cancelScheduledValues(now);

      handleMouseEvent(e);
    }
  });

  canvas.addEventListener('click', () => {
    if (ctx.state === 'suspended')
      ctx.resume();
  });
}