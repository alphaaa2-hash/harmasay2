let audioContext;
let magnitudeChart;
let oscillator1, oscillator2, gainNode1, gainNode2;
let isPlaying = false;

const worker = new Worker('worker.js');

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
    if (isPlaying) return;
    isPlaying = true;

    document.getElementById('loadingMessage').style.display = 'block';
    document.querySelector('button[onclick="debouncedPlaySynth()"]').style.display = 'none';
    document.getElementById('stopButton').style.display = 'inline-block';

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const equation1 = document.getElementById('equation1').value;
    const equation2 = document.getElementById('equation2').value;
    const duration = 2;
    const sampleRate = audioContext.sampleRate;
    const minX = -10;
    const maxX = 10;

    worker.postMessage({equation1, equation2, minX, maxX, duration, sampleRate});

    worker.onmessage = function(e) {
        const {waveform1, waveform2, magnitudes1, magnitudes2} = e.data;

        updateComplexFunctionPlot(waveform1, waveform2);
        updateMagnitudeChart(magnitudes1, magnitudes2);

        playAudio(magnitudes1, magnitudes2);

        document.getElementById('loadingMessage').style.display = 'none';
    };
}

function playAudio(magnitudes1, magnitudes2) {
    oscillator1 = audioContext.createOscillator();
    oscillator2 = audioContext.createOscillator();
    gainNode1 = audioContext.createGain();
    gainNode2 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(audioContext.destination);
    gainNode2.connect(audioContext.destination);

    oscillator1.start();
    oscillator2.start();

    const duration = 2;
    const updateInterval = 0.01;
    const samplesPerUpdate = Math.floor(audioContext.sampleRate * updateInterval);

    for (let i = 0; i < magnitudes1.length; i += samplesPerUpdate) {
        const time = audioContext.currentTime + (i / audioContext.sampleRate);
        
        const frequency1 = mapToFrequency(magnitudes1[i]);
        const frequency2 = mapToFrequency(magnitudes2[i]);

        oscillator1.frequency.setValueAtTime(frequency1, time);
        oscillator2.frequency.setValueAtTime(frequency2, time);

        gainNode1.gain.setValueAtTime(0.5, time);
        gainNode2.gain.setValueAtTime(0.5, time);
    }

    setTimeout(() => {
        stopSynth();
    }, duration * 1000);
}

function stopSynth() {
    if (!isPlaying) return;
    isPlaying = false;

    if (oscillator1) {
        oscillator1.stop();
        oscillator2.stop();
    }

    document.querySelector('button[onclick="debouncedPlaySynth()"]').style.display = 'inline-block';
    document.getElementById('stopButton').style.display = 'none';
}

function mapToFrequency(magnitude) {
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
