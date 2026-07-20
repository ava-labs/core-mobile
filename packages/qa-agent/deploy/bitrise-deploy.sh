#!/usr/bin/env bash
# Deploy mobile-qai from Bitrise (or any CI with AWS + Docker).
#
# Why Bitrise: local machines often lack AWS SSO / Secrets Manager / ECR perms.
# Bitrise already has AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY for Device Farm —
# the same creds (or a dedicated deploy role) can push to ECR and roll ECS.
#
# Anthropic key: NOT pasted into the task. ECS execution role injects
# QA_ANTHROPIC_API_KEY from Secrets Manager at container start.
#
# Required Bitrise Secrets / env (non-Anthropic app config):
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#   SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_QA_GROUP_ID
#   BITRISE_API_TOKEN, BITRISE_APP_SLUG   (bot triggers builds — app slug of core-mobile)
#   JIRA_EMAIL, JIRA_API_TOKEN
#   TESTRAIL_EMAIL, TESTRAIL_API_KEY
# Optional:
#   SLACK_RC_CHANNEL_ID, SLACK_USER_TOKEN, JIRA_MOBILE_BOARD_ID
#   AWS_REGION (default us-east-1)
#   CLUSTER / SERVICE / REPO_NAME (default mobile-qai)
#   IMAGE_TAG (default BITRISE_GIT_COMMIT or latest)
#   CREATE_SERVICE=1 + SUBNET_IDS + SECURITY_GROUP_IDS  (first-time service create)
# Required (no defaults — set as Bitrise Secret / env):
#   ACCOUNT_ID

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${ACCOUNT_ID:?Set ACCOUNT_ID}"
REPO_NAME="${REPO_NAME:-mobile-qai}"
CLUSTER="${CLUSTER:-mobile-qai}"
SERVICE="${SERVICE:-mobile-qai}"
IMAGE_TAG="${IMAGE_TAG:-${BITRISE_GIT_COMMIT:-latest}}"
SECRET_ID="${SECRET_ID:-QA_ANTHROPIC_API_KEY}"
CREATE_SERVICE="${CREATE_SERVICE:-0}"

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

require_env() {
  local missing=0
  for v in "$@"; do
    if [[ -z "${!v:-}" ]]; then
      echo "ERROR: missing required env: ${v}"
      missing=1
    fi
  done
  if [[ "${missing}" -ne 0 ]]; then
    exit 1
  fi
}

require_env \
  ACCOUNT_ID \
  AWS_ACCESS_KEY_ID \
  AWS_SECRET_ACCESS_KEY \
  SLACK_BOT_TOKEN \
  SLACK_APP_TOKEN \
  SLACK_QA_GROUP_ID \
  BITRISE_API_TOKEN \
  BITRISE_APP_SLUG \
  JIRA_EMAIL \
  JIRA_API_TOKEN \
  TESTRAIL_EMAIL \
  TESTRAIL_API_KEY

echo "==> Caller identity"
aws sts get-caller-identity --region "${AWS_REGION}"

echo "==> Ensure ECR repo exists"
aws ecr describe-repositories --repository-names "${REPO_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "${REPO_NAME}" --region "${AWS_REGION}" >/dev/null

echo "==> Login to ECR"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Build image (${REPO_NAME}:${IMAGE_TAG})"
docker build -t "${REPO_NAME}:${IMAGE_TAG}" -t "${REPO_NAME}:latest" .

echo "==> Tag + push"
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker tag "${REPO_NAME}:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:latest"

echo "==> Resolve Secrets Manager ARN for ${SECRET_ID}"
SECRET_ARN="$(aws secretsmanager describe-secret \
  --secret-id "${SECRET_ID}" \
  --region "${AWS_REGION}" \
  --query ARN \
  --output text)"
echo "    ${SECRET_ARN}"

echo "==> Ensure CloudWatch log group"
aws logs create-log-group --log-group-name /ecs/mobile-qai --region "${AWS_REGION}" 2>/dev/null || true

echo "==> Build task definition (CI env → container env; Anthropic from Secrets Manager)"
TMP_TASK="$(mktemp)"
export ACCOUNT_ID AWS_REGION ECR_URI IMAGE_TAG SECRET_ARN TMP_TASK

python3 - <<'PY'
import json, os

account = os.environ["ACCOUNT_ID"]
region = os.environ["AWS_REGION"]
ecr_uri = os.environ["ECR_URI"]
image_tag = os.environ["IMAGE_TAG"]
secret_arn = os.environ["SECRET_ARN"]
out = os.environ["TMP_TASK"]

def env(name, default=None):
    v = os.environ.get(name, default)
    if v is None or v == "":
        raise SystemExit(f"missing env for task definition: {name}")
    return v

def opt_env(name):
    v = os.environ.get(name, "").strip()
    return v or None

