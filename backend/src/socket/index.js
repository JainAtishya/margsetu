const { Server } = require('socket.io');

// We use a singleton pattern here so we can access the 'io' instance from anywhere in our backend (like the Service layer)
let io;

const initSocket = (server) => {
    // Attach Socket.IO to our HTTP server
    io = new Server(server, {
        cors: {
            origin: '*', // Allows Android apps to connect
            methods: ['GET', 'POST']
        }
    });

    // Listen for new connections
    io.on('connection', (socket) => {
        console.log(`[SOCKET] Passenger connected: ${socket.id}`);

        // The passenger app tells us which bus they want to track
        socket.on('join_trip', (tripId) => {
            const roomName = `trip:${tripId}`;
            socket.join(roomName);
            console.log(`[SOCKET] ${socket.id} joined room: ${roomName}`);
        });

        // The passenger app tells us they stopped watching
        socket.on('leave_trip', (tripId) => {
            const roomName = `trip:${tripId}`;
            socket.leave(roomName);
            console.log(`[SOCKET] ${socket.id} left room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] Passenger disconnected: ${socket.id}`);
        });
    });

    return io;
};

// A helper function to grab the running io instance from other files
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIo };
