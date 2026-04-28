function extractBolnaFields(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON payload' };
  }

  if (body.status !== 'completed') {
    return { ok: false, error: 'Status not completed' };
  }

  const { id, agent_id, duration, transcript } = body;

  if (!id) {
    return { ok: false, error: 'Missing execution id' };
  }

  return { ok: true, data: { id, agent_id, duration, transcript } };
}

function buildSlackBlocks({ id, agent_id, duration, transcript }) {
  const safeTranscript = transcript && String(transcript).trim().length > 0
    ? transcript
    : '_No transcript provided._';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Bolna Call Summary*\n*Execution ID:* ${id}\n*Agent ID:* ${agent_id || 'N/A'}\n*Duration:* ${duration ?? 'N/A'} seconds`
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Transcript*:\n${safeTranscript}`
      }
    }
  ];
}

module.exports = {
  extractBolnaFields,
  buildSlackBlocks
};
