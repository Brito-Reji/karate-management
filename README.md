# Karate Management

Admin portal for Martins Karate Academy — dojos, students, belt tests, and staff accounts.

## Getting Started (local)

1. Copy env vars into `.env` or `.env.local`:

```bash
MONGO_URI=mongodb+srv://...your-dev-database...
JWT_SECRET=a-long-random-dev-secret
SEED_SECRET=a-local-seed-secret
```

2. Install and run:

```bash
npm install
npm run dev
```

3. Seed staff users once (requires `SEED_SECRET`):

```bash
curl -X POST http://localhost:3000/api/admin/seed-users \
  -H "x-seed-secret: a-local-seed-secret"
```

4. Log in at [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

| Role | Email / Phone | Password |
|------|---------------|----------|
| Admin | `martinskarateacademy@gmail.com` / `9999999999` | `martinskarateoffical@123` |
| Instructor | `priya@martinskarate.com` / `8888888888` | `instructor@123` |

Admins can add more staff under **Staff** in the sidebar.

## Deploy on Vercel

Dev and production use **separate** MongoDB databases and env vars. Local `.env` is never used by Vercel.

### 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you want):

| Name | Value |
|------|--------|
| `MONGO_URI` | Production MongoDB connection string (not your local/dev DB) |
| `JWT_SECRET` | Long random secret, different from local |
| `SEED_SECRET` | Secret used only for one-time user seeding |

After saving, **Redeploy** so the new vars apply.

### 2. Deploy

Push to the branch Vercel watches, or trigger a redeploy from the dashboard. Wait until the deployment is Ready.

### 3. Seed production users (once)

```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin/seed-users \
  -H "x-seed-secret: YOUR_PRODUCTION_SEED_SECRET"
```

Without the correct `x-seed-secret` header, seeding returns 401. If `SEED_SECRET` is unset on Vercel, seeding is disabled (403).

### 4. Log in on production

Open `https://YOUR-APP.vercel.app/admin/login` with the seeded admin credentials, then use **Staff** to add real instructors with strong passwords.

### 5. After go-live

- Prefer adding staff via the Staff page (passwords are bcrypt-hashed).
- You can remove `SEED_SECRET` from Vercel later to fully disable the seed endpoint.
- Do not reuse the default seed passwords on a real public site — change them after first login or create new admin accounts and retire the seed users.

## Security notes

- Passwords are hashed with bcrypt. Legacy plain-text passwords still work once, then are upgraded on login.
- `/api/admin/seed-users` requires `x-seed-secret`.
- Student and admin dojo APIs require a logged-in admin or instructor.
- Staff management (`/api/admin/users` and `/admin/staff`) is admin-only.
