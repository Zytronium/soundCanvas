export function run(minFreq = 100, maxFreq = 1200) {
    // Apply theme
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = './styles/themes/synthwave.css';
    document.head.appendChild(theme);

    const canvas = document.querySelector('.canvas');
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Synthwave Sound #1 - Detuned Sawtooth (Analog Pad)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';

    // Detune for phasing
    osc1.detune.setValueAtTime(-5, ctx.currentTime);
    gain1.gain.value = 0;

    // Synthwave Sound #2 - Hollow PWM-style Square
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';

    osc2.detune.setValueAtTime(5, ctx.currentTime);
    gain2.gain.value = 0;

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start();
    osc2.start();

    let isMouseDown = false;

    function updateSound(x, y, width, height) {
        const normX = x / width;
        const normY = y / height;
        const freq = minFreq + normY * (maxFreq - minFreq);

        osc1.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.frequency.setValueAtTime(freq * 0.98, ctx.currentTime);

        if (isMouseDown) {
            // Crossfade based on X
            gain1.gain.setTargetAtTime(1 - normX, ctx.currentTime, 0.03);
            gain2.gain.setTargetAtTime(normX, ctx.currentTime, 0.03);
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isMouseDown = true;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // Cancel fading if it's still fading
            const now = ctx.currentTime;
            gain1.gain.cancelScheduledValues(now);
            gain2.gain.cancelScheduledValues(now);

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            updateSound(y, x, rect.height, rect.width);
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isMouseDown = false;

            const now = ctx.currentTime;
            gain1.gain.setValueAtTime(gain1.gain.value, now);
            gain1.gain.linearRampToValueAtTime(0, now + 0.2);

            gain2.gain.setValueAtTime(gain2.gain.value, now);
            gain2.gain.linearRampToValueAtTime(0, now + 0.2);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        updateSound(y, x, rect.height, rect.width);
    });

    canvas.addEventListener('mouseleave', () => {
        isMouseDown = false;

        const now = ctx.currentTime;
        gain1.gain.setValueAtTime(gain1.gain.value, now);
        gain1.gain.linearRampToValueAtTime(0, now + 0.2);

        gain2.gain.setValueAtTime(gain2.gain.value, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.2);
    });
}
