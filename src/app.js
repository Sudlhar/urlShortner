const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes/apiRoutes');
const redirectRoutes = require('./routes/redirectRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/', redirectRoutes); // Catch-all for short codes

// Global Error Handler
app.use(errorHandler);

module.exports = app;
