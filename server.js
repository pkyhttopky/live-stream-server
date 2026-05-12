const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

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

    // When Admin clicks Approve
    socket.on('admin-approve-live', () => {
        io.emit('live-approved'); 
    });

    // When User's camera is actually flowing
    socket.on('user-camera-ready', () => {
        userStatus = "Broadcasting";
        io.emit('status-update', userStatus);
        io.emit('user-ready-to-call'); // This triggers the Admin to call
    });

    socket.on('send-comment', (data) => io.emit('new-comment', data));

    socket.on('disconnect', () => {
        userStatus = "Offline";
        io.emit('status-update', userStatus);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
