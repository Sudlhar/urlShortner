const Url = require('../models/Url');
const Analytics = require('../models/Analytics');

/**
 * @desc    Get analytics for a short code
 * @route   GET /api/analytics/:code
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { code } = req.params;

    const urlDoc = await Url.findOne({ $or: [{ shortCode: code }, { alias: code }] });
    if (!urlDoc) {
      res.status(404);
      throw new Error('URL not found');
    }

    const actualShortCode = urlDoc.shortCode; // Use the actual code, not alias, for grouping

    // 1. Total Clicks
    const totalClicks = urlDoc.clicks;

    // 2. Clicks per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clicksPerDay = await Analytics.aggregate([
      {
        $match: {
          shortCode: actualShortCode,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sort by date ascending
    ]);

    // 3. Top Referrers (top 3)
    const topReferrers = await Analytics.aggregate([
      { $match: { shortCode: actualShortCode, referrer: { $ne: '' } } },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // 4. Device Breakdown (mobile/desktop/tablet)
    const deviceBreakdown = await Analytics.aggregate([
      { $match: { shortCode: actualShortCode } },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalClicks,
        clicksPerDay,
        topReferrers,
        deviceBreakdown
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
