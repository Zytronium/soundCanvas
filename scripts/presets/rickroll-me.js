export function run() {
    // Apply theme
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = './styles/themes/rickroll-me.css';
    document.head.appendChild(theme);
    // Create and play audio
    const audio = new Audio('/soundCanvas/audio/SoundEffect.mp3');
    audio.autoplay = true;
    audio.volume = 0.7; // optional volume adjustment

    // Set frequency values in control panel
    const minFreqElmnt = document.getElementById('minFreq');
    const maxFreqElmnt = document.getElementById('maxFreq');
    const minFreqResetBtn = document.getElementById('minFreqReset');
    const maxFreqResetBtn = document.getElementById('maxFreqReset');

    minFreqElmnt.value = 100;
    maxFreqElmnt.value = 1000;
    minFreqElmnt.disabled = true;
    maxFreqElmnt.disabled = true;
    minFreqResetBtn.disabled = true;
    maxFreqResetBtn.disabled = true;

}