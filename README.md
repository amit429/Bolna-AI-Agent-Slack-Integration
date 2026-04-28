# Bolna -> Slack Bridge

This service receives Bolna call-completed webhooks and posts a formatted summary to a Slack channel via an Incoming Webhook.

## Project Structure

- [package.json](package.json)
- [.env.example](.env.example)
- [src/index.js](src/index.js)
- [src/server.js](src/server.js)
- [src/app.js](src/app.js)
- [src/config/environment.js](src/config/environment.js)
- [src/routes/bolna.routes.js](src/routes/bolna.routes.js)
- [src/controllers/bolna.controller.js](src/controllers/bolna.controller.js)
- [src/services/bolna.service.js](src/services/bolna.service.js)
- [src/services/slack.service.js](src/services/slack.service.js)
- [src/utils/bolna.utils.js](src/utils/bolna.utils.js)
- [src/utils/retry.utils.js](src/utils/retry.utils.js)
- [src/middleware/error.middleware.js](src/middleware/error.middleware.js)
- [Dockerfile](Dockerfile)
- [docker-compose.yml](docker-compose.yml)
- [.dockerignore](.dockerignore)
- [.gitignore](.gitignore)

## Setup

1. Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
# then edit .env and set SLACK_WEBHOOK_URL and BOLNA_API_KEY
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

## Docker Support

You can run the bridge in Docker for a consistent local setup and easy deployment.

### Build and run with Docker Compose

1. Make sure your `.env` file exists and includes at least `SLACK_WEBHOOK_URL` and `BOLNA_API_KEY`.
2. Build and start the container:

```bash
docker compose up --build
```

3. The service will be available on `http://localhost:3000`.

### Stop the container

```bash
docker compose down
```

### What the Docker setup does

- Uses `node:20-alpine` as a lightweight base image.
- Installs only production dependencies inside the image.
- Reads runtime config from `.env` via `env_file` in `docker-compose.yml`.
- Exposes port `3000` so the webhook can receive Bolna requests.

### Production note

If you deploy this container to a server or platform, make sure the public URL points to:

```text
https://<your-host>/webhook/bolna
```

For local testing behind ngrok, point Bolna to your ngrok URL instead.

## Configure Bolna agent

After the local server is running, configure your Bolna agent to send webhook events to this bridge.

1. **Create or open an agent in Bolna**
  - Sign in to your Bolna dashboard.
  - Create a new agent or open an existing one that will handle calls.

2. **Open the agent analytics / webhook settings**
  - In the agent configuration, look for the analytics, integrations, or webhook section.
  - Add the webhook URL for this service:

```text
https://<your-public-url>/webhook/bolna
```

  - If you are testing locally, use your ngrok forwarding URL.

3. **Save the agent configuration**
  - Ensure the webhook is enabled for completed call events.
  - Confirm the payload includes `status: "completed"`.

4. **Verify the payload format**
  - The bridge expects:
    - `id`
    - `agent_id`
    - `transcript` (if available)
    - `telephony_data.duration`
  - If `transcript` is missing, the bridge can fetch extra details from Bolna API when configured.

## Local testing with ngrok

1. Start the server locally (default port 3000 or set `PORT` in `.env`).
2. Run ngrok to expose the port:

```bash
ngrok http 3000
```

3. Use the forwarded ngrok URL to set Bolna's webhook or test with curl.

### Recommended webhook URL for Bolna

When configuring the agent webhook, use this exact path:

```text
https://<your-ngrok-domain>/webhook/bolna
```

If you deploy the service publicly, replace the ngrok domain with your hosted domain.

## Bolna API URL(optional)

If Bolna sends only a notification (for example only `status` and `id`) and does not include `transcript` or other details, this bridge can fetch execution details from Bolna's API before posting to Slack. To enable this, add the following to your `.env`:

```
# Bolna API base URL
BOLNA_API_URL=https://api.bolna.ai
```

When enabled, the server will attempt to GET `/executions/:id` on the `BOLNA_API_URL` and merge returned fields into the Slack message.

## Sample curl (local)

```bash
curl -X POST http://localhost:3000/webhook/bolna \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "completed",
    "id": "exec_123",
    "agent_id": "agent_456",
    "transcript": "Hello, this is a sample transcript.",
    "telephony_data": {
      "duration": 42
    }
  }'
```

## Field mapping (Bolna -> Slack)

- **`id`**: Execution ID -> shown as *Execution ID*
- **`agent_id`**: Agent identifier -> shown as *Agent ID*
- **`duration`**: Conversation time (seconds) -> shown as *Duration*
- **`transcript`**: Conversation transcript -> shown in the *Transcript* block (fallback text if missing)

## Reliability & Retry Logic

This bridge implements **automatic retry with exponential backoff** to handle transient failures gracefully:

- **Bolna API calls**: Retry up to 3 times with delays of 1s, 2s, 4s (capped at 5s).
- **Slack webhook delivery**: Retry up to 3 times with delays of 0.5s, 1s, 2s (capped at 3s).
- **Retryable errors**: Network failures (timeouts, connection refused), 5xx server errors, 429 (rate limit).
- **Non-retryable errors**: 4xx client errors (bad request, unauthorized, invalid webhook URL) are failed immediately.

This ensures that temporary glitches or network hiccups don't result in lost messages.

## Security & Notes

- No secrets are hard-coded. Use the `.env` file to set `SLACK_WEBHOOK_URL` and `PORT`.
- The endpoint only processes payloads with `status: "completed"`.
- The server responds with `400` for malformed payloads and `200` for ignored (non-completed) events.
- If webhook fields are incomplete, the bridge will attempt to fetch execution details from Bolna when `BOLNA_API_URL` and `BOLNA_API_KEY` are provided.

## End-to-end flow

1. A call completes in Bolna.
2. Bolna sends a webhook to `/webhook/bolna`.
3. This service validates the payload.
4. If needed, the service fetches call details from Bolna API.
5. A formatted Slack Block Kit message is posted to your Slack Incoming Webhook.
