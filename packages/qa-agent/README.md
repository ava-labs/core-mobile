# core-mobile-QAi

Slack-based QA AI agent for Core Mobile. Mention `@core-mobile-qai` or DM to use.

---

## Features

| # | Trigger | What it does |
|---|---------|--------------|
| 1 | `today's qa briefing` | Summarizes all tagged interactions from today — numbered list with thread links |
| 2 | `run smoke / regression / performance tests` | Asks branch/tag + test type → triggers Bitrise → returns build URL |
| 3 | *(automatic)* | On test failure, creates a Jira bug ticket per spec file |
| 4 | `create jira bug ticket` | Asks title + priority → creates ticket with Slack thread link attached |
| 5 | `automation daily report` | Fetches TestRail automation results → pass rate + failed test list |
| 6 | `1.0.34 RC status` | Scans channel/thread chatter for RC lifecycle signals (incl. casual store-submission notes) → bugs / manual / automation |
| 7 | `sprint status` / `this sprint` | Check sprint status in Jira |
| 8 | `find the 1D select bug` | Keyword search for Mobile Application component tickets |

---

## Feature Details

### 1 — Today's QA Briefing
- Covers both direct mentions and `@qa-core` group messages
- Messages are stored for **7 days**, then auto-cleared
- Format: numbered list, each item includes who said it + thread link

### 2 — Bitrise Test Trigger
Always asks two things before triggering:
1. **Branch or tag** — `main` / `feat/my-feature` / `1.0.34-rc1`
2. **Test type** — `smoke` / `performance` / `regression-internal` / `regression-external`

> Both iOS and Android always run together. Single-platform runs are not supported.

### 3 — Auto Jira Ticket (from test failure)
- Fires from `wdio.conf.ts` `afterSuite` hook automatically
- One ticket per spec file
- Skips if an open (non-Done) ticket already exists — creates new if status is Done
- Includes: error logs, screenshots, Bitrise build URL
- Fields: `Components = Mobile Application`, `Priority = Medium`, `Parent = CP-14439`

### 4 — Manual Bug Ticket
Flow: title → priority → create

- Duplicate check is **skipped** (same bug can recur)
- Slack thread link is embedded in the description
- Fields: `Components = Mobile Application`, `Parent = CP-32`

### 5 — Automation Daily Report
- Pulls from TestRail Project 3 (automation), filtered by today's date
- Reports: overall pass %, total / passed / failed counts
- Lists failed test titles (spec-level only, no per-test detail)

### 6 — RC Release Status
Three-section report:

| Section | Source |
|---------|--------|
| 🐛 Bug Status | Jira tickets with version string in title |
| 🧪 Manual Testing | TestRail Project 4 — per-run pass% and progress% |
| 🤖 Automation | Latest automation run results |

> Channel scan looks at recent messages/threads (including replies under bot parents) plus Slack search. Casual notes like “submitted to App store…” count. If nothing version-related is found → say RC signals aren't in the channel yet. Add Slack scope `search:read` for search fallback.

### 7 — Sprint status check (Jira)
- Active Mobile sprint (`current` / `this sprint`) or a named sprint (`Mobile Sprint 121`)
- Any status: Done, Declined, To Do, In Progress, Blocked, Code Review, Testing, Backlog — counts and/or ticket lists
- "remaining/open" = unfinished work (excludes Done + Declined)
- Story Points: planned vs completed (+ declined / remaining)

### 8 — Mobile Jira ticket search
- Always filtered to **Component = Mobile Application**
- Keyword / symptom search (e.g. chart `1D` select bug) → matching ticket keys + links
- Includes closed tickets by default so historical bugs are findable

---

## Setup

### Environment Variables

```env
# Anthropic
QA_ANTHROPIC_API_KEY=

# Slack
SLACK_BOT_TOKEN=xoxb-
SLACK_APP_TOKEN=xapp-
SLACK_QA_GROUP_ID=S          # @qa-core subteam ID
SLACK_RC_CHANNEL_ID=C046YF16REU  # team channel for RC status (scans even when asked in DM)

# Bitrise
BITRISE_API_TOKEN=
BITRISE_APP_SLUG=

# Jira
JIRA_BASE_URL=https://ava-labs.atlassian.net
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=CP

# TestRail
TESTRAIL_BASE_URL=https://avalabs.testrail.io
TESTRAIL_EMAIL=
TESTRAIL_API_KEY=
```

