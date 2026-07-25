const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle specific MongoDB or Mongoose errors if needed
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate key error';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

module.exports = errorHandler;
