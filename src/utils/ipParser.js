/**
 * Extracts the client IP address from the request object,
 * handling potential proxy headers.
 */
const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs. The first one is the original client.
    return forwardedFor.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || null;
};

module.exports = {
  getClientIp
};
