require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const { initBloomFilter } = require('./config/bloomFilter');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Bloom Filter
    await initBloomFilter();

    // Health check endpoint
    app.get('/health', async (req, res) => {
      let redisStatus = 'disconnected';
      try {
        await redisClient.ping();
        redisStatus = 'connected';
      } catch (err) {
        redisStatus = 'error';
      }

      res.status(200).json({
        success: true,
        data: {
          server: 'running',
          mongo: 'connected', // if we reached here, mongoose is connected
          redis: redisStatus,
        }
      });
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
