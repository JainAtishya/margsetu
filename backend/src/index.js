const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import Node's native HTTP module
const { initSocket } = require('./socket'); // 2. Import our socket initializer

// Import routers
const driverRoutes = require('./routes/driver.routes');
const smsRoutes = require('./routes/sms.routes');
const passengerRoutes = require('./routes/passenger.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Wrap Express inside the native HTTP server
const server = http.createServer(app);

// 4. Attach Socket.IO to that server
initSocket(server);

// Middleware
app.use(cors()); // Allows our Android apps to talk to this API
app.use(express.json()); // Parses incoming JSON data in the req.body

// Mount Routes
app.use('/api/driver', driverRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/passenger', passengerRoutes);

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'MargSetu Server is running' });
});

// 5. IMPORTANT: Start the 'server', NOT the 'app'
server.listen(PORT, () => {
    console.log(`[SUCCESS] MargSetu Backend & WebSockets running on http://localhost:${PORT}`);
});
