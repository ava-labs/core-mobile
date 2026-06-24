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
| 6 | `1.0.34 RC status` | Checks stored messages for RC announcement → reports bugs / manual test progress / automation results |

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

> If no RC announcement found in recent messages → responds "RC has not been released yet."

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

# Bitrise
BITRISE_API_TOKEN=
BITRISE_APP_SLUG=

# Jira
JIRA_BASE_URL=https://avalabs.atlassian.net
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=CP

# TestRail
TESTRAIL_BASE_URL=https://avalabs.testrail.io
TESTRAIL_EMAIL=
TESTRAIL_API_KEY=
```

### Run

```bash
npm run dev    # development (ts-node)
npm run build  # compile
npm start      # production
```

---

## Jira Ticket Fields Reference

| Field | Feature 3 (auto) | Feature 4 (manual) |
|-------|-----------------|-------------------|
| Parent | CP-14439 | CP-32 |
| Components | Mobile Application | Mobile Application |
| Priority | Medium | User-selected |
| Labels | `mobile-qai` `automation-failure` | `mobile-qai` |
| Thread link | — | ✅ in description |
