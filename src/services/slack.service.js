const axios = require('axios');

async function sendSlackMessage(webhookUrl, blocks) {
  await axios.post(webhookUrl, { blocks });
}

module.exports = {
  sendSlackMessage
};
