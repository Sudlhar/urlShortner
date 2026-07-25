const express = require('express');
const { shortenUrl } = require('../controllers/urlController');
const { getAnalytics } = require('../controllers/analyticsController');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiter to all API routes
router.use(apiLimiter);

router.post('/shorten', shortenUrl);
router.get('/analytics/:code', getAnalytics);

module.exports = router;
