# web-app-tester integration

[web-app-tester](https://xianix-team.github.io/documentation/official-plugins/web-app-tester/) is an agent that drives a real browser against a **deployed URL** and reports back on a PR. It is not a test-suite runner — it does not execute `npm run test:e2e`.

**Related:** [Testing guide](./testing-guide.md) · [Authentication](./features/authentication.md) · [Mock API](./mock-api.md)

---

## How it works

1. **Triggered** by a PR label (`ai-dlc/pr/test-web-app`), a PR opening, or `/test-web-app pr <n>`
2. **Gathers context** — reads the PR, finds a test plan in the comments, or generates one if none exists
3. **Runs** — writes a Python/Playwright script on the fly, drives headless Chromium against the configured URL, captures screenshots
4. **Reports** — posts one comment: URL tested, per-step status table, and an overall `PASSED` / `FAILED` / `BLOCKED`

Statuses mean specific things: `BLOCKED` covers a step that failed after retries, was skipped as read-only, or hit an auth gate. **Blocked never means "passed"** — an auth failure will not be reported as success.

## Configuration

[`.web-app-tester.json`](../.web-app-tester.json) at the repo root:

```json
{
  "defaultEnvironment": "preview",
  "environments": {
    "preview": {
      "baseUrl": "http://localhost:5173",
      "mutationsAllowed": true,
      "storageStates": {
        "admin": "tests/e2e/.auth/admin.json",
        "user": "tests/e2e/.auth/user.json"
      },
      "defaultRole": "user"
    }
  },
  "authSetupCommand": "npm run auth:refresh"
}
```

`preview` points at the deployed Vercel URL and is the default; `local` exists for running the plugin against a dev server on the same machine (`--env local`).

Without this file the plugin scrapes a URL out of PR comments and runs **unauthenticated**, which for this app means it never gets past the sign-in screen.

### Vercel Deployment Protection

Vercel enables **Deployment Protection** on preview deployments by default for team accounts. Protected URLs return `302` to `vercel.com/sso-api` instead of the app, so the plugin's browser lands on a Vercel login page and reports every step `BLOCKED`.

Check with:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://<preview-url>/sign-in
```

A `302` to `vercel.com/sso-api` means protection is on. Two fixes:

- **Disable it** — Vercel → project → Settings → Deployment Protection → Vercel Authentication → *Disabled* (or *Only Production*). Reasonable for this app: no real data, no real backend, and the seeded credentials are already public.
- **Bypass token** — enable *Protection Bypass for Automation* and pass the secret as an `x-vercel-protection-bypass` header or query param. Keeps previews private, but the plugin must be able to send it.

## Authentication

The app keeps its session in `localStorage` (`tta.token`, `tta.user`), and Playwright's `storageState` captures `localStorage` alongside cookies — so a stored state restores a signed-in session directly.

Generate the files:

```bash
npm run dev          # in one terminal
npm run auth:refresh # in another
```

This writes `tests/e2e/.auth/user.json` and `admin.json` by signing in through the real UI. The plugin re-runs it automatically via `authSetupCommand` when a session has expired.

**These files are session credentials and are gitignored.** Never commit them.

Roles map to the seeded accounts in [Authentication](./features/authentication.md#accounts): `user` for standard access, `admin` to reach [`/admin`](./features/admin.md).

## Mutations and reset

`mutationsAllowed: true` is safe here because this app has no real backend — data lives in `localStorage` and any run can be reset. That would be the wrong setting against a shared staging environment.

`ENVIRONMENT=production` forces read-only mode regardless of config.

Because the plugin generates its own steps, it may leave products created or deleted. Appending `?reset=true` to a URL restores seed state before the app boots — worth including in a generated test plan's first step. See [Mock API — resetting state](./mock-api.md#resetting-state).

## Webhook rules

The webhook config routes GitHub events to the plugin. Rules read fields out of the event payload:

```
action==labeled && label.name=='ai-dlc/pr/test-web-app' && pull_request.state=='open'
```

> **If rules never match:** check that the GitHub webhook's **Content type** is `application/json`, not `application/x-www-form-urlencoded`. The form encoding wraps the JSON in a `payload=` field, so it arrives as a String, cannot be parsed, and no rule can match — the reported symptom is *"payload could not be parsed as JSON (type: String)"*.

## Requirements

Handled on the plugin's side, not in this repo:

- Python 3.10+ and the Playwright Python package
- `gh` CLI authenticated, or an Azure DevOps PAT
- A GitHub token with read/write on Pull requests and Issues

## Relationship to the Playwright suite

Two different things, both useful:

| | `npm run test:e2e` | web-app-tester |
|---|---|---|
| Runs | Committed specs in [`e2e/`](../e2e/) | Steps the agent generates per PR |
| Against | A dev server it starts itself | A deployed URL |
| Browsers | Chromium, Firefox, WebKit | Headless Chromium |
| Reports to | Terminal and HTML report | A PR comment |

The committed suite catches regressions deterministically; the plugin explores each PR's specific changes. Neither replaces the other.
