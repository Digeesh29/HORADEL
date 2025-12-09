// HoraDel Transport Server
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware - Allow all origins for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve all static files

// API Routes
app.use('/api/dashboard', require('./routes/dashboard-router'));
app.use('/api/bookings', require('./routes/bookings-router'));
app.use('/api/vehicles', require('./routes/vehicles-router'));
app.use('/api/ratecards', require('./routes/ratecards-router'));
app.use('/api/companies', require('./routes/companies-router'));
app.use('/api/drivers', require('./routes/drivers-router'));
app.use('/api/reports', require('./routes/reports-router'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} `);
});

