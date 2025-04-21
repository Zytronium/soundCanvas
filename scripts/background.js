window.addEventListener('beforeunload', saveAnimationState);
window.addEventListener('DOMContentLoaded', loadGradientPosition);

function loadGradientPosition() {
  const savedTime = parseInt(getCookie('gradientLocation'), 10);
  if (!isNaN(savedTime)) {
    const body = document.querySelector('body');
    // Apply a negative delay to fast forward the animation
    body.style.animationDelay = `-${savedTime}ms`;
  }
}

function getCookie(name) {
  const value = document.cookie.match(`(?:^|;)\\s*${name}=([^;]*)`);
  return value ? decodeURIComponent(value[1]) : null;
}

// Save gradient animation state
function saveAnimationState() {
  const time = Date.now();
  const startTime = time % 20000;
  document.cookie = `gradientLocation=${startTime}; path=/soundCanvas/; max-age=3601`; // Expires in 1 hr + 1 second in case of 1-hour time desync
}