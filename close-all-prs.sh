#!/bin/bash
# Script to close all open pull requests in the repository

set -e

REPO="DopestT/HALO-Go-Live-Be-Seen"
CURRENT_PR=22  # Skip the current PR

echo "Fetching all open pull requests..."

# Get all open PRs using the GitHub API
prs=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/pulls?state=open&per_page=100" \
  | jq -r '.[].number')

if [ -z "$prs" ]; then
  echo "No open pull requests found."
  exit 0
fi

echo "Found the following open PRs:"
echo "$prs"
echo ""

# Close each PR
for pr in $prs; do
  if [ "$pr" = "$CURRENT_PR" ]; then
    echo "Skipping current PR #$pr"
    continue
  fi
  
  echo "Closing PR #$pr..."
  
  # Add a comment to the PR
  curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/issues/$pr/comments" \
    -d '{"body":"Closing all pull requests as requested."}' > /dev/null
  
  # Close the PR
  curl -s -X PATCH \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/pulls/$pr" \
    -d '{"state":"closed"}' > /dev/null
  
  echo "✓ Closed PR #$pr"
done

echo ""
echo "All pull requests have been closed successfully!"
