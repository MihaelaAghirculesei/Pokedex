#!/usr/bin/env bash
# Prints one Markdown bullet per thing that needs a human, and nothing at all
# when the repository is healthy. Routine work (patch/minor Dependabot bumps)
# is already automated; this only surfaces the exceptions.
#
# A check that cannot run is reported as a finding itself, so a broken check
# never passes for "all clear".
#
# Bullets must stay stable between runs while nothing changes (no "open for
# N days"): health-notify.sh compares them to decide whether to send mail.
#
# Env: GH_TOKEN, GH_REPO, SITE_URL, STALE_PR_DAYS
set -uo pipefail

finding() { printf -- '- %s\n' "$1"; }
# One finding per non-empty input line.
findings() { while IFS= read -r line; do [[ -n $line ]] && finding "$line"; done; return 0; }

# ── Pull requests waiting on a human ─────────────────────────────────────────
# Dependabot PRs without auto-merge are majors (excluded on purpose) or ones
# whose auto-merge job failed. Anything open longer than STALE_PR_DAYS is stuck.
cutoff=$(date -u -d "-${STALE_PR_DAYS} days" +%Y-%m-%dT%H:%M:%SZ)
if prs=$(gh api "repos/$GH_REPO/pulls?state=open&per_page=100") &&
  lines=$(jq -r --arg cutoff "$cutoff" '
    .[]
    | (.user.login == "dependabot[bot]" and .auto_merge == null) as $manual
    | select($manual or .created_at < $cutoff)
    | "PR [#\(.number) \(.title)](\(.html_url)) — " + (
        if $manual
        then "Dependabot PR not set to auto-merge (major bump or failed auto-merge job): review it, then merge or close."
        else "open since \(.created_at[:10]): merge, fix or close it."
        end)
  ' <<<"$prs"); then
  findings <<<"$lines"
else
  finding "Could not list open pull requests (see the run log)."
fi

# ── Latest CI and Deploy runs on main ────────────────────────────────────────
# Cancelled runs are normal (Deploy's concurrency keeps only the newest), and a
# skipped Deploy just mirrors a failed CI, which is reported on its own.
for workflow in ci.yml deploy.yml; do
  if lines=$(gh api "repos/$GH_REPO/actions/workflows/$workflow/runs?branch=main&status=completed&per_page=20" --jq '
    [.workflow_runs[] | select(.conclusion != "cancelled" and .conclusion != "skipped")][0]
    | select(. != null and .conclusion != "success")
    | "Latest \(.name) run on main ended with **\(.conclusion)**: [run #\(.run_number)](\(.html_url)) — fix main before anything else merges."'); then
    findings <<<"$lines"
  else
    finding "Could not read the $workflow runs on main (see the run log)."
  fi
done

# ── Production site ──────────────────────────────────────────────────────────
status=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 --retry 3 --retry-all-errors "$SITE_URL" 2>/dev/null)
if [[ $status != 200 ]]; then
  finding "Production site $SITE_URL answered HTTP ${status:-000} instead of 200."
fi

# ── Vulnerabilities in what ships to the browser ─────────────────────────────
# Same scope as CI's audit gate (dev-only findings are an accepted risk), but
# every severity: CI only blocks on high, this also surfaces the low ones.
# npm audit exits non-zero when it finds something, so judge by its JSON.
audit=$(npm audit --omit=dev --json 2>/dev/null)
if jq -e '.metadata.vulnerabilities' >/dev/null 2>&1 <<<"$audit" &&
  lines=$(jq -r '
    .vulnerabilities[]
    | "Production dependency `\(.name)` has a **\(.severity)** vulnerability"
      + (([.via[] | objects | .url] | first) as $url | if $url then " ([advisory](\($url)))" else "" end)
      + ": merge the Dependabot security PR if one is open, otherwise run `npm audit fix` on a branch."
  ' <<<"$audit"); then
  findings <<<"$lines"
else
  finding "npm audit could not run (see the run log)."
fi
