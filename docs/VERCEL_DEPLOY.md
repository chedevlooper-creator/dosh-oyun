# Vercel Deployment Guide

This project is configured for Vercel deployment via GitHub Actions.
Two deployment paths are wired up:

| Event | Environment | Branch |
|-------|-------------|--------|
| Pull request (PR) | Preview URL | PR head |
| Push to `main` | Production | main |

## One-time setup

You need three GitHub repository secrets. Get them from the Vercel
dashboard, then add them under **Settings → Secrets and variables →
Actions → New repository secret**.

### 1. `VERCEL_TOKEN`

1. Go to <https://vercel.com/account/tokens>
2. Click **Create Token**
3. Name: `dosh-oyun-github-actions` (or anything you prefer)
4. Scope: **Full Account** (or scope to the project if you prefer)
5. Copy the token

### 2. `VERCEL_ORG_ID`

1. Go to <https://vercel.com/account>
2. Under **Your Teams**, copy the **Team ID** (or for personal accounts,
   the **User ID** shown under Settings)

### 3. `VERCEL_PROJECT_ID`

1. In the Vercel dashboard, go to your `dosh-oyun` project
2. Open **Settings → General**
3. Copy the **Project ID** under "Project Information"

> If the project doesn't exist yet, create it from the Vercel dashboard
> first. You can either import the GitHub repo (the easier path) or
> create an empty project and link the repo later.

## Linking the project (if not done via dashboard)

```bash
npm i -g vercel
vercel link
# answer prompts: link to existing project, confirm scope
vercel env pull  # syncs env vars to .env.local
```

This writes `.vercel/project.json` containing `orgId` and `projectId`
that match the secrets above. The workflow does NOT need this file
(IDs come from secrets), but it's useful for local `vercel` commands.

## Triggering a deploy

- **PR preview:** open or push to a PR targeting `main` (or
  `hardening/2026-bar`). The bot will comment on the PR with a preview
  URL once the workflow finishes.
- **Production:** merge to `main`. The `deploy-production` job runs
  after tests pass and updates the live site.

## Vercel project settings that matter

- **Framework Preset:** Vite (auto-detected from `vercel.json`)
- **Build Command:** `npm run build` (from `vercel.json`)
- **Output Directory:** `dist` (from `vercel.json`)
- **Node.js Version:** 20.x (matches `engines.node` in `package.json`)

## Environment variables

If you set up Sentry, define in the Vercel dashboard under
**Settings → Environment Variables**:

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_SENTRY_DSN` | Your Sentry project DSN | Production + Preview |
| `VITE_SENTRY_DSN` | (optional separate dev DSN) | Development |

`VITE_*` vars are inlined at build time, so changing them requires a
rebuild — which the GitHub Action handles automatically on every push.

## Workflow file

See `.github/workflows/vercel-deploy.yml`. The same job runs the test
suite (`npm run lint && npm test && npm run test:e2e && npm run build`)
before deploying, so a failing build never reaches Vercel.