environment = [
    {"name": "JIRA_BASE_URL", "value": os.environ.get("JIRA_BASE_URL", "https://ava-labs.atlassian.net")},
    {"name": "TESTRAIL_BASE_URL", "value": os.environ.get("TESTRAIL_BASE_URL", "https://avalabs.testrail.io")},
    {"name": "JIRA_PROJECT_KEY", "value": os.environ.get("JIRA_PROJECT_KEY", "CP")},
    {"name": "SLACK_BOT_TOKEN", "value": env("SLACK_BOT_TOKEN")},
    {"name": "SLACK_APP_TOKEN", "value": env("SLACK_APP_TOKEN")},
    {"name": "SLACK_QA_GROUP_ID", "value": env("SLACK_QA_GROUP_ID")},
    {"name": "BITRISE_API_TOKEN", "value": env("BITRISE_API_TOKEN")},
    {"name": "BITRISE_APP_SLUG", "value": env("BITRISE_APP_SLUG")},
    {"name": "JIRA_EMAIL", "value": env("JIRA_EMAIL")},
    {"name": "JIRA_API_TOKEN", "value": env("JIRA_API_TOKEN")},
    {"name": "TESTRAIL_EMAIL", "value": env("TESTRAIL_EMAIL")},
    {"name": "TESTRAIL_API_KEY", "value": env("TESTRAIL_API_KEY")},
]
for optional in ("SLACK_RC_CHANNEL_ID", "SLACK_USER_TOKEN", "JIRA_MOBILE_BOARD_ID", "JIRA_BUG_PARENT_KEY"):
    val = opt_env(optional)
    if val:
        environment.append({"name": optional, "value": val})

task = {
    "family": "mobile-qai",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": f"arn:aws:iam::{account}:role/mobile-qai-ecs-execution-role",
    "taskRoleArn": f"arn:aws:iam::{account}:role/mobile-qai-ecs-task-role",
    "containerDefinitions": [
        {
            "name": "mobile-qai",
            "image": f"{ecr_uri}:{image_tag}",
            "essential": True,
            "environment": environment,
            "secrets": [
                {
                    "name": "QA_ANTHROPIC_API_KEY",
                    "valueFrom": secret_arn,
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/mobile-qai",
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "ecs",
                },
            },
        }
    ],
}

with open(out, "w", encoding="utf-8") as f:
    json.dump(task, f)
print(f"Wrote task definition ({len(environment)} env vars; Anthropic via Secrets Manager)")
PY

echo "==> Register task definition"
TASK_ARN="$(aws ecs register-task-definition \
  --cli-input-json "file://${TMP_TASK}" \
  --region "${AWS_REGION}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"
rm -f "${TMP_TASK}"
echo "Registered: ${TASK_ARN}"

SERVICE_STATUS="$(aws ecs describe-services \
  --cluster "${CLUSTER}" \
  --services "${SERVICE}" \
  --region "${AWS_REGION}" \
  --query 'services[0].status' \
  --output text 2>/dev/null || true)"

if [[ "${SERVICE_STATUS}" == "ACTIVE" ]]; then
  echo "==> Update existing service"
  aws ecs update-service \
    --cluster "${CLUSTER}" \
    --service "${SERVICE}" \
    --task-definition "${TASK_ARN}" \
    --force-new-deployment \
    --region "${AWS_REGION}" \
    --query 'service.serviceName' \
    --output text
elif [[ "${CREATE_SERVICE}" == "1" ]]; then
  require_env SUBNET_IDS SECURITY_GROUP_IDS
  echo "==> Create service (first time)"
  IFS=',' read -r -a SUBNET_ARR <<< "${SUBNET_IDS}"
  IFS=',' read -r -a SG_ARR <<< "${SECURITY_GROUP_IDS}"
  SUBNET_JSON="$(printf '"%s",' "${SUBNET_ARR[@]}")"
  SUBNET_JSON="[${SUBNET_JSON%,}]"
  SG_JSON="$(printf '"%s",' "${SG_ARR[@]}")"
  SG_JSON="[${SG_JSON%,}]"
  ASSIGN_PUBLIC_IP="${ASSIGN_PUBLIC_IP:-ENABLED}"

  aws ecs create-service \
    --cluster "${CLUSTER}" \
    --service-name "${SERVICE}" \
    --task-definition "${TASK_ARN}" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=${SUBNET_JSON},securityGroups=${SG_JSON},assignPublicIp=${ASSIGN_PUBLIC_IP}}" \
    --region "${AWS_REGION}" \
    --query 'service.serviceName' \
    --output text
else
  echo "ERROR: ECS service '${SERVICE}' not found on cluster '${CLUSTER}'."
  echo "Create it once (see deploy/FIRST_TIME_SETUP.md), or re-run with:"
  echo "  CREATE_SERVICE=1 SUBNET_IDS=subnet-xxx,subnet-yyy SECURITY_GROUP_IDS=sg-xxx"
  exit 1
fi

echo "==> Done. Watch logs:"
echo "  aws logs tail /ecs/mobile-qai --follow --region ${AWS_REGION}"
echo "Look for: mobile-qai is running!"
