# URL Shortener API

A production-ready URL Shortener REST API built with Node.js, Express, MongoDB, and Redis.

## Architecture & Design Decisions

### Bloom Filter for Short Codes
Before generating a short code and attempting a write to MongoDB, we check if the code exists using a **Bloom filter**. A Bloom filter is a probabilistic data structure that provides a fast way to know if an item is *definitely not* in the set, or *might be* in the set.
This significantly reduces DB read pressure because checking uniqueness of a random short code typically requires a DB lookup. Since false negatives are impossible, if the Bloom filter says a code is available, we are 100% sure we can proceed without querying the DB first. We only fall back to checking the DB if the Bloom filter returns `true` (indicating a possible collision or a false positive).

### Cache-Aside Pattern
When a user attempts to resolve a short URL, the application first checks the **Redis cache**. If the URL exists in the cache, we immediately redirect the user, saving a MongoDB query. If there is a cache miss, we query MongoDB, populate Redis with a 24-hour TTL, and then redirect. This ensures the fastest possible resolution for frequently accessed links.

### Asynchronous Analytics Logging
Analytics (such as click tracking, IP, user-agent parsing) are handled asynchronously after the redirect response has already been sent to the user. We implement this using "fire and forget" promises wrapped in `try/catch`. This means analytics operations do not block the redirection logic, keeping latencies extremely low.

## Setup Instructions

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up Environment Variables:**
   Ensure you have a `.env` file in the root directory (one is provided by default):
   ```env
   MONGO_URI=mongodb://localhost:27017/url-shortener
   REDIS_URL=redis://localhost:6379
   BASE_URL=http://localhost:3000
   PORT=3000
   ```
4. **Ensure MongoDB and Redis are running** on your local machine or update the `.env` URIs accordingly.
5. **Start the server:**
   ```bash
   node src/server.js
   ```

## API Endpoints

### 1. Health Check
Check the status of the server, MongoDB, and Redis.
```bash
curl http://localhost:3000/health
```

### 2. Shorten URL
Create a short URL.
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'
```
With custom alias and expiration (e.g., 7 days):
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.github.com", "customAlias": "ghub", "expiresIn": 7}'
```

### 3. Redirect
Navigate to the short code (or alias) in your browser, or use curl:
```bash
curl -i http://localhost:3000/<shortCode>
```

### 4. Get Analytics
Retrieve analytics for a specific short code (total clicks, last 7 days, top referrers, device breakdown).
```bash
curl http://localhost:3000/api/analytics/<shortCode>
```
