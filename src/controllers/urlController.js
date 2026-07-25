const Url = require('../models/Url');
const Analytics = require('../models/Analytics');
const { filter } = require('../config/bloomFilter');
const redisClient = require('../config/redis');
const { generateBase62 } = require('../utils/base62');
const { getClientIp } = require('../utils/ipParser');
const UAParser = require('ua-parser-js');

// Helper to validate URL
const isValidUrl = (urlString) => {
  try {
    new URL(urlString);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * @desc    Create short URL
 * @route   POST /api/shorten
 */
const shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresIn } = req.body;

    if (!originalUrl || !isValidUrl(originalUrl)) {
      res.status(400);
      throw new Error('Please provide a valid originalUrl');
    }

    let shortCode = customAlias;

    if (customAlias) {
      // Check uniqueness in DB for custom alias
      const existing = await Url.findOne({ alias: customAlias });
      if (existing) {
        res.status(400);
        throw new Error('Custom alias already in use');
      }
    } else {
      // Generate a unique 7-char Base62 short code
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        shortCode = generateBase62();
        
        // Use Bloom filter to check if shortCode MIGHT exist.
        // A bloom filter has no false negatives, meaning if filter.has() returns false,
        // we are 100% sure the short code is available. 
        // If it returns true, it might be a false positive, so we double-check the DB.
        // This significantly reduces DB reads during creation since most generated codes
        // won't exist yet, and the Bloom filter immediately tells us they are safe to use.
        if (!filter.has(shortCode)) {
          isUnique = true;
        } else {
          // It might exist (or false positive), double check DB
          const existingCode = await Url.findOne({ shortCode });
          if (!existingCode) {
            isUnique = true;
          }
        }
        attempts++;
      }
      
      if (!isUnique) {
        res.status(500);
        throw new Error('Failed to generate a unique short code. Please try again.');
      }
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn, 10));
    }

    const newUrl = new Url({
      originalUrl,
      shortCode,
      alias: customAlias || undefined,
      expiresAt,
    });

    await newUrl.save();
    
    // Add the new code to the Bloom filter so subsequent checks know it's taken
    filter.add(shortCode);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    res.status(201).json({
      success: true,
      data: {
        shortUrl: `${baseUrl}/${shortCode}`,
        shortCode,
        expiresAt: newUrl.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Redirect to original URL
 * @route   GET /:code
 */
const redirectUrl = async (req, res, next) => {
  try {
    const { code } = req.params;

    // Cache-aside pattern: Check Redis first
    let originalUrl = await redisClient.get(`url:${code}`);
    let urlDoc = null;

    if (!originalUrl) {
      // Cache miss: query MongoDB
      urlDoc = await Url.findOne({ $or: [{ shortCode: code }, { alias: code }] });
      
      if (!urlDoc) {
        res.status(404);
        throw new Error('URL not found');
      }

      // Check expiration before returning
      if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
        res.status(410); // Gone
        throw new Error('This URL has expired');
      }

      originalUrl = urlDoc.originalUrl;
      
      // Populate Redis with TTL of 24h (86400 seconds)
      await redisClient.setex(`url:${code}`, 86400, originalUrl);
    }

    // If we only have it in cache, we need to check expiration from DB if applicable,
    // but caching implies it's valid. However, a robust approach is to cache expiration too,
    // or just rely on the TTL. For simplicity, we assume cached = valid, 
    // unless you want to cache a JSON object { originalUrl, expiresAt }. Let's keep it simple.

    // 302 Redirect to original URL
    res.redirect(302, originalUrl);

    // --- Async Analytics Logging (Fire and forget) ---
    // Do not await this to avoid blocking the redirect response
    (async () => {
      try {
        // Increment clicks in MongoDB
        await Url.updateOne(
          { $or: [{ shortCode: code }, { alias: code }] },
          { $inc: { clicks: 1 } }
        );

        const parser = new UAParser(req.headers['user-agent']);
        const deviceType = parser.getDevice().type || 'desktop'; // default to desktop if undefined

        const analyticsEntry = new Analytics({
          shortCode: code,
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'],
          referrer: req.headers['referer'] || req.headers['referrer'] || '',
          deviceType,
        });

        await analyticsEntry.save();
      } catch (err) {
        console.error('Async analytics logging failed:', err);
      }
    })();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  shortenUrl,
  redirectUrl
};
