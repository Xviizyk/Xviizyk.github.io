#!/usr/bin/env bash
set -euo pipefail

USER="${GH_USER:-Xviizyk}"

EVENT_ID=$(gh api "users/$USER/events?per_page=1" --jq '.[0].id // ""')
REPO_METRICS=$(gh api --paginate "users/$USER/repos?per_page=100" --jq '.[] | [.stargazers_count, .forks_count, .pushed_at] | @tsv' \
  | awk '{s+=$1; f+=$2; if($3>p) p=$3} END {printf "%d:%d:%s", s, f, p}')
CONTRIB=$(gh api graphql -f query='
  query($user: String!) {
    user(login: $user) {
      updatedAt
      followers { totalCount }
      following { totalCount }
      repositories(ownerAffiliations: OWNER) { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
      }
    }
  }' -f user="$USER" --jq '[
    .data.user.updatedAt,
    .data.user.followers.totalCount,
    .data.user.following.totalCount,
    .data.user.repositories.totalCount,
    .data.user.contributionsCollection.totalCommitContributions,
    .data.user.contributionsCollection.totalIssueContributions,
    .data.user.contributionsCollection.totalPullRequestContributions,
    .data.user.contributionsCollection.totalPullRequestReviewContributions,
    .data.user.contributionsCollection.totalRepositoryContributions,
    .data.user.contributionsCollection.restrictedContributionsCount
  ] | join(":")')

HASH=$(printf '%s' "${EVENT_ID}|${REPO_METRICS}|${CONTRIB}" | sha256sum | awk '{print $1}')
STORED_HASH=$(jq -r '.activity_hash // ""' data.json 2>/dev/null || echo "")

echo "Account: hash=$HASH"
echo "Stored:  hash=$STORED_HASH"

if [[ -n "$STORED_HASH" && "$HASH" == "$STORED_HASH" ]]; then
  echo "skip=true" >> "$GITHUB_OUTPUT"
  echo "→ No changes"
else
  echo "skip=false" >> "$GITHUB_OUTPUT"
  echo "activity_hash=$HASH" >> "$GITHUB_OUTPUT"
  echo "→ Changes detected"
fi