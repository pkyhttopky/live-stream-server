const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_URL = 'wss://catn-73474x1n.livekit.cloud';
const LIVEKIT_API_KEY = 'API6SF7tgwPa3dG';
const LIVEKIT_API_SECRET = 'Ya668kfusl2LjsR06OYNd3O8WbZTtfDHMwJew3Kud6eD';

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
        const streamerToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: 'streamer_' + Date.now() });
        streamerToken.addGrant({ roomJoin: true, room: 'main_room', canPublish: true, canSubscribe: false });
        
        const viewerToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: 'admin_viewer' });
        viewerToken.addGrant({ roomJoin: true, room: 'main_room', canPublish: false, canSubscribe: true });

        userStatus = "Broadcasting";
        io.emit('status-update', userStatus);
        
        io.emit('live-approved', {
            userToken: streamerToken.toJwt(),
            adminToken: viewerToken.toJwt(),
            url: LIVEKIT_URL
        });
    });

    socket.on('send-comment', (data) => io.emit('new-comment', data));
    socket.on('disconnect', () => { userStatus = "Offline"; io.emit('status-update', userStatus); });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
