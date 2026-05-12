const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let userStatus = "Offline"; // Offline, Online, Requesting, Broadcasting
let viewerCount = 0;

io.on('connection', (socket) => {
    // 1. Initial Status Check
    socket.emit('status-update', userStatus);

    // 2. User notifies they are online
    socket.on('user-online', () => {
        userStatus = "Online (Idle)";
        io.emit('status-update', userStatus);
    });

    // 3. User requests to go live
    socket.on('user-request-live', () => {
        userStatus = "Requesting Live...";
        io.emit('status-update', userStatus);
        io.emit('admin-notification', 'User wants to go live!');
    });

    // 4. Admin approves the request
    socket.on('admin-approve-live', (adminPeerId) => {
        userStatus = "Broadcasting";
        io.emit('status-update', userStatus);
        // Tell the user they are approved and give them the admin's Peer ID
        io.emit('live-approved', adminPeerId);
    });

    // 5. Standard Comment/View Logic
    socket.on('send-comment', (data) => io.emit('new-comment', data));

    socket.on('disconnect', () => {
        // Simple logic: if anyone disconnects, we reset for safety in this 1-on-1 setup
        userStatus = "Offline";
        io.emit('status-update', userStatus);
    });
});

// View count logic (same as before)
setInterval(() => {
    if (userStatus === "Broadcasting") {
        if (viewerCount < 10) viewerCount += 1;
        else if (viewerCount < 180) viewerCount += Math.floor(Math.random() * 5);
        else viewerCount = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
    } else {
        viewerCount = 0;
    }
    io.emit('update-views', viewerCount);
}, 3000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
