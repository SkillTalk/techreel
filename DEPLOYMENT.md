Free hosting guide (Cloudflare Pages + Fly.io + MongoDB Atlas)

1) Database (MongoDB Atlas — free M0)
- Create a free cluster (M0).
- Create a DB user and get the connection string (MONGO_URI).
- Temporarily allow all IPs (0.0.0.0/0) for quick start; lock down later.

2) Backend API (Fly.io — free hobby)
- Prereq: install flyctl; login (fly auth signup / fly auth login).
- In repo root (has Dockerfile and fly.toml):
  - fly launch --no-deploy (or fly apps create techreel-api).
  - fly secrets set MONGO_URI="<your string>" JWT_SECRET="<random>" OPENAI_API_KEY="<optional>"
  - fly deploy
- After deploy, note your URL, e.g., https://techreel-api.fly.dev

3) Frontend (Cloudflare Pages — free)
- Connect GitHub repo; framework: React.
- Project directory: techreel/frontend
- Build command: npm ci && npm run build
- Output directory: build
- Environment variables (Pages project → Settings → Environment variables):
  - REACT_APP_API_BASE = https://techreel-api.fly.dev/api
  - REACT_APP_SOCKET_BASE = https://techreel-api.fly.dev

4) Domain, DNS and SSL (Cloudflare — free)
- Add your domain to Cloudflare (or change nameservers to Cloudflare).
- Pages → Custom domains: add www.yourdomain.com to your Pages project.
- Optionally, create api.yourdomain.com CNAME → techreel-api.fly.dev; then set
  - REACT_APP_API_BASE = https://api.yourdomain.com/api
  - REACT_APP_SOCKET_BASE = https://api.yourdomain.com

5) Frontend config
- frontend/src/utils/api.js supports overrides via window._env or CF Pages env vars.
- Local dev stays http://localhost:5001, production uses env or skilltalk.in defaults.

6) Notes
- WebSockets: Fly.io handles HTTPS and WS/WSS; backend CORS already allows * for dev.
- Free tiers can sleep; first request may take seconds. Consider setting 1 VM always-on if needed.

Quick commands (reference)
- fly secrets set MONGO_URI=... JWT_SECRET=... OPENAI_API_KEY=...
- fly deploy
- CF Pages: set REACT_APP_API_BASE / REACT_APP_SOCKET_BASE, then trigger a build.


