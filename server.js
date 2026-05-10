const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Allows any website to connect
        methods: ["GET", "POST"]
    }
});

let viewerCount = 0;
let targetReached = false;

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('send-comment', (data) => {
        console.log('Comment received:', data);
        // This sends the comment to EVERYONE connected (including the User/Streamer)
        io.emit('new-comment', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Viewer growth logic
setInterval(() => {
    if (!targetReached) {
        if (viewerCount < 10) {
            viewerCount += Math.floor(Math.random() * 2) + 1; 
        } else if (viewerCount < 150) {
            viewerCount += Math.floor(Math.random() * 8) + 2;
        } else {
            targetReached = true;
        }
    } else {
        viewerCount = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
    }
    io.emit('update-views', viewerCount);
}, 3000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));