let tapCounter = 0;
let bpms = [];
let nextMinBpm = 0;
let nextMaxBpm = 0;
let minBpm = nextMinBpm;
let maxBpm = nextMaxBpm
let smoothN = 0;
let avg = -1;
let smoothAvg = -1;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let prevTime = -1;

function bpmFromMillis(millis) {
    return 60000 / millis;
}

function tapped() {
    tapCounter++;

    // get current time in millis
    const time = new Date().getTime();

    if (prevTime !== -1) {
        // calculate time difference:
        const diff = time - prevTime;
        if (diff < 10) {
            // ignore
        } else if (diff > 3000) {
            // too long ago, reset
            tapCounter = 0;
            bpms = [];
            nextMinBpm = 0;
            nextMaxBpm = 0;
            minBpm = nextMinBpm;
            maxBpm = nextMaxBpm
            smoothN = 0;
            avg = -1;
            smoothAvg = -1;
        } else {
            const bpm = bpmFromMillis(diff);
            bpms.push(bpm);
            const sum = bpms.reduce((a, b) => a + b, 0);
            avg = sum / bpms.length
            if (smoothAvg === -1) {
                smoothAvg = avg;
            }
        }
    }
    prevTime = time;
}

// tap listener
document.addEventListener("pointerdown", () => tapped());

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bpms.length >= 2) {

        // std dev
        const std = Math.sqrt(bpms.reduce(
            (a, b) => a + Math.pow(b - avg, 2),
            0) / bpms.length);

        nextMinBpm = avg - 2 * std;
        nextMaxBpm = avg + 2 * std;
        // constrain
        nextMinBpm = Math.max(nextMinBpm, avg - 10);
        nextMaxBpm = Math.min(nextMaxBpm, avg + 10);

        minBpm = lerp(minBpm, nextMinBpm, 0.1);
        maxBpm = lerp(maxBpm, nextMaxBpm, 0.1);
        smoothN = lerp(smoothN, bpms.length, 0.1);

        smoothAvg = lerp(smoothAvg, avg, 0.1);
        const roundedBpm = Math.round(avg);

        if (minBpm !== maxBpm) {

            let prevX;
            let prevY;
            for (let i = 0; i < bpms.length; i++) {
                const bpm = bpms[i];
                const fx = i / smoothN;
                const fy = (bpm - minBpm) / (maxBpm - minBpm);
                const x = canvas.width * fx;
                const y = canvas.height * (1 - fy);
                ctx.fillStyle = 'dodgerblue';
                ctx.beginPath();
                ctx.arc(x, y, 24, 0, 2 * Math.PI);
                ctx.fill();

                if (i !== 0) {
                    // draw line from previous point
                    ctx.strokeStyle = 'dodgerblue';
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineWidth = 5;
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
                prevX = x;
                prevY = y;
            }

            const fy = (smoothAvg - minBpm) / (maxBpm - minBpm);
            const y = canvas.height * (1 - fy);
            ctx.strokeStyle = 'deeppink';
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineWidth = 5;
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            // other bpm lines
            for (let i = -10; i <= 10; i++) {
                const bpm = roundedBpm + i;
                const fy = (bpm - minBpm) / (maxBpm - minBpm);
                const y = canvas.height * (1 - fy);
                ctx.strokeStyle = 'dodgerblue';
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineWidth = 0.5;
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        // bpm text
        ctx.fillStyle = 'deeppink';
        ctx.font = 'italic bold 200px "Courier New"';
        ctx.fillText(`${roundedBpm}`, canvas.width / 2 - 50, canvas.height / 2);
    } else {
        // bpm text
        ctx.fillStyle = 'deeppink';
        ctx.font = `italic bold ${Math.round(150 + 50 * tapCounter)}px "Courier New"`;
        ctx.textAlign = "center";
        let text = "Tap";
        // for (let i = 0; i < tapCounter; i++) {
        //     text += "!";
        // }
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(() => draw());
}

// from https://webgpufundamentals.org/webgpu/lessons/webgpu-resizing-the-canvas.html
const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
        const width = entry.devicePixelContentBoxSize?.[0].inlineSize ||
            entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height = entry.devicePixelContentBoxSize?.[0].blockSize ||
            entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const canvas = entry.target;
        canvas.width = Math.max(1, Math.min(width, 2000 * width / height));
        canvas.height = Math.max(1, Math.min(height, 2000));
        // re-render
        draw();
    }
});
try {
    observer.observe(canvas, {box: 'device-pixel-content-box'});
} catch {
    observer.observe(canvas, {box: 'content-box'});
}

// start drawing
requestAnimationFrame(() => draw());