#!/usr/bin/env bash
set -euo pipefail

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git add data.json

if git diff --cached --quiet; then
  echo "→ Nothing to commit"
  exit 0
fi

git commit -m "chore: update data.json"
git push origin "HEAD:${GITHUB_REF_NAME:-main}"

echo "✓ Updated"