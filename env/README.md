# Vercel environment samples

Use these files to import env vars into Vercel. **Do not put real passwords in the committed samples.**

## Files

| File | Vercel environment | Domain |
|------|-------------------|--------|
| `vercel-production.sample.env` | **Production** | `app.martinskarate.in` |
| `vercel-preview.sample.env` | **Preview** | `test.martinskarate.in` |

## Import steps

1. Copy a sample file and fill in real values (MongoDB URI, secrets, admin login).
2. In Vercel: **Project → Settings → Environment Variables → Import .env**
3. Upload the file.
4. Choose **Production** or **Preview** (import each file separately).
5. **Redeploy** after importing.

## Seed admin (once per environment)

Production:

```bash
curl -X POST https://app.martinskarate.in/api/admin/seed-users \
  -H "x-seed-secret: YOUR_PRODUCTION_SEED_SECRET"
```

Preview / staging:

```bash
curl -X POST https://test.martinskarate.in/api/admin/seed-users \
  -H "x-seed-secret: YOUR_PREVIEW_SEED_SECRET"
```

## Notes

- Use **separate** `MONGO_URI`, `JWT_SECRET`, and `SEED_SECRET` for production vs preview.
- `ADMIN_*` vars are only needed until the admin account is seeded; you can remove them later.
- If `test.martinskarate.in` redirects to Vercel SSO login, turn off **Deployment Protection** for Preview in Vercel project settings.
