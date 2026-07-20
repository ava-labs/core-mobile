# mobile-qai — one-time Fargate setup (us-east-1)

Slack Socket Mode bot: always-on container, **no public URL / load balancer**.

## 1) IAM roles

### Execution role `mobile-qai-ecs-execution-role`
Trusted entity: `ecs-tasks.amazonaws.com`  
Attach policy from `iam-execution-role-policy.json` (replace `ACCOUNT_ID`).  
This role pulls the image **and** injects `QA_ANTHROPIC_API_KEY` from Secrets Manager into the container env.

### Task role `mobile-qai-ecs-task-role`
Trusted entity: `ecs-tasks.amazonaws.com`  
No Secrets Manager needed for the app itself (key is already injected). Empty / minimal policy is fine.

## 2) Networking
- VPC with **private or public subnets** that have outbound internet (Slack / Anthropic / Jira).
- Security group: **no inbound** required; allow all outbound.

## 3) ECS
1. Create cluster `mobile-qai` (Fargate).
2. Create CloudWatch log group `/ecs/mobile-qai`.
3. Edit `ecs-task-definition.json`:
   - replace `ACCOUNT_ID`
   - paste the **full** Secrets Manager ARN for `QA_ANTHROPIC_API_KEY` into `secrets[].valueFrom` (console → secret → ARN)
   - replace `REPLACE_ME` Slack/Jira/etc values (or later move them to Secrets Manager too)
4. Register task definition + create **Service**:
   - Launch type: Fargate
   - Desired count: **1**
   - No load balancer
   - Assign public IP: **ENABLED** if subnets need it for egress

## 4) Deploy image (prefer Bitrise)

Local AWS/Docker is often blocked. **Use Bitrise** — workflow `deploy-mobile-qai` runs `deploy/bitrise-deploy.sh` with CI AWS creds (ECR + ECS + Secrets Manager describe).

1. Put non-Anthropic secrets in Bitrise Secrets (see README).
2. Trigger workflow **`deploy-mobile-qai`** (Linux Docker stack).
3. If the ECS **service does not exist yet**, either create it in the console (step 3) or set on the Bitrise build:  
   `CREATE_SERVICE=1`, `SUBNET_IDS=subnet-…,subnet-…`, `SECURITY_GROUP_IDS=sg-…`

Manual fallback (needs local AWS+Docker):

```bash
cd packages/qa-agent
chmod +x deploy/deploy-fargate.sh
export AWS_REGION=us-east-1
export ACCOUNT_ID=975050371175
export CLUSTER=mobile-qai
export SERVICE=mobile-qai
./deploy/deploy-fargate.sh
```

## 5) Verify

```bash
aws logs tail /ecs/mobile-qai --follow --region us-east-1
# look for: mobile-qai is running!
```

Then mention the bot in Slack.

## Notes
- Temporary Anthropic keys in task `environment` also work for a smoke test, but prefer Secrets Manager (`secrets` block) so rotation does not require pasting into git.
- When the Secrets Manager value is rotated, force a new deployment:  
  `aws ecs update-service --cluster mobile-qai --service mobile-qai --force-new-deployment --region us-east-1`