### Slack app (required for thread follow-ups without @)

Current bot token already has `channels:history` / `groups:history`. **Missing OAuth scope is usually NOT why no-@ thread replies fail.**

**You must enable Event Subscriptions** (Socket Mode → Event Subscriptions → Subscribe to bot events):
- `app_mention`
- `message.channels` ← required for public-channel thread follow-ups without @
- `message.groups` ← private channels
- `message.im` ← DMs

Then **reinstall the app** to the workspace and ensure the bot is in the channel.

Without `message.channels` / `message.groups`, Slack never delivers those messages — the bot only wakes on `@core-mobile-qai`.

**OAuth scopes (bot) checklist:** `app_mentions:read`, `chat:write`, `channels:history`, `groups:history`, `im:history`, `im:read`, `users:read`, `files:read`, `files:write`.

Optional: `SLACK_USER_TOKEN` (`xoxp-…` with `search:read`) for workspace search fallback. Bot tokens cannot call `search.messages`.

### Run

```bash
npm run dev    # development (ts-node)
npm run build  # compile
npm start      # production
```

### Run on a server with Secrets Manager (Anthropic key)

If `QA_ANTHROPIC_API_KEY` lives in AWS Secrets Manager and operators must not paste the value:

1. Put all **other** vars in `.env` (Slack / Bitrise / Jira / TestRail) — leave Anthropic empty or omit it.
2. Someone with `secretsmanager:GetSecretValue` on secret `QA_ANTHROPIC_API_KEY` runs:

```bash
cd packages/qa-agent
AWS_REGION=us-east-1 ./scripts/start-from-secrets.sh
# or keep it alive: USE_PM2=1 AWS_REGION=us-east-1 ./scripts/start-from-secrets.sh
```

The script never prints the secret value.

### Deploy always-on (ECS Fargate via Bitrise)

Socket Mode → always-on container, no ALB. **Do not run this from a locked-down laptop** — use Bitrise (same AWS keys as Device Farm can reach ECR / ECS / Secrets Manager).

```
Bitrise workflow deploy-mobile-qai
  → docker build + push ECR
  → register ECS task (Slack/Jira/… from Bitrise Secrets)
  → ECS injects QA_ANTHROPIC_API_KEY from Secrets Manager at start
```

| File | Role |
|------|------|
| `Dockerfile` | Image build |
| `deploy/bitrise-deploy.sh` | CI deploy (preferred) |
| `deploy/deploy-fargate.sh` | Local/manual deploy (needs AWS+Docker perms) |
| `deploy/ecs-task-definition.json` | Template reference |
| `deploy/FIRST_TIME_SETUP.md` | One-time IAM / cluster / service |

**Bitrise**
1. Stack: Linux with Docker (e.g. `linux-docker-amazon`)
2. Add Secrets (names must match):  
   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ACCOUNT_ID`,  
   `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_QA_GROUP_ID`,  
   `BITRISE_API_TOKEN` (token the *bot* uses to trigger builds),  
   `JIRA_EMAIL`, `JIRA_API_TOKEN`, `TESTRAIL_EMAIL`, `TESTRAIL_API_KEY`  
   Optional: `SLACK_RC_CHANNEL_ID`, `SLACK_USER_TOKEN`  
   (`BITRISE_APP_SLUG` is usually already set by Bitrise)
3. One-time AWS infra: `deploy/FIRST_TIME_SETUP.md` (IAM roles, cluster, service, secret `QA_ANTHROPIC_API_KEY`)
4. Start build → workflow **`deploy-mobile-qai`**
5. Verify: `aws logs tail /ecs/mobile-qai --follow --region us-east-1` → `mobile-qai is running!`

Anthropic key never goes into Bitrise Secrets or git — only AWS Secrets Manager → ECS task `secrets` block.
---

## Jira Ticket Fields Reference

| Field | Feature 3 (auto) | Feature 4 (manual) |
|-------|-----------------|-------------------|
| Parent | CP-14439 | CP-32 |
| Components | Mobile Application | Mobile Application |
| Priority | Medium | User-selected |
| Labels | `mobile-qai` `automation-failure` | `mobile-qai` |
| Thread link | — | ✅ in description |
