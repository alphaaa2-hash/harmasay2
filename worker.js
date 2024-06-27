importScripts('https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js');

self.onmessage = function(e) {
    const {equation1, equation2, minX, maxX, duration, sampleRate} = e.data;
    const parser = math.parser();
    const waveform1 = [], waveform2 = [], magnitudes1 = [], magnitudes2 = [];

    for (let i = 0; i < duration * sampleRate; i++) {
        const x = minX + (i / (duration * sampleRate)) * (maxX - minX);
        try {
            parser.set('x', math.complex(x, 0));

            const result1 = parser.evaluate(equation1);
            const magnitude1 = math.abs(result1);

            const result2 = parser.evaluate(equation2);
            const magnitude2 = math.abs(result2);

            waveform1.push({x: x, y: result1.re, z: result1.im});
            waveform2.push({x: x, y: result2.re, z: result2.im});
            magnitudes1.push(magnitude1);
            magnitudes2.push(magnitude2);
        } catch (error) {
            console.error('Error evaluating equation:', error);
        }
    }

    self.postMessage({waveform1, waveform2, magnitudes1, magnitudes2});
};
