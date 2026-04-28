const { env } = require('../config/environment');
const { extractBolnaFields, buildSlackBlocks } = require('../utils/bolna.utils');
const { fetchBolnaExecution } = require('../services/bolna.service');
const { sendSlackMessage } = require('../services/slack.service');

async function handleBolnaWebhook(req, res, next) {
  try {
    const result = extractBolnaFields(req.body);

    if (!result.ok) {
      if (result.error === 'Status not completed') {
        return res.status(200).json({ message: 'Webhook ignored: status not completed' });
      }

      return res.status(400).json({ error: result.error });
    }

    let { id, agent_id, duration, transcript } = result.data;

    if (!agent_id || duration === undefined || duration === null || !transcript || String(transcript).trim() === '') {
      try {
        const remote = await fetchBolnaExecution(id, env);
        agent_id = agent_id || remote.agent_id;
        duration = duration === undefined || duration === null ? remote.duration : duration;
        transcript = transcript && String(transcript).trim() ? transcript : remote.transcript;
      } catch (fetchError) {
        console.error('Failed to fetch Bolna execution:', fetchError && fetchError.stack ? fetchError.stack : fetchError);
        return res.status(502).json({ error: 'Failed to retrieve execution details from Bolna' });
      }
    }

    const blocks = buildSlackBlocks({ id, agent_id, duration, transcript });
    await sendSlackMessage(env.slackWebhookUrl, blocks);

    return res.status(200).json({ message: 'Slack notification sent' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  handleBolnaWebhook
};
