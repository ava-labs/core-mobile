#!/usr/bin/env bash
# Build + push image to ECR, then register/update ECS Fargate service.
# Requires: docker, aws CLI, permissions for ECR + ECS.
#
# Usage:
#   export AWS_REGION=us-east-1
#   export ACCOUNT_ID=975050371175
#   export CLUSTER=mobile-qai
#   export SERVICE=mobile-qai
#   ./deploy/deploy-fargate.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${ACCOUNT_ID:?Set ACCOUNT_ID}"
REPO_NAME="${REPO_NAME:-mobile-qai}"
CLUSTER="${CLUSTER:-mobile-qai}"
SERVICE="${SERVICE:-mobile-qai}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo "==> Ensure ECR repo exists"
aws ecr describe-repositories --repository-names "${REPO_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "${REPO_NAME}" --region "${AWS_REGION}" >/dev/null

echo "==> Login to ECR"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Build image"
docker build -t "${REPO_NAME}:${IMAGE_TAG}" .

echo "==> Tag + push"
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

TASK_FILE="${ROOT_DIR}/deploy/ecs-task-definition.json"
TMP_TASK="$(mktemp)"
sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" "${TASK_FILE}" > "${TMP_TASK}"

echo "==> Ensure CloudWatch log group"
aws logs create-log-group --log-group-name /ecs/mobile-qai --region "${AWS_REGION}" 2>/dev/null || true

echo "==> Register task definition"
TASK_ARN="$(aws ecs register-task-definition \
  --cli-input-json "file://${TMP_TASK}" \
  --region "${AWS_REGION}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"
rm -f "${TMP_TASK}"
echo "Registered: ${TASK_ARN}"

echo "==> Update service (must already exist)"
aws ecs update-service \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --task-definition "${TASK_ARN}" \
  --force-new-deployment \
  --region "${AWS_REGION}" \
  --query 'service.serviceName' \
  --output text

echo "==> Done. Watch logs:"
echo "  aws logs tail /ecs/mobile-qai --follow --region ${AWS_REGION}"
