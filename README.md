# Algosphere

## Frontend environment
Set these variables in `frontend/.env` before running the frontend:

- `VITE_API_URL` (backend base URL, e.g. `http://localhost:8000`)
- `VITE_RUNNER_URL` (optional, IDE runner base URL, e.g. `http://localhost:4002`)

## Backend email (OTP)
To enable OTP emails for password reset, set these env vars for the backend:

- `SMTP_HOST` (e.g. `smtp.gmail.com`)
- `SMTP_PORT` (e.g. `587`)
- `SMTP_USER` (your SMTP username/email)
- `SMTP_PASS` (your SMTP app password)
- `SMTP_FROM` (optional from address)
- `SMTP_USE_TLS` (`true`/`false`, default `true`)
