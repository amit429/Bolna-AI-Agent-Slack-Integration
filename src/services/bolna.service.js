const axios = require('axios');

async function fetchBolnaExecution(executionId, env) {
  if (!env.bolnaApiUrl || !env.bolnaApiKey) {
    throw new Error('Bolna API configuration missing (BOLNA_API_URL or BOLNA_API_KEY)');
  }

  const url = `${env.bolnaApiUrl.replace(/\/$/, '')}/executions/${encodeURIComponent(executionId)}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${env.bolnaApiKey}` },
    timeout: 5000
  });

  return response.data || {};
}

module.exports = {
  fetchBolnaExecution
};
