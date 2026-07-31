# Bhava Admin Panel

Standalone admin dashboard for managing Bhava's tile content (Sacred Wisdom, Daily Sacred, Paths of Dharmic, Living Wisdom, Products). Talks to the [bhava-backend](../bhava-backend) API over `/api/admin/*`.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to the backend URL
npm run dev
```

Login at `/login`, dashboard at `/`.
