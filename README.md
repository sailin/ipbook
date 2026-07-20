# IP Book

A lightweight Nuxt 3 app for tracking public IP addresses of your hosts and VMs. Each host periodically reports in via a simple HTTP GET request; the server records IPs and maintains a change timeline for whitelisted hosts.

## How it works

```
host/VM ──GET /api/report?name=my-vm-01──▶ IP Book Server ──▶ MongoDB
```

- **Whitelisted hosts** get full IP history — each IP change creates a timeline entry with first-seen, last-seen, and duration in days.
- **Unknown hosts** get a last-seen record with a running report count. You can whitelist them later from the admin panel.

## Quick Start (dev)

```bash
npm install
npm run dev        # → http://localhost:3000
```

First login at `/login` creates the admin account. Then visit `/admin` to whitelist hosts.

## Deployment

### 1. Prerequisites

- Node.js ≥ 20
- MongoDB running (default: `localhost:27017`)

### 2. Configure

Edit `.env`:

```env
MONGO_URI=mongodb://localhost:27017/ipbook
JWT_SECRET=your-random-secret-here
ADMIN_USER=admin
ADMIN_PASS=your-secure-password
```

### 3. Build & seed

```bash
npm install
npm run build
npm run seed        # creates admin user
```

### 4. Start

```bash
npm start           # → http://0.0.0.0:3000
```

For production, set env vars in your process manager — Nuxt doesn't read `.env` at runtime. Example systemd unit:

```ini
[Service]
WorkingDirectory=/path/to/ipbook
Environment="MONGO_URI=mongodb://localhost:27017/ipbook"
Environment="JWT_SECRET=your-random-secret-here"
ExecStart=node .output/server/index.mjs
Restart=always
```

> **Tip:** you can skip the seed step. On first login, any credentials will auto-create the admin account.

## Reporting from a host

Add a cron job or systemd timer on each host:

```bash
*/5 * * * * curl -s "https://your-server/api/report?name=$(hostname)"
```

The server extracts the source IP from the request. No auth needed for the report endpoint.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/ipbook` | MongoDB connection string |
| `JWT_SECRET` | `change-me-in-production` | Secret for signing auth tokens |
| `ADMIN_USER` | `admin` | Seed script admin username |
| `ADMIN_PASS` | `admin123` | Seed script admin password |

## Pages

| Path | Auth | Purpose |
|---|---|---|
| `/` | Yes | Dashboard — whitelisted hosts table + IP timeline |
| `/login` | No | Sign in (first login bootstraps admin) |
| `/admin` | Yes | Manage whitelist, view unknown hosts |
