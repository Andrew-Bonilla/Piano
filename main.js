document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let currentWave = 'sine';
    const toggleBtn = document.getElementById('toggle-btn');
    const attackTime = 0.1;
    const decayTime = 0.2;
    const sustainVal = 0.3;
    const releaseTime = 0.3;

    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    toggleBtn.addEventListener('click', () => {
        if (currentWave === 'sine') {
            currentWave = 'sawtooth';
            toggleBtn.textContent = 'Switch to Sine';
        } else {
            currentWave = 'sine';
            toggleBtn.textContent = 'Switch to Sawtooth';
        }
    });

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            console.log("Oscillator ramped.")
            activeOscillators[key][1].gain.cancelScheduledValues(audioCtx.currentTime);
            activeOscillators[key][1].gain.setValueAtTime(activeOscillators[key][1].gain.value, audioCtx.currentTime);
            activeOscillators[key][1].gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + releaseTime);
            setTimeout(() => {
                if (activeOscillators[key]) {
                    activeOscillators[key][0].stop();
                    console.log("Oscillator stopped.")
                    activeOscillators[key][0].disconnect();
                    activeOscillators[key][1].disconnect();
                    delete activeOscillators[key];
                }
                
            }, releaseTime * 1000 + 50);
        }
    }

    function playNote(key) {
        const gainNode = audioCtx.createGain();
        const osc = audioCtx.createOscillator();

        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + attackTime);
        gainNode.gain.linearRampToValueAtTime(sustainVal, audioCtx.currentTime + attackTime + decayTime);

        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        osc.type = currentWave;
        osc.connect(gainNode).connect(globalGain)
        osc.start();
        
        activeOscillators[key] = [osc,gainNode]
    }
});