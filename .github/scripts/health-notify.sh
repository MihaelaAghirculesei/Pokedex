#!/usr/bin/env bash
# Keeps exactly one open "action required" issue in sync with the findings.
# GitHub mails the issue title as the subject, so the ❗ marks mail that needs
# action. Mail is only sent when something changes:
#   findings, no open issue   → open one (assigned to the owner)
#   findings changed          → update it and comment with the new list
#   findings unchanged        → nothing (no weekly nagging for the same thing)
#   all clear, issue open     → retitle ✅ and close it
#
# Usage: health-notify.sh <findings.md>
# Env:   GH_TOKEN, GH_REPO, ISSUE_LABEL, ISSUE_TITLE, plus the default
#        GITHUB_* variables of the Actions runner
set -euo pipefail

findings_file=$1
run_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
workflow_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/workflows/health-check.yml"

issue=$(gh issue list --label "$ISSUE_LABEL" --state open --json number --jq '.[0].number // empty')

if [[ ! -s $findings_file ]]; then
  if [[ -n $issue ]]; then
    gh issue edit "$issue" --title "✅ Resolved: repository health check"
    gh issue close "$issue" --comment "All checks pass again ([run]($run_url)). Nothing left to do."
  fi
  echo "All clear."
  exit 0
fi

fingerprint=$(sha256sum "$findings_file" | cut -c1-16)
body=$(
  cat <<EOF
The weekly health check found something that needs you. Routine patch/minor updates are merged automatically; these are the exceptions.

$(cat "$findings_file")

Fix the cause, not the issue: the next run closes this issue on its own once every check passes. To check right away, open [the workflow]($workflow_url) and click **Run workflow**.

[Run log]($run_url)
<!-- health-check-fingerprint:$fingerprint -->
EOF
)

if [[ -z $issue ]]; then
  gh label create "$ISSUE_LABEL" --color D73A4A --force \
    --description "Opened by the weekly health check: needs a human"
  gh issue create --title "$ISSUE_TITLE" --label "$ISSUE_LABEL" \
    --assignee "$GITHUB_REPOSITORY_OWNER" --body "$body"
elif ! gh issue view "$issue" --json body --jq .body | grep -qF "health-check-fingerprint:$fingerprint"; then
  gh issue edit "$issue" --title "$ISSUE_TITLE" --body "$body"
  gh issue comment "$issue" --body "$(printf 'The findings changed:\n\n%s\n\n[Run log](%s)' "$(cat "$findings_file")" "$run_url")"
else
  echo "Findings unchanged since issue #$issue was last updated; not mailing again."
fi
