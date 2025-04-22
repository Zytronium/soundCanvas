export function run() {
    // Apply theme
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = './styles/themes/rickroll-me.css';
    document.head.appendChild(theme);
    // Create and play audio
    const audio = new Audio('../../audio/SoundEffect.mp3');
    audio.autoplay = true;
    audio.volume = 0.7; // optional volume adjustment

}