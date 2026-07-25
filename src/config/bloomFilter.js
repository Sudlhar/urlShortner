const { BloomFilter } = require('bloom-filters');
const Url = require('../models/Url');

// Initialize BloomFilter (capacity: 100000, error rate: 0.01)
// Bloom filters are probabilistic data structures that can efficiently check
// if an element might be in a set or definitely is not in a set.
// This reduces DB reads by allowing us to quickly check if a short code
// is already taken before attempting a DB insert.
const filter = BloomFilter.create(100000, 0.01);

const initBloomFilter = async () => {
  try {
    // On server start, load all existing shortCodes from MongoDB into the filter
    const urls = await Url.find({}, 'shortCode');
    
    urls.forEach((url) => {
      filter.add(url.shortCode);
    });
    
    console.log(`Bloom filter initialized with ${urls.length} existing codes.`);
  } catch (error) {
    console.error('Failed to initialize Bloom filter:', error);
  }
};

module.exports = {
  filter,
  initBloomFilter
};
