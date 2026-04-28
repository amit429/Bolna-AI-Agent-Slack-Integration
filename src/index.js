// Bolna -> Slack bridge (Express)
// - Receives Bolna call-completed webhooks
// - Formats selected fields into Slack Block Kit
// - Posts to Slack Incoming Webhook

require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const BOLNA_API_URL = process.env.BOLNA_API_URL;
const BOLNA_API_KEY = process.env.BOLNA_API_KEY;

if (!SLACK_WEBHOOK_URL) {
	console.error('ERROR: SLACK_WEBHOOK_URL is not set in environment. Exiting.');
	process.exit(1);
}

/**
 * Validate minimal Bolna payload shape and extract fields.
 * Returns an object { ok: boolean, error?: string, data?: { id, agent_id, duration, transcript }}
 */
function extractBolnaFields(body) {
	if (!body || typeof body !== 'object') {
		return { ok: false, error: 'Invalid JSON payload' };
	}

	if (body.status !== 'completed') {
		return { ok: false, error: 'Status not completed' };
	}

	const { id, agent_id, duration, transcript } = body;

	if (!id) return { ok: false, error: 'Missing execution id' };

	// agent_id, duration and transcript may be missing from the webhook;
	// we'll try to fetch them from Bolna API if needed
	return { ok: true, data: { id, agent_id, duration, transcript } };
}

/**
 * Fetch execution details from Bolna API when the webhook provides only an id/notification.
 * Expects the API to return an object containing at least some of: id, agent_id, duration, transcript
 */
async function fetchBolnaExecution(executionId) {
	if (!BOLNA_API_URL || !BOLNA_API_KEY) {
		throw new Error('Bolna API configuration missing (BOLNA_API_URL or BOLNA_API_KEY)');
	}

	const url = `${BOLNA_API_URL.replace(/\/$/, '')}/executions/${encodeURIComponent(executionId)}`;

	const response = await axios.get(url, {
		headers: { Authorization: `Bearer ${BOLNA_API_KEY}` },
		timeout: 5000
	});

	return response.data;
}

/**
 * Build Slack Block Kit payload for the call summary
 */
function buildSlackBlocks({ id, agent_id, duration, transcript }) {
	const safeTranscript = transcript && String(transcript).trim().length > 0
		? transcript
		: '_No transcript provided._';

	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Bolna Call Summary*\n*Execution ID:* ${id}\n*Agent ID:* ${agent_id}\n*Duration:* ${duration} seconds`
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

app.post('/webhook/bolna', async (req, res) => {
	try {
		const result = extractBolnaFields(req.body);

		if (!result.ok) {
			if (result.error === 'Status not completed') {
				return res.status(200).json({ message: 'Webhook ignored: status not completed' });
			}
			return res.status(400).json({ error: result.error });
		}

		let { id, agent_id, duration, transcript } = result.data;

		// If important fields are missing, try to fetch execution details from Bolna API
		if (!agent_id || duration === undefined || duration === null || !transcript || String(transcript).trim() === '') {
			try {
				const remote = await fetchBolnaExecution(id);
				agent_id = agent_id || remote.agent_id;
				duration = duration === undefined || duration === null ? remote.duration : duration;
				transcript = transcript && String(transcript).trim() ? transcript : remote.transcript;
			} catch (fetchError) {
				console.error('Failed to fetch Bolna execution:', fetchError && fetchError.stack ? fetchError.stack : fetchError);
				return res.status(502).json({ error: 'Failed to retrieve execution details from Bolna' });
			}
		}

		const blocks = buildSlackBlocks({ id, agent_id, duration, transcript });

		await axios.post(SLACK_WEBHOOK_URL, { blocks });

		return res.status(200).json({ message: 'Slack notification sent' });
	} catch (error) {
		console.error('Handler error:', error && error.stack ? error.stack : error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

app.listen(PORT, () => {
	console.log(`Bolna -> Slack bridge listening on port ${PORT}`);
});
