// Initialize instruments
const instruments = {
    synth: new Tone.PolySynth({
        voice: Tone.Synth,
        options: {
          oscillator: { type: "square" }, // Square wave!
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 0.2
          }
        }
      }).toDestination(),
  fm: new Tone.PolySynth(Tone.FMSynth).toDestination(),
  pluck: new Tone.PluckSynth().toDestination(),
  am: new Tone.PolySynth(Tone.AMSynth).toDestination(),

};
let currentInstrument = instruments.synth;

// Define scales for each row
const scales = [
  // Row 0: C Major
  ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
  // Row 1: F Major
  ["F4", "G4", "A4", "Bb4", "C5", "D5", "E5", "F5"],
  // Row 2: G Major
  ["G4", "A4", "B4", "C5", "D5", "E5", "F#5", "G5"],
  // Row 3: Power Chords (C5 to B5)
  ["C4,G4", "D4,A4", "E4,B4", "F4,C5", "G4,D5", "A4,E5", "B4,F#5", "C5,G5"]
];
const scaleNames = ["C Major", "F Major", "G Major", "Power Chords"];

// Create grid cells (8 columns x 4 rows)
const grid = document.getElementById('grid');
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 8; col++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.dataset.note = row === 3 ? scales[row][col].split(',')[0] : scales[row][col];
    cell.dataset.notes = row === 3 ? scales[row][col] : scales[row][col];
    
    // Add scale label to first cell in row
    if (col === 0) {
      const label = document.createElement('div');
      label.className = 'scale-label';
      label.textContent = scaleNames[row];
      cell.appendChild(label);
    }
    
    // Visual feedback on hover/click
    cell.addEventListener('mouseenter', (e) => {
      if (Tone.context.state !== 'running') return;
      triggerNote(cell);
    });
    
    cell.addEventListener('mouseleave', () => {
      releaseNote(cell);
    });
    
    grid.appendChild(cell);
  }
}

// Keyboard to cell mapping
const keyMap = {
  // Top row (C Major)
  '1': {row: 0, col: 0}, '2': {row: 0, col: 1}, 
  '3': {row: 0, col: 2}, '4': {row: 0, col: 3},
  '5': {row: 0, col: 4}, '6': {row: 0, col: 5},
  '7': {row: 0, col: 6}, '8': {row: 0, col: 7},
  
  // Power chord row
  'q': {row: 3, col: 0}, 'w': {row: 3, col: 1},
  'e': {row: 3, col: 2}, 'r': {row: 3, col: 3},
  't': {row: 3, col: 4}, 'y': {row: 3, col: 5},
  'u': {row: 3, col: 6}, 'i': {row: 3, col: 7}
};

// Track active cells
const activeCells = new Set();

function triggerNote(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const velocity = 0.5 + ((3 - row) * 0.15);
  
  if (currentInstrument === instruments.noise) {
    if (!instruments.noise.started) {
      instruments.noise.start();
      instruments.noise.volume.value = -20;
    }
  } else {
    const notes = cell.dataset.notes.split(',');
    notes.forEach(note => {
      currentInstrument.triggerAttack(note, Tone.now(), velocity);
    });
    const hue = Math.floor(Math.random() * 360); // color changer on note activation //
    cell.style.background = `hsla(${hue}, 80%, 50%, 0.2)`;
  }
  
  cell.classList.add('active');
  activeCells.add(cell);
}

function releaseNote(cell) {
  if (currentInstrument !== instruments.noise) {
    const notes = cell.dataset.notes.split(',');
    notes.forEach(note => {
      currentInstrument.triggerRelease(note);
    });
  }
  cell.classList.remove('active');
  activeCells.delete(cell);
}

// Keyboard event listeners //
document.addEventListener('keydown', (e) => {
  if (!keyMap[e.key] || activeCells.has(e.key)) return;
  
  const {row, col} = keyMap[e.key];
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    triggerNote(cell);
  }
});

document.addEventListener('keyup', (e) => {
  if (!keyMap[e.key]) return;
  
  const {row, col} = keyMap[e.key];
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    releaseNote(cell);
  }
});

document.getElementById('start').addEventListener('click', async () => {
  await Tone.start();
  document.getElementById('start').disabled = true;
});
document.getElementById('restart').addEventListener('click', () => {
    window.location.reload();
  });
  document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

document.getElementById('instrument').addEventListener('change', (e) => {
  currentInstrument = instruments[e.target.value];
});