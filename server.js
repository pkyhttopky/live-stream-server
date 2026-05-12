const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const { AccessToken } = require('livekit-server-sdk');

// Caching credentials for speed
const LK_URL = 'wss://catn-73474x1n.livekit.cloud';
const LK_KEY = 'API6SF7tgwPa3dG';
const LK_SECRET = 'Ya668kfusl2LjsR06OYNd3O8WbZTtfDHMwJew3Kud6eD';

let userStatus = "Offline";

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
        try {
            // Identity must be unique for each connection
            const streamerId = `streamer_${Math.floor(Math.random() * 10000)}`;
            const viewerId = `admin_${Math.floor(Math.random() * 10000)}`;

            const streamerToken = new AccessToken(LK_KEY, LK_SECRET, { identity: streamerId });
            streamerToken.addGrant({ roomJoin: true, room: 'main_room', canPublish: true, canSubscribe: false });
            
            const viewerToken = new AccessToken(LK_KEY, LK_SECRET, { identity: viewerId });
            viewerToken.addGrant({ roomJoin: true, room: 'main_room', canPublish: false, canSubscribe: true });

            userStatus = "Broadcasting";
            io.emit('status-update', userStatus);
            
            // Send the URL and tokens
            io.emit('live-approved', {
                userToken: streamerToken.toJwt(),
                adminToken: viewerToken.toJwt(),
                url: LK_URL
            });
            console.log("Tokens generated and sent.");
        } catch (err) {
            console.error("Token Generation Error:", err);
        }
    });

    socket.on('send-comment', (data) => io.emit('new-comment', data));
    socket.on('disconnect', () => { userStatus = "Offline"; io.emit('status-update', userStatus); });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
