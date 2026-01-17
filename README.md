# Strativa Rebuild Lead Form

This project serves a static HTML form and a server-side API for capturing rebuild leads. The backend now targets **Cloud Run** (Node/Express) and writes submissions to Supabase.

## Requirements

- Node.js 20+
- Supabase project credentials

## Environment Variables

Create a `.env` file (or set env vars in Cloud Run):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=8080
```

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.

## Local Development

```bash
npm install
npm start
```

The server serves static files from the repository root and exposes:

- `POST /api/rb/lead`

## API Contract

`POST /api/rb/lead` accepts JSON and returns:

- Success: `{ "success": true, "leadId": "<uuid>" }`
- Failure: `{ "success": false, "error": "<message>" }`

Required fields:

- `fullName`
- `primaryPhone`
- `preferredChannel`
- `parish`
- `rebuildType`
- `estimatedBudget`
- `monthlyPayment`

## Cloud Run Deployment

1. Build and deploy the container:

```bash
gcloud run deploy strativa-rebuild \
  --source . \
  --region <region> \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...
```

2. Ensure `PORT` is set to `8080` (default in Dockerfile and `.env.example`).

## Netlify Note (Deprecated)

Netlify redirects/functions are no longer required for production. The app now runs as a single Express service on Cloud Run.
