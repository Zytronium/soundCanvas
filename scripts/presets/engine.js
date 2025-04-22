export function run(minFrequency = 0, maxFreq = 800) {
    // Apply theme
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = './styles/themes/engine.css';
    document.head.appendChild(theme);
    const canvas = document.querySelector('.canvas');
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Set frequency values in control panel
    const minFreqElmnt = document.getElementById('minFreq');
    const maxFreqElmnt = document.getElementById('maxFreq');
    const minFreqResetBtn = document.getElementById('minFreqReset');

    minFreqElmnt.value = 0;
    maxFreqElmnt.value = maxFreq;
    minFreqElmnt.disabled = true;
    minFreqResetBtn.disabled = true;

    // Oscillators for sound blending
    const osc1 = ctx.createOscillator(); // Tone 1
    const osc2 = ctx.createOscillator(); // Tone 2
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start();
    osc2.start();

    function updateSound(x, y, width, height) {
        const normX = x / width;
        const normY = y / height;
        const freq = normY * maxFreq;

        osc1.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.frequency.setValueAtTime(freq * 0.75, ctx.currentTime);

        // Crossfade gain
        gain1.gain.setValueAtTime(1 - normX, ctx.currentTime);
        gain2.gain.setValueAtTime(normX, ctx.currentTime);
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientY - rect.bottom;

        updateSound(x, x, rect.height, rect.width);
    });

    // Smooth fade-out on mouse leave
    canvas.addEventListener('mouseleave', () => {
        const now = ctx.currentTime;
        gain1.gain.setValueAtTime(gain1.gain.value, now);
        gain1.gain.linearRampToValueAtTime(0, now + 0.125);

        gain2.gain.setValueAtTime(gain2.gain.value, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.125);
    });

    // Resume audio context on click (browser anti-autoplay policy)
    canvas.addEventListener('click', () => {
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    });
}
