# Reference: GraphQL and `gh` for Copilot review threads

## List threads with authors (filter Copilot in `jq`)

Replace `OWNER`, `REPO`, and `PR_NUMBER`.

```bash
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 15) {
            nodes {
              author { login }
              path
              body
            }
          }
        }
      }
    }
  }
}' | jq '
.data.repository.pullRequest.reviewThreads.nodes
| map(select(.isResolved == false))
| map(select(([.comments.nodes[] | .author.login? // empty] | any(. == "copilot-pull-request-reviewer"))))
| map({
    id,
    isOutdated,
    path: .comments.nodes[0].path,
    preview: (.comments.nodes[0].body | split("\n")[0])
  })
'
```

## Copilot thread IDs only (unresolved)

```bash
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          comments(first: 10) {
            nodes { author { login } }
          }
        }
      }
    }
  }
}' | jq -r '
.data.repository.pullRequest.reviewThreads.nodes[]
| select(.isResolved == false)
| select(([.comments.nodes[] | .author.login? // empty] | any(. == "copilot-pull-request-reviewer")))
| .id
'
```

## Resolve one thread

```bash
THREAD_ID='PRRT_kwDO...'
gh api graphql --input - <<EOF
{"query": "mutation { resolveReviewThread(input: { threadId: \"${THREAD_ID}\" }) { thread { isResolved } } }"}
EOF
```

## Resolve all unresolved Copilot threads (use after user confirms)

```bash
OWNER=ava-labs REPO=core-mobile PR=3476
gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$REPO\") {
    pullRequest(number: $PR) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          comments(first: 10) {
            nodes { author { login } }
          }
        }
      }
    }
  }
}" | jq -r --arg copilot copilot-pull-request-reviewer '
.data.repository.pullRequest.reviewThreads.nodes[]
| select(.isResolved == false)
| select(([.comments.nodes[] | .author.login? // empty] | any(. == $copilot)))
| .id
' | while read -r id; do
  [ -z "$id" ] && continue
  echo "Resolving $id"
  gh api graphql --input - <<EOF
{"query": "mutation { resolveReviewThread(input: { threadId: \"$id\" }) { thread { isResolved } } }"}
EOF
done
```

## Count unresolved Copilot threads

```bash
# After jq filter as above, pipe to: wc -l
```

## Current PR from branch

```bash
gh pr view --json number,baseRepository \
  -q '"\(.baseRepository.nameWithOwner) #\(.number)"'
```

Use `nameWithOwner` as `owner/repo` for queries.
