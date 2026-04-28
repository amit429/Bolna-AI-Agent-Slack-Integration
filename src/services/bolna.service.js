const axios = require('axios');
const { withRetry } = require('../utils/retry.utils');

async function fetchBolnaExecution(executionId, env) {
  if (!env.bolnaApiUrl || !env.bolnaApiKey) {
    throw new Error('Bolna API configuration missing (BOLNA_API_URL or BOLNA_API_KEY)');
  }

  // Use withRetry to gracefully handle transient API failures
  // Bolna API can occasionally experience latency or temporary issues
  return withRetry(
    async () => {
      const url = `${env.bolnaApiUrl.replace(/\/$/, '')}/executions/${encodeURIComponent(executionId)}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${env.bolnaApiKey}` },
        timeout: 5000
      });

      return response.data || {};
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      name: `Bolna fetch (${executionId})`
    }
  );
}

module.exports = {
  fetchBolnaExecution
};
