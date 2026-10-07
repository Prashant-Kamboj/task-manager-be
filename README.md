# Task Manager API

TypeScript/Express backend using Supabase for Postgres and authentication.

## Setup

1. Copy `.env.example` to `.env` and add your Supabase project URL, **publishable key**, server-only **secret key**, and the frontend origin in `CORS_ORIGINS`. Do not commit `.env` or use the secret key in a frontend.
2. Apply [`supabase/migrations/20261005000000_initial_schema.sql`](supabase/migrations/20261005000000_initial_schema.sql) to your Supabase database.
3. Run `npm run dev`.

Use `npm run typecheck` for strict type validation and `npm run build` to compile TypeScript into `dist/` for `npm start`.

`GET /health` is public. All workspace routes require `Authorization: Bearer <access-token>`.

## Authentication endpoints

| Method | Path | Body |
| --- | --- | --- |
| POST | `/api/v1/auth/sign-up` | `{ "email", "password", "fullName?" }` |
| POST | `/api/v1/auth/sign-in` | `{ "email", "password" }` |
| POST | `/api/v1/auth/refresh` | `{ "refreshToken" }` |

Sign-in and refresh return an access token and a refresh token. On refresh, replace both client-side values: Supabase rotates refresh tokens. A production browser application should keep the refresh token in an HttpOnly, Secure cookie rather than JavaScript-readable storage.

| Method | Path | Role required |
| --- | --- | --- |
| GET | `/api/v1/workspaces` | member |
| POST | `/api/v1/workspaces` | authenticated |
| GET | `/api/v1/workspaces/:workspaceId` | member |
| PATCH | `/api/v1/workspaces/:workspaceId` | owner or admin |
| DELETE | `/api/v1/workspaces/:workspaceId` | owner |

When a workspace is created, the authenticated actor becomes its owner.
