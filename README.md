# Scalable URL Shortener API

A modern, high-performance, and scalable URL shortener backend built with Node.js, Express, MongoDB, Redis, and Bloom Filters.

## Features

- **URL Shortening**: Generates short, unique base62-encoded aliases for long URLs.
- **High-Performance Redirection**: Caches frequent lookups in Redis for sub-millisecond redirect responses.
- **Bloom Filter Optimization**: Uses a Bloom Filter in-memory check to quickly identify non-existent short codes, preventing database hit spam.
- **Detailed Analytics**: Tracks client details such as IP address, browser/device user-agent, referrer, and timestamps.
- **Rate Limiting**: Protects endpoints against abuse using `express-rate-limit`.
- **Docker & Local Setup Ready**: Easy integration with Redis and MongoDB.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis (ioredis client)
- **Data Structures**: Scalable Bloom Filters (`bloom-filters` library)
- **Analytics Parsing**: `ua-parser-js`

---

## Project Structure

```text
├── src/
│   ├── app.js               # Express application initialization
│   ├── server.js            # Server startup and database connections
│   ├── config/              # Configuration files (DB, Redis, Bloom Filter)
│   ├── controllers/         # Request handling logic (URL, Analytics)
│   ├── middleware/          # Rate limiting, error handling, etc.
│   ├── models/              # Mongoose schemas (URL, Analytics)
│   ├── routes/              # Express API and redirect routes
│   └── utils/               # Helper utilities (Base62 encoder, IP parser)
├── .env                     # Environment variables configuration
├── package.json             # NPM dependencies and scripts
└── README.md                # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd backendProj
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or use the existing one) with the following content:
   ```env
   MONGO_URI=mongodb://localhost:27017/url-shortener
   REDIS_URL=redis://localhost:6379
   BASE_URL=http://localhost:3000
   PORT=3000
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

---

## API Documentation

### 1. Health Check
* Check status of database and Redis connectivity.
* **URL**: `/health`
* **Method**: `GET`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "server": "running",
      "mongo": "connected",
      "redis": "connected"
    }
  }
  ```

### 2. Shorten a URL
* Shorten a target destination URL.
* **URL**: `/api/shorten`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "originalUrl": "https://www.example.com/some/very/long/path/to/resource"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "originalUrl": "https://www.example.com/some/very/long/path/to/resource",
      "shortUrl": "http://localhost:3000/aB3dE",
      "code": "aB3dE"
    }
  }
  ```

### 3. URL Redirection
* Redirect short code to original URL.
* **URL**: `/:code`
* **Method**: `GET`
* **Response**: `302 Found` (redirects browser to original URL)

### 4. Fetch Short URL Analytics
* Retrieve list of visits, referrer details, devices, browsers, and IP data.
* **URL**: `/api/analytics/:code`
* **Method**: `GET`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "code": "aB3dE",
      "totalClicks": 12,
      "clicks": [
        {
          "timestamp": "2026-07-25T10:00:00.000Z",
          "ip": "127.0.0.1",
          "browser": "Chrome",
          "device": "Desktop",
          "referrer": "https://github.com"
        }
      ]
    }
  }
  ```
