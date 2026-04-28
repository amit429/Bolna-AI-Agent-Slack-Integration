const express = require('express');
const { bolnaRouter } = require('./routes/bolna.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/webhook', bolnaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
