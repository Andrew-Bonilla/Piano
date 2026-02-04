document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let currentWave = 'sine';
    const toggleBtn = document.getElementById('toggle-btn');
    const attackTime = 0.5;
    const decayTime = 0.2;
    const sustainVal = 0.7;
    const releaseTime = 1.5;

    const smileyList = [":)", ":D", "C:", ":/", "/:", ";)", ":P", "XD", ":-O", "B)", "<3"];
    const smileyDiv = document.getElementById('smiley');
    
    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
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

    let activeOscillators = {};

    function updateSmiley() {
        const randomSmiley = smileyList[Math.floor(Math.random() * smileyList.length)];
        smileyDiv.textContent = randomSmiley;
    }

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
            updateSmiley();
            //handlePolyphony();
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            const now = audioCtx.currentTime;
            const data = activeOscillators[key];
            const gainNode = data[1];
            const osc = data[0];
            
            // Start release envelope
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
            
            // Schedule stop
            osc.stop(now + releaseTime);
            
            // CRITICAL FIX: Delete from activeOscillators immediately
            // This allows the key to be pressed again right away
            delete activeOscillators[key];
            
            // Clean up after release completes
            setTimeout(() => {
                osc.disconnect();
                gainNode.disconnect();
                // Rebalance remaining notes
                //handlePolyphony();
            }, releaseTime * 1000 + 50);
        }
    }

    function playNote(key) {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        const numVoices = Object.keys(activeOscillators).length + 1;
        const peakGain = 0.6 / Math.sqrt(numVoices);
        const sustainGain = peakGain * sustainVal;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + attackTime);
        gainNode.gain.linearRampToValueAtTime(sustainGain, now + attackTime + decayTime);

        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], now);
        osc.type = currentWave;
        osc.connect(gainNode);
        gainNode.connect(globalGain);
        osc.start(now);
        
        activeOscillators[key] = [osc, gainNode, false, peakGain, sustainGain];
        
        setTimeout(() => {
            if (activeOscillators[key] && activeOscillators[key][0] === osc) {
                activeOscillators[key][2] = true;
            }
        }, (attackTime + decayTime) * 1000);
    }
});
