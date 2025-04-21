export function run(minFreq = 80, maxFreq = 450) {
    const canvas = document.querySelector('.canvas');
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Create ambient-style custom waveforms
    const harmonicCount = 16;

    // Deep shimmer (rich in low harmonics)
    const shimmerReal = new Float32Array(harmonicCount);
    const shimmerImag = new Float32Array(harmonicCount);
    for (let i = 1; i < harmonicCount; i++) {
        shimmerReal[i] = 0; // no cosine
        shimmerImag[i] = 1 / i; // soft decay
    }
    const shimmerWave = ctx.createPeriodicWave(shimmerReal, shimmerImag, { disableNormalization: true });

    // Ghostly wind (airier, less low-end)
    const windReal = new Float32Array(harmonicCount);
    const windImag = new Float32Array(harmonicCount);
    for (let i = 1; i < harmonicCount; i++) {
        windReal[i] = Math.random() * 0.3; // slight randomness
        windImag[i] = 1 / (i * i); // fast decay
    }
    const windWave = ctx.createPeriodicWave(windReal, windImag, { disableNormalization: true });

    // Oscillators for sound blending
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.setPeriodicWave(shimmerWave);
    osc2.setPeriodicWave(windWave);

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
        osc2.frequency.setValueAtTime(freq * 0.75, ctx.currentTime);

        // Only change gain if mouse is down
        if (isMouseDown) {
            gain1.gain.setTargetAtTime(1 - normX, ctx.currentTime, 0.05);
            gain2.gain.setTargetAtTime(normX, ctx.currentTime, 0.05);
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isMouseDown = true;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

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
