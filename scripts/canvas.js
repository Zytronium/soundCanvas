// Initialize instruments
const instruments = {
    synth: new Tone.PolySynth({
        voice: Tone.Synth,
        options: {
            oscillator: { type: "square" },
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

const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const scalePatterns = {
    major: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2] // Natural minor
};

function generateScale(rootNote, mode = 'major') {
    const scale = [];
    let index = noteOrder.indexOf(rootNote);
    let octave = 4;
    let currentOctave = octave;
    const steps = scalePatterns[mode];
    
    // Generate two octaves
    for (let i = 0; i < 15; i++) {
        if (i > 0) {
            const step = steps[(i - 1) % 7];
            index += step;
        }
        
        // Handle octave wrapping
        if (index >= 12) {
            index -= 12;
            currentOctave = octave + Math.floor((i + 1) / 7);
        }
        
        scale.push(`${noteOrder[index]}${currentOctave}`);
    }
    return scale;
}

function generateChords(rootNote, mode = 'major') {
    const scale = generateScale(rootNote, mode);
    if (mode === 'minor') {
        return [
            `${scale[0]},${scale[2]},${scale[4]}`,   // i
            `${scale[1]},${scale[3]},${scale[5]}`,   // ii°
            `${scale[2]},${scale[4]},${scale[6]}`,   // III
            `${scale[3]},${scale[5]},${scale[7]}`,   // iv
            `${scale[4]},${scale[6]},${scale[8]}`,   // v
            `${scale[5]},${scale[7]},${scale[9]}`,   // VI
            `${scale[6]},${scale[8]},${scale[10]}`,  // VII
            `${scale[7]},${scale[9]},${scale[11]}`   // i (octave up)
        ];
    }
    return [
        `${scale[0]},${scale[2]},${scale[4]}`,   // I
        `${scale[1]},${scale[3]},${scale[5]}`,   // ii
        `${scale[2]},${scale[4]},${scale[6]}`,   // iii
        `${scale[3]},${scale[5]},${scale[7]}`,   // IV
        `${scale[4]},${scale[6]},${scale[8]}`,   // V
        `${scale[5]},${scale[7]},${scale[9]}`,   // vi
        `${scale[6]},${scale[8]},${scale[10]}`,  // vii°
        `${scale[7]},${scale[9]},${scale[11]}`   // I (octave up)
    ];
}

const grid = document.getElementById('grid');

function createGrid(key = 'C', mode = 'major') {
    grid.innerHTML = '';
    const scale = generateScale(key, mode);
    const chords = generateChords(key, mode);

    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (row === 0) {
                cell.dataset.note = scale[col];
                cell.dataset.notes = scale[col];
            } else {
                cell.dataset.notes = chords[col];
                cell.dataset.note = chords[col].split(',')[0];
            }

            if (col === 0) {
                const label = document.createElement('div');
                label.className = 'scale-label';
                const modeLabel = mode === 'major' ? 'Major' : 'Minor';
                label.textContent = row === 0 ? 
                    `${key} ${modeLabel} Scale` : 
                    `${key} ${modeLabel} Chords`;
                cell.appendChild(label);
            }

            cell.addEventListener('mouseenter', () => {
                if (Tone.context.state === 'running') triggerNote(cell);
            });
            
            cell.addEventListener('mouseleave', () => releaseNote(cell));

            grid.appendChild(cell);
        }
    }
}

document.getElementById('key').addEventListener('change', updateGrid);
document.getElementById('mode').addEventListener('change', updateGrid);

function updateGrid() {
    const key = document.getElementById('key').value;
    const mode = document.getElementById('mode').value;
    createGrid(key, mode);
}

// Initialize grid
createGrid('C');

// Keyboard mapping
const keyMap = {
    '1': {row: 0, col: 0}, '2': {row: 0, col: 1},
    '3': {row: 0, col: 2}, '4': {row: 0, col: 3},
    '5': {row: 0, col: 4}, '6': {row: 0, col: 5},
    '7': {row: 0, col: 6}, '8': {row: 0, col: 7},
    'q': {row: 1, col: 0}, 'w': {row: 1, col: 1},
    'e': {row: 1, col: 2}, 'r': {row: 1, col: 3},
    't': {row: 1, col: 4}, 'y': {row: 1, col: 5},
    'u': {row: 1, col: 6}, 'i': {row: 1, col: 7}
};

const activeCells = new Set();

function triggerNote(cell) {
    const row = parseInt(cell.dataset.row);
    const velocity = 0.5 + ((1 - row) * 0.15);
    
    const notes = cell.dataset.notes.split(',');
    notes.forEach(note => {
        currentInstrument.triggerAttack(note, Tone.now(), velocity);
    });
    
    const hue = Math.floor(Math.random() * 360);
    cell.style.background = `hsla(${hue}, 80%, 50%, 0.2)`;
    cell.classList.add('active');
    activeCells.add(cell);
}

function releaseNote(cell) {
    const notes = cell.dataset.notes.split(',');
    notes.forEach(note => {
        currentInstrument.triggerRelease(note);
    });
    cell.classList.remove('active');
    activeCells.delete(cell);
}

document.addEventListener('keydown', (e) => {
    if (!keyMap[e.key] || activeCells.has(e.key)) return;
    
    const {row, col} = keyMap[e.key];
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) triggerNote(cell);
});

document.addEventListener('keyup', (e) => {
    if (!keyMap[e.key]) return;
    
    const {row, col} = keyMap[e.key];
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) releaseNote(cell);
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