const axios = require('axios');
const { withRetry } = require('../utils/retry.utils');

async function sendSlackMessage(webhookUrl, blocks) {
  // Use withRetry to ensure reliable delivery to Slack
  // Network glitches and temporary Slack API issues are handled gracefully with exponential backoff
  return withRetry(
    async () => {
      await axios.post(webhookUrl, { blocks });
    },
    {
      maxAttempts: 3,
      baseDelay: 500,
      maxDelay: 3000,
      name: 'Slack webhook'
    }
  );
}

module.exports = {
  sendSlackMessage
};
