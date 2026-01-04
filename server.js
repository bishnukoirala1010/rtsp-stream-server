const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS
app.use(cors());
app.use(express.static('public'));

// RTSP Stream Configuration
const RTSP_URL = 'rtsp://admin:L2242337@192.168.1.98:554/cam/realmonitor?channel=1&subtype=0';
const HLS_PATH = path.join(__dirname, 'public', 'stream');

// Create directories
if (!fs.existsSync(HLS_PATH)) {
    fs.mkdirSync(HLS_PATH, { recursive: true });
}

let ffmpegProcess = null;

// Start FFmpeg stream conversion
function startStream() {
    if (ffmpegProcess) {
        console.log('Stream already running');
        return;
    }

    console.log('Starting RTSP to HLS conversion...');
    
    // FFmpeg command to convert RTSP to HLS
    ffmpegProcess = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', RTSP_URL,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '3',
        '-hls_flags', 'delete_segments',
        path.join(HLS_PATH, 'stream.m3u8')
    ]);

    ffmpegProcess.stdout.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg Error: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        ffmpegProcess = null;
    });
}

// API Routes
app.get('/api/start', (req, res) => {
    startStream();
    res.json({ status: 'Stream started' });
});

app.get('/api/stop', (req, res) => {
    if (ffmpegProcess) {
        ffmpegProcess.kill();
        ffmpegProcess = null;
        res.json({ status: 'Stream stopped' });
    } else {
        res.json({ status: 'No stream running' });
    }
});

app.get('/api/status', (req, res) => {
    res.json({ 
        running: ffmpegProcess !== null,
        streamUrl: '/stream/stream.m3u8'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Auto-start stream
    setTimeout(() => {
        startStream();
    }, 2000);
});

// Cleanup on exit
process.on('SIGTERM', () => {
    if (ffmpegProcess) {
        ffmpegProcess.kill();
    }
    process.exit(0);
});
