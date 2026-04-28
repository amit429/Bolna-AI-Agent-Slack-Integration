# Bolna -> Slack Bridge

This service receives Bolna call-completed webhooks and posts a formatted summary to a Slack channel via an Incoming Webhook.

## Project Structure

- [package.json](package.json)
- [.env.example](.env.example)
- [src/index.js](src/index.js)
- [.gitignore](.gitignore)

## Setup

1. Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
# then edit .env and set SLACK_WEBHOOK_URL
```

2. Install dependencies:

```bash
npm install
```

3. Run (development):

```bash
npm run dev
```

Or production:

```bash
npm start
```

## Local testing with ngrok

1. Start the server locally (default port 3000 or set `PORT` in `.env`).
2. Run ngrok to expose the port:

```bash
ngrok http 3000
```

3. Use the forwarded ngrok URL to set Bolna's webhook or test with curl.

## Bolna API (optional)

If Bolna sends only a notification (for example only `status` and `id`) and does not include `transcript` or other details, this bridge can fetch execution details from Bolna's API before posting to Slack. To enable this, add the following to your `.env`:

```
# Bolna API base URL
BOLNA_API_URL=https://api.bolna.example

# Bolna API key (used as Bearer token)
BOLNA_API_KEY=your_api_key_here
```

When enabled, the server will attempt to GET `/executions/:id` on the `BOLNA_API_URL` and merge returned fields into the Slack message.

## Sample curl (local)

```bash
curl -X POST http://localhost:3000/webhook/bolna \
  -H 'Content-Type: application/json' \
  -d '{"status":"completed","id":"exec_123","agent_id":"agent_456","duration":128,"transcript":"Hello, this is a sample transcript."}'
```

## Field mapping (Bolna -> Slack)

- **`id`**: Execution ID -> shown as *Execution ID*
- **`agent_id`**: Agent identifier -> shown as *Agent ID*
- **`duration`**: Conversation time (seconds) -> shown as *Duration*
- **`transcript`**: Conversation transcript -> shown in the *Transcript* block (fallback text if missing)

## Security & Notes

- No secrets are hard-coded. Use the `.env` file to set `SLACK_WEBHOOK_URL` and `PORT`.
- The endpoint only processes payloads with `status: "completed"`.
- The server responds with `400` for malformed payloads and `200` for ignored (non-completed) events.
 - If webhook fields are incomplete, the bridge will attempt to fetch execution details from Bolna when `BOLNA_API_URL` and `BOLNA_API_KEY` are provided.
