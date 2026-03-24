# agent-kit playground

Live demo of agent-kit — try AI agents in your browser.

## Local Development

```bash
npm install
echo "GOOGLE_AI_API_KEY=your-key-here" > .env.local
npm run dev
```

Open http://localhost:3000

## Deploy to Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/agent-kit-playground
gcloud run deploy agent-kit-playground \
  --image gcr.io/PROJECT_ID/agent-kit-playground \
  --platform managed --region us-central1 \
  --allow-unauthenticated --min-instances 1 \
  --set-env-vars GOOGLE_AI_API_KEY=your-key
```

## Environment Variables

- `GOOGLE_AI_API_KEY` — from [Google AI Studio](https://aistudio.google.com)
- `DATA_DIR` — session storage path (default: `./data/sessions`)
