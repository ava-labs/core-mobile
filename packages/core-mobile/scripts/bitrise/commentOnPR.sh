#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking for an open PR for branch: $BITRISE_GIT_BRANCH"

GITHUB_REPOSITORY=$(git config --get remote.origin.url | sed -E 's/.*github\.com[:/](.*)\.git/\1/')

if [ -z "${GITHUB_REPOSITORY:-}" ]; then
  echo "❌ Unable to determine GitHub repository."
  exit 1
fi

API_URL="https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls?head=${GITHUB_REPOSITORY}:${BITRISE_GIT_BRANCH}&state=open"
PR_RESPONSE=$(curl -s -H "Authorization: token ${GITHUB_ACCESS_TOKEN}" "$API_URL")

PR_NUMBER=$(echo "$PR_RESPONSE" | jq '.[0].number // empty')

if [ -z "$PR_NUMBER" ]; then
  echo "ℹ️  No open PR found for branch '$BITRISE_GIT_BRANCH'. Skipping PR comment."
  exit 0
fi

echo "✅ Found open PR #$PR_NUMBER for branch $BITRISE_GIT_BRANCH"

# Prepare platform-specific info
if [ "$PLATFORM" = "Android" ]; then
  LINKS="📦 [**APK**]($BITRISE_PUBLIC_INSTALL_PAGE_URL)
🧾 [**QR Code**]($BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL)"
else
  LINKS=""
fi

PLATFORM_TAG=$(echo "$PLATFORM" | tr '[:upper:]' '[:lower:]')

COMMENT_BODY=$(cat <<EOF
## $PLATFORM Build Available!

**Commit:** [$GIT_CLONE_COMMIT_HASH](https://github.com/${GITHUB_REPOSITORY}/commit/$GIT_CLONE_COMMIT_HASH)  
**Message:** _$GIT_CLONE_COMMIT_MESSAGE_SUBJECT_

✅ **$PLATFORM:** $APP_VERSION.$BUILD_NUMBER

$LINKS

🔗 [**View Build**]($BITRISE_BUILD_URL)

<!-- bitrise-build-$PLATFORM_TAG -->
EOF
)

# Post or update the comment using GitHub API directly
echo "💬 Posting comment to PR #$PR_NUMBER..."

curl -s -X POST \
  -H "Authorization: token ${GITHUB_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg body "$COMMENT_BODY" '{body: $body}')" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
  > /dev/null

echo "🚀 Comment posted successfully for $PLATFORM!"