const express = require('express');
const cors = require('cors');

// Import routers
const driverRoutes = require('./routes/driver.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows our Android apps to talk to this API
app.use(express.json()); // Parses incoming JSON data in the req.body

// Mount Routes
app.use('/api/driver', driverRoutes);

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'MargSetu Server is running' });
});

// Start the HTTP server
app.listen(PORT, () => {
    console.log(`[SUCCESS] MargSetu Backend running on http://localhost:${PORT}`);
});
