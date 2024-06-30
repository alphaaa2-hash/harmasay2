const worker = new Worker('worker.js');


let audioContext;
let magnitudeChart;

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function initCharts() {
    magnitudeChart = new Chart(document.getElementById('magnitudeChart').getContext('2d'), {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Magnitude 1',
                    borderColor: '#bb86fc',
                    tension: 0.1
                },
                {
                    label: 'Magnitude 2',
                    borderColor: '#03dac6',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#e0e0e0'
                    },
                    ticks: { color: '#e0e0e0' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Magnitude',
                        color: '#e0e0e0'
                    },
                    ticks: { color: '#e0e0e0' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e0e0e0' }
                }
            }
        }
    });
}

function playSynth() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const equation1 = document.getElementById('equation1').value;
    const equation2 = document.getElementById('equation2').value;
    const parser = math.parser();

    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(audioContext.destination);
    gainNode2.connect(audioContext.destination);

    oscillator1.start();
    oscillator2.start();

    const duration = 2; // 2 seconds
    const sampleRate = audioContext.sampleRate;
    const waveform1 = [];
    const waveform2 = [];
    const magnitudes1 = [];
    const magnitudes2 = [];

    const minX = -10;
    const maxX = 10;

    for (let i = 0; i < duration * sampleRate; i++) {
        const x = minX + (i / (duration * sampleRate)) * (maxX - minX);
        try {
            parser.set('x', math.complex(x, 0)); // Use complex x

            const result1 = parser.evaluate(equation1);
            const magnitude1 = math.abs(result1);
            const phase1 = math.arg(result1);

            const result2 = parser.evaluate(equation2);
            const magnitude2 = math.abs(result2);
            const phase2 = math.arg(result2);

            // Map magnitudes to frequencies
            const frequency1 = mapToFrequency(magnitude1);
            const frequency2 = mapToFrequency(magnitude2);

            oscillator1.frequency.setValueAtTime(frequency1, audioContext.currentTime + (i / sampleRate));
            oscillator2.frequency.setValueAtTime(frequency2, audioContext.currentTime + (i / sampleRate));

            // Map phases to gains
            const gain1 = (math.cos(phase1) + 1) / 4; // Normalize to [0, 0.5]
            const gain2 = (math.cos(phase2) + 1) / 4; // Normalize to [0, 0.5]

            gainNode1.gain.setValueAtTime(gain1, audioContext.currentTime + (i / sampleRate));
            gainNode2.gain.setValueAtTime(gain2, audioContext.currentTime + (i / sampleRate));

            waveform1.push({x: x, y: result1.re, z: result1.im});
            waveform2.push({x: x, y: result2.re, z: result2.im});
            magnitudes1.push(magnitude1);
            magnitudes2.push(magnitude2);
        } catch (error) {
            console.error('Error evaluating equation:', error);
        }
    }

    updateComplexFunctionPlot(waveform1, waveform2);
    updateMagnitudeChart(magnitudes1, magnitudes2);

    setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
    }, duration * 1000);
}

function mapToFrequency(magnitude) {
    // Map magnitude to frequency range (e.g., 20Hz to 2000Hz)
    return Math.max(20, Math.min(2000, magnitude * 200 + 20));
}

function updateComplexFunctionPlot(waveform1, waveform2) {
    const trace1 = {
        x: waveform1.map(point => point.x),
        y: waveform1.map(point => point.y),
        z: waveform1.map(point => point.z),
        mode: 'lines',
        type: 'scatter3d',
        name: 'Equation 1',
        line: {
            width: 6,
            color: waveform1.map(point => Math.sqrt(point.y*point.y + point.z*point.z)),
            colorscale: 'Viridis'
        }
    };

    const trace2 = {
        x: waveform2.map(point => point.x),
        y: waveform2.map(point => point.y),
        z: waveform2.map(point => point.z),
        mode: 'lines',
        type: 'scatter3d',
        name: 'Equation 2',
        line: {
            width: 6,
            color: waveform2.map(point => Math.sqrt(point.y*point.y + point.z*point.z)),
            colorscale: 'Plasma'
        }
    };

    const layout = {
        title: {
            text: 'Functions Visualization',
            font: { color: '#e0e0e0' }
        },
        autosize: true,
        height: 500,
        paper_bgcolor: '#1e1e1e',
        plot_bgcolor: '#1e1e1e',
        scene: {
            xaxis:{title: 'x', color: '#e0e0e0'},
            yaxis:{title: 'Re', color: '#e0e0e0'},
            zaxis:{title: 'Im', color: '#e0e0e0'}
        }
    };

    Plotly.newPlot('complexFunctionPlot', [trace1, trace2], layout);
}

function updateMagnitudeChart(magnitudes1, magnitudes2) {
    magnitudeChart.data.labels = magnitudes1.map((_, i) => i);
    magnitudeChart.data.datasets[0].data = magnitudes1;
    magnitudeChart.data.datasets[1].data = magnitudes2;
    magnitudeChart.update();
}

const debouncedPlaySynth = debounce(playSynth, 300);

document.addEventListener('DOMContentLoaded', initCharts);
