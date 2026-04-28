function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(error, _req, res, _next) {
  console.error('Unhandled error:', error && error.stack ? error.stack : error);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = {
  notFoundHandler,
  errorHandler
};