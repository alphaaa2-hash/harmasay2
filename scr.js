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


