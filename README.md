# BSMS — Building & Society Management System

## Frontend

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production build
```

## Backend

```bash
cd backend
uv sync                    # Install dependencies
uv run uvicorn app.main:app --reload     # Dev server on http://localhost:8000
uv run uvicorn app.main:app              # Production
```

### Seed super admin (platform)

Set `ALLOW_SEED=true` in `backend/.env` (enabled by default in development), then:

```bash
curl -X POST http://localhost:8000/auth/seed
```

> Super admin: `superadmin@bsms.com` / `superadmin123` → open http://localhost:5173 and sign in as **Platform**

From the super admin portal you can:

- Create buildings (societies)
- Create society admin accounts per building
- Enable or disable buildings (disabled buildings block society admin login)

Society admins sign in as **Society Admin**, manage units/members/billing for their building only.

### Security

Copy `backend/.env.example` to `backend/.env` and set a strong `SECRET_KEY`.

| Setting | Purpose |
|---------|---------|
| `SECRET_KEY` | JWT signing key — must be changed in production |
| `ENVIRONMENT` | Set to `production` to enforce startup security checks |
| `ALLOW_SEED` | Must be `false` in production (seed endpoint returns 404) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `LOGIN_RATE_LIMIT_*` | Brute-force protection on `/auth/login` |

**Authorization:** Admin and resident roles are enforced on every API route. Residents can only read their own member profile, unit, invoices, and notices.

### API docs

Once running, visit http://localhost:8000/docs
