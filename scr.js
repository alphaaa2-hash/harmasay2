// Variables for audio context and oscillators
let audioContext;
let oscillators = [];

// Function to parse and evaluate the equations
function evaluateEquation(equation, xValues) {
    try {
        const compiled = math.compile(equation);
        return xValues.map(x => {
            try {
                return compiled.evaluate({ x: x });
            } catch (error) {
                return NaN;
            }
        });
    } catch (error) {
        return xValues.map(() => NaN);
    }
}

// Function to plot the equations
function plotEquations(eq1Data, eq2Data, xValues) {
    const complexFunctionPlot = document.getElementById('complexFunctionPlot');
    const magnitudeChart = document.getElementById('magnitudeChart').getContext('2d');

    const trace1 = {
        x: xValues,
        y: eq1Data,
        mode: 'lines',
        name: 'Equation 1'
    };

    const trace2 = {
        x: xValues,
        y: eq2Data,
        mode: 'lines',
        name: 'Equation 2'
    };

    const layout = {
        title: 'Graph of Equations',
        xaxis: { title: 'x' },
        yaxis: { title: 'y' }
    };

    Plotly.newPlot(complexFunctionPlot, [trace1, trace2], layout);

    new Chart(magnitudeChart, {
        type: 'line',
        data: {
            labels: xValues,
            datasets: [{
                label: 'Magnitude',
                data: eq1Data.map((y, i) => Math.sqrt(y * y + eq2Data[i] * eq2Data[i])),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Magnitude of Combined Function'
                }
            },
            scales: {
                x: { title: { display: true, text: 'x' } },
                y: { title: { display: true, text: 'Magnitude' } }
            }
        }
    });
}

// Function to create audio context and oscillators
function createOscillators(eq1Data, eq2Data, xValues) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;
    gainNode.connect(audioContext.destination);

    xValues.forEach((x, index) => {
        const osc1 = audioContext.createOscillator();
        osc1.frequency.setValueAtTime(eq1Data[index] || 0, audioContext.currentTime);
        osc1.type = 'sine';

        const osc2 = audioContext.createOscillator();
        osc2.frequency.setValueAtTime(eq2Data[index] || 0, audioContext.currentTime);
        osc2.type = 'sine';

        osc1.connect(gainNode);
        osc2.connect(gainNode);

        oscillators.push({ osc1, osc2 });
    });

    oscillators.forEach(({ osc1, osc2 }) => {
        osc1.start();
        osc2.start();
    });
}

// Function to stop the synthesizer
function stopSynth() {
    if (oscillators.length) {
        oscillators.forEach(({ osc1, osc2 }) => {
            osc1.stop();
            osc2.stop();
        });
        oscillators = [];
        audioContext.close();
        audioContext = null;
    }

    document.getElementById('stopButton').style.display = 'none';
    document.getElementById('loadingMessage').style.display = 'none';
}

// Debounce function to limit play button clicks
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const debouncedPlaySynth = debounce(playSynth, 500);

// Function to play the synthesizer
function playSynth() {
    const equation1 = document.getElementById('equation1').value;
    const equation2 = document.getElementById('equation2').value;

    const xValues = Array.from({ length: 201 }, (_, i) => -10 + i * 0.1);
    const eq1Data = evaluateEquation(equation1, xValues);
    const eq2Data = evaluateEquation(equation2, xValues);

    document.getElementById('loadingMessage').style.display = 'block';

    setTimeout(() => {
        plotEquations(eq1Data, eq2Data, xValues);
        createOscillators(eq1Data, eq2Data, xValues);

        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('stopButton').style.display = 'inline-block';
    }, 1000);
}

// Event listeners
document.getElementById('stopButton').addEventListener('click', stopSynth);

