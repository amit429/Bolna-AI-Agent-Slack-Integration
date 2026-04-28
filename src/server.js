const { createApp } = require('./app');
const { env } = require('./config/environment');

function startServer() {
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Bolna -> Slack bridge listening on port ${env.port}`);
  });
}

module.exports = {
  startServer
};
