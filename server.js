const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { 
    cors: { origin: "*", methods: ["GET", "POST"] } 
});
const { AccessToken } = require('livekit-server-sdk');

// Your LiveKit Credentials
const LIVEKIT_URL = 'wss://catn-73474x1n.livekit.cloud';
const LIVEKIT_API_KEY = 'API6SF7tgwPa3dG';
const LIVEKIT_API_SECRET = 'Ya668kfusl2LjsR06OYNd3O8WbZTtfDHMwJew3Kud6eD';

let userStatus = "Offline";
let viewerCount = 0;

io.on('connection', (socket) => {
    socket.emit('status-update', userStatus);

    socket.on('user-online', () => {
        userStatus = "Online (Idle)";
        io.emit('status-update', userStatus);
    });

    socket.on('user-request-live', () => {
        userStatus = "Requesting Live...";
        io.emit('status-update', userStatus);
    });

    socket.on('admin-approve-live', async () => {
        // Generate Tokens for the Room "main_room"
        const atUser = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: 'streamer' });
        atUser.addGrant({ roomJoin: true, room: 'main_room', canPublish: true, canSubscribe: false });
        
        const atAdmin = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: 'admin' });
        atAdmin.addGrant({ roomJoin: true, room: 'main_room', canPublish: false, canSubscribe: true });

        userStatus = "Broadcasting";
        io.emit('status-update', userStatus);
        
        // Broadcast tokens to the specific clients
        io.emit('live-approved', {
            userToken: atUser.toJwt(),
            adminToken: atAdmin.toJwt(),
            url: LIVEKIT_URL
        });
    });

    socket.on('send-comment', (data) => io.emit('new-comment', data));

    socket.on('disconnect', () => {
        userStatus = "Offline";
        io.emit('status-update', userStatus);
    });
});

// Viewer count logic
setInterval(() => {
    if (userStatus === "Broadcasting") {
        viewerCount = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
    } else {
        viewerCount = 0;
    }
    io.emit('update-views', viewerCount);
}, 3000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
