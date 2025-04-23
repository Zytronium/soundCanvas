export function runPreset({
  themePath = 'https://zytronium.github.io/soundCanvas/styles/themes/classic.css',
  osc1Type = 'sine',
  osc2Type = 'triangle',
  initialMinFreq = 100,
  initialMaxFreq = 900
  } = {}) {
  // Settings
  let minFreq = initialMinFreq;
  let maxFreq = initialMaxFreq;

  // Apply theme
  const theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = themePath;
  document.head.appendChild(theme);

  // Apply the theme even on Apple
  const canvas = document.querySelector('.canvas');
  let theme_tl = '#ff0026';
  let theme_tr = '#ff5e00';
  let theme_br = '#ff00c8';
  let theme_bl = '#8700e7';
  canvas.style.setProperty(
    'background',
    `
    radial-gradient(at center,       white,            white 100%),
    radial-gradient(at top left,     ${theme_tl}, transparent 55%),
    radial-gradient(at top right,    ${theme_tr}, transparent 55%),
    radial-gradient(at bottom right, ${theme_br}, transparent 55%),
    radial-gradient(at bottom left,  ${theme_bl}, transparent 55%),
    radial-gradient(at top left,     ${theme_tl}, transparent 55%),
    radial-gradient(at top right,    ${theme_tr}, transparent 55%),
    radial-gradient(at bottom right, ${theme_br}, transparent 55%),
    radial-gradient(at bottom left,  ${theme_bl}, transparent 55%)
  `,
    'important'
  );



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

  let oscillatorsStarted = false;
  let mouseIsDown = false;
  let globalMouseIsDown = false;

  function updateSound(x, y, width, height) {
    const normX = x / width;
    const normY = y / height;
    const freq = minFreq + normX * (maxFreq - minFreq);

    osc1.frequency.setValueAtTime(freq, ctx.currentTime);
    osc2.frequency.setValueAtTime(freq * 0.75, ctx.currentTime);

    if (mouseIsDown) {
      if (!oscillatorsStarted) {
        osc1.start();
        osc2.start();
        oscillatorsStarted = true;
      }
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

  function handleInputEvent(x, y, width, height) {
    updateSound(x, y, width, height);
  }

  function handleInteractionStart(x, y, width, height) {
    mouseIsDown = true;

    if (ctx.state === 'suspended')
      ctx.resume();

    const now = ctx.currentTime;

    gain1.gain.cancelScheduledValues(now);
    gain2.gain.cancelScheduledValues(now);

    handleInputEvent(x, y, width, height);
  }

  function handleInteractionMove(x, y, width, height) {
    if (mouseIsDown)
      handleInputEvent(x, y, width, height);
  }

  function handleInteractionEnd() {
    if (mouseIsDown)
      fadeOutSound();

    mouseIsDown = false;
  }

  // Desktop mouse events
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0)
      globalMouseIsDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      globalMouseIsDown = false;
      handleInteractionEnd();
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0)
      return;

    const rect = canvas.getBoundingClientRect();

    handleInteractionStart(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();

    handleInteractionMove(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
  });

  canvas.addEventListener('mouseleave', handleInteractionEnd);

  canvas.addEventListener('mouseenter', (e) => {
    if (globalMouseIsDown) {
      const rect = canvas.getBoundingClientRect();

      handleInteractionStart(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    }
  });

  canvas.addEventListener('click', () => {
    if (ctx.state === 'suspended')
      ctx.resume();
  });

  // Mobile touch events
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];

      handleInteractionStart(touch.clientX - rect.left, touch.clientY - rect.top, rect.width, rect.height);
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];

      handleInteractionMove(touch.clientX - rect.left, touch.clientY - rect.top, rect.width, rect.height);
    }
  });

  canvas.addEventListener('touchend', handleInteractionEnd);
  canvas.addEventListener('touchcancel', handleInteractionEnd);
}
