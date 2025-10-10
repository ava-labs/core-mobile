#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Checking if build was triggered by a PR..."

if [ -z "${BITRISE_PULL_REQUEST:-}" ]; then
  echo "ℹ️  Not a PR build, skipping GitHub comment."
  exit 0
fi

echo "🧩 Preparing GitHub PR comment for platform: $PLATFORM"

# Prepare platform-specific links
if [ "$PLATFORM" = "Android" ]; then
  LINKS="📦 [**APK**]($BITRISE_PUBLIC_INSTALL_PAGE_URL)
🧾 [**QR Code**]($BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL)"
else
  LINKS=""
fi

# Lowercase platform tag (ios / android)
PLATFORM_TAG=$(echo "$PLATFORM" | tr '[:upper:]' '[:lower:]')

# Create the comment body
COMMENT_BODY=$(cat <<EOF
## $PLATFORM Build Available!

**Commit:** [$GIT_CLONE_COMMIT_HASH](https://github.com/ava-labs/core-mobile/commit/$GIT_CLONE_COMMIT_HASH)  
**Message:** _$GIT_CLONE_COMMIT_MESSAGE_SUBJECT_

✅ **$PLATFORM:** $APP_VERSION.$BUILD_NUMBER

$LINKS

🔗 [**View Build**]($BITRISE_BUILD_URL)

<!-- bitrise-builds-$PLATFORM_TAG -->
EOF
)

# # Save for later steps (optional, if needed)
# envman add --key GITHUB_COMMENT_BODY --value "${COMMENT_BODY}"
# envman add --key PLATFORM_TAG --value "${PLATFORM_TAG}"

echo "✅ Comment body prepared, posting to PR..."

# Post the comment using Bitrise CLI step (through API)
bitrise run comment-on-github-pull-request@0.11.0 \
  --personal_access_token "$GITHUB_ACCESS_TOKEN" \
  --repository_url "$BITRISE_PULL_REQUEST_REPOSITORY_URL" \
  --issue_number "$BITRISE_PULL_REQUEST_ID" \
  --update_comment_tag "bitrise-build-$PLATFORM_TAG" \
  --body "$COMMENT_BODY"

echo "🚀 Comment posted successfully for $PLATFORM!"
