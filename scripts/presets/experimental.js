export function run(minFreq = 100, maxFreq = 600) {
    const canvas = document.querySelector('.canvas');
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Oscillators for sound blending
    const osc1 = ctx.createOscillator(); // Tone 1
    const osc2 = ctx.createOscillator(); // Tone 2
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start();
    osc2.start();

    let isMouseDown = false;

    function updateSound(x, y, width, height) {
        const normX = x / width;
        const normY = y / height;

        // Frequency range in Hz
        const freq = minFreq + normY * (maxFreq - minFreq);

        osc1.frequency.setValueAtTime(freq, ctx.currentTime);
        osc2.frequency.setValueAtTime(freq * 0.75, ctx.currentTime);

        // Only change gain if mouse is down
        if (isMouseDown) {
            gain1.gain.setTargetAtTime(1 - normX, ctx.currentTime, 0.01);
            gain2.gain.setTargetAtTime(normX, ctx.currentTime, 0.01);
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
        if (e.button === 0) { // Left mouse button
            isMouseDown = false;

            // Resume context if needed
            const now = ctx.currentTime;
            gain1.gain.setValueAtTime(gain1.gain.value, now);
            gain1.gain.linearRampToValueAtTime(0, now + 0.125);

            gain2.gain.setValueAtTime(gain2.gain.value, now);
            gain2.gain.linearRampToValueAtTime(0, now + 0.125);
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
        gain1.gain.linearRampToValueAtTime(0, now + 0.125);

        gain2.gain.setValueAtTime(gain2.gain.value, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.125);
    });
}
