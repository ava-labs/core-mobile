---
name: github-copilot-pr-comments
description: >-
  Fetches unresolved GitHub PR review threads from Copilot, triages them
  (outdated vs current), implements fixes in the repo when appropriate, and
  resolves those threads via the GraphQL API. Use when the user asks to
  address, clear, or resolve Copilot PR comments, or Copilot code review
  feedback on a pull request. Does not resolve human reviewer threads unless
  the user explicitly asks to expand scope.
---

# GitHub Copilot PR comments

## Scope

- **In scope:** Review threads where at least one comment is authored by **`copilot-pull-request-reviewer`**.
- **Out of scope by default:** Threads from teammates, bots other than Copilot, or generic “conversation” without Copilot—**skip** unless the user explicitly widens scope.

## Prerequisites

- **`gh`** CLI installed and authenticated (`gh auth status`) with permission to **resolve review conversations** on the target repo (typically write access).
- **Owner**, **repo**, and **PR number**—infer when possible:
  - `gh pr view --json number,baseRepository -q .` from a branch linked to the PR, or
  - user supplies PR URL or `owner/repo#123`.

## Workflow

### 1. List Copilot threads only

Run a GraphQL query for `repository.pullRequest.reviewThreads` (see [reference.md](reference.md)).

Treat a thread as **Copilot** if any `comments.nodes[].author.login` equals `copilot-pull-request-reviewer`.

Discard resolved threads (`isResolved: true`) unless the user asks for history.

Record per thread: **`id`** (e.g. `PRRT_kwDO...`), **`isOutdated`**, **`path`**, first-line **body** preview.

### 2. Triage each Copilot thread

| Signal | Action |
|--------|--------|
| **`isOutdated: true`** | Diff likely already touched the line—**verify** in the working tree. If the concern is already addressed, **resolve** after user confirms or after implementing any missing piece. |
| **`isOutdated: false`** | **Read** the full comment. Implement a **minimal** fix matching repo conventions, or explain why the suggestion is wrong / not applicable and get user OK before resolving. |
| **Suggestion is incorrect** | Do **not** change code to “satisfy” Copilot blindly. Prefer a short PR reply (optional) and resolve only with user agreement. |
| **Security / secrets** | Prefer **fix** (redact logs, tighten validation) before resolving. |

### 3. Implement fixes

- Keep diffs **focused** on what the comment requires.
- Run **lint/typecheck** on touched files when relevant.

### 4. Resolve threads (Copilot-only)

Use mutation **`resolveReviewThread`** with each **Copilot** thread’s `id`:

```graphql
mutation {
  resolveReviewThread(input: { threadId: "PRRT_..." }) {
    thread { isResolved }
  }
}
```

Invoke via:

```bash
gh api graphql --input - <<'EOF'
{"query": "mutation { resolveReviewThread(input: { threadId: \"PRRT_...\" }) { thread { isResolved } } }"}
EOF
```

**Important:** `gh api graphql -f variables=...` often fails for `ID!` variables; **inline `threadId` in the query string** (escape quotes) as in [reference.md](reference.md).

Resolve **only** threads you triaged as Copilot and addressed (or user-approved as stale/wont-fix).

### 5. Verify

Re-query unresolved threads; confirm **no remaining Copilot** threads the user wanted cleared, or list what is left and why.

## Safety defaults

- **Do not** resolve **non-Copilot** threads unless the user explicitly asks.
- **Do not** bulk-resolve without user confirmation if any Copilot item is ambiguous or **high-risk** (auth, crypto, PII).
- On **`403`** or permission errors: state that the token user needs repo rights to resolve conversations.

## Optional helper

For copy-paste **queries, jq filters, and loop examples**, see [reference.md](reference.md).
