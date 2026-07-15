#!/usr/bin/env bash
# Start mobile-qai by loading QA_ANTHROPIC_API_KEY from AWS Secrets Manager.
#
# Intended for someone with secretsmanager:GetSecretValue on the secret.
# The operator never needs to paste the key; this script never prints it.
#
# Prerequisites:
#   - AWS CLI v2 + credentials that can GetSecretValue
#   - Node 20+
#   - Remaining env vars in .env (Slack/Bitrise/Jira/TestRail) OR already exported
#
# Usage:
#   cd packages/qa-agent
#   chmod +x scripts/start-from-secrets.sh
#   AWS_REGION=us-east-1 ./scripts/start-from-secrets.sh
#
# Optional env:
#   SECRET_ID=QA_ANTHROPIC_API_KEY   # default
#   AWS_REGION=us-east-1            # required if not in AWS config
#   USE_PM2=1                       # keep process alive with pm2

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

SECRET_ID="${SECRET_ID:-QA_ANTHROPIC_API_KEY}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"
USE_PM2="${USE_PM2:-0}"

if [[ -z "${AWS_REGION}" ]]; then
  echo "ERROR: Set AWS_REGION (e.g. AWS_REGION=us-east-1)"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws CLI not found"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found (need Node 20+)"
  exit 1
fi

echo "==> Caller identity"
aws sts get-caller-identity --region "${AWS_REGION}"

echo "==> Fetching secret: ${SECRET_ID} (region=${AWS_REGION})"
# Do not print SecretString. Only capture into a variable.
SECRET_STRING="$(aws secretsmanager get-secret-value \
  --secret-id "${SECRET_ID}" \
  --region "${AWS_REGION}" \
  --query SecretString \
  --output text)"

if [[ -z "${SECRET_STRING}" || "${SECRET_STRING}" == "None" ]]; then
  echo "ERROR: secret string empty"
  exit 1
fi

echo "==> Resolving QA_ANTHROPIC_API_KEY from secret payload"
# Supports:
#   1) plain string: sk-ant-...
#   2) JSON: {"QA_ANTHROPIC_API_KEY":"..."} or {"apiKey":"..."}
export QA_ANTHROPIC_API_KEY="$(
  SECRET_STRING="${SECRET_STRING}" node <<'NODE'
const raw = process.env.SECRET_STRING || ''
let value = raw.trim()
try {
  const parsed = JSON.parse(raw)
  if (typeof parsed === 'string') {
    value = parsed
  } else if (parsed && typeof parsed === 'object') {
    value =
      parsed.QA_ANTHROPIC_API_KEY ||
      parsed.qa_anthropic_api_key ||
      parsed.ANTHROPIC_API_KEY ||
      parsed.anthropic_api_key ||
      parsed.apiKey ||
      parsed.value ||
      ''
  }
} catch {
  // plain string secret
}
if (!value) {
  console.error('Could not find API key in secret JSON/string')
  process.exit(1)
}
process.stdout.write(String(value).trim())
NODE
)"

# Drop raw payload from shell memory as soon as possible
unset SECRET_STRING

if [[ -z "${QA_ANTHROPIC_API_KEY}" ]]; then
  echo "ERROR: failed to resolve QA_ANTHROPIC_API_KEY"
  exit 1
fi
echo "==> QA_ANTHROPIC_API_KEY loaded (length=${#QA_ANTHROPIC_API_KEY}, value not printed)"

# Load the rest of the env from .env if present (Anthropic line optional / ignored if Secrets Manager wins)
if [[ -f .env ]]; then
  echo "==> Loading other vars from .env"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  # Ensure Secrets Manager value wins even if .env had a placeholder
  export QA_ANTHROPIC_API_KEY
fi

required_vars=(
  QA_ANTHROPIC_API_KEY
  SLACK_BOT_TOKEN
  SLACK_APP_TOKEN
)

missing=0
for v in "${required_vars[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "ERROR: missing required env: ${v}"
    missing=1
  fi
done
if [[ "${missing}" -ne 0 ]]; then
  echo "Put Slack/etc tokens in .env (see .env.example). Anthropic comes from Secrets Manager."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> npm install --no-workspaces"
  npm install --no-workspaces
fi

echo "==> Building"
npm run build

echo "==> Starting mobile-qai"
if [[ "${USE_PM2}" == "1" ]]; then
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "==> Installing pm2 globally"
    npm install -g pm2
  fi
  # Pass Anthropic via ecosystem env without writing it to disk
  pm2 delete mobile-qai >/dev/null 2>&1 || true
  QA_ANTHROPIC_API_KEY="${QA_ANTHROPIC_API_KEY}" \
    pm2 start dist/index.js --name mobile-qai --update-env
  pm2 save
  pm2 logs mobile-qai --lines 50
else
  exec node dist/index.js
fi
