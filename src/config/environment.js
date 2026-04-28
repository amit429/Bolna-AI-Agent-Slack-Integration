require('dotenv').config();

function required(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  port: Number(process.env.PORT || 3000),
  slackWebhookUrl: required(process.env.SLACK_WEBHOOK_URL, 'SLACK_WEBHOOK_URL'),
  bolnaApiUrl: process.env.BOLNA_API_URL || '',
  bolnaApiKey: process.env.BOLNA_API_KEY || ''
};

module.exports = {
  env
};
