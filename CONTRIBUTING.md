# Contributing

## Prerequisites

- **Node.js 24** (same version as CI — `node -v` to check)
- **npm** (bundled with Node)

## Setup

```bash
git clone https://github.com/MihaelaAghirculesei/Pokedex.git
cd Pokedex
npm install
npm run dev
```

`npm install` also installs the Husky git hooks automatically via the `prepare` script.

---

## Scripts

| Script                               | What it does                                          | When to run                            |
| ------------------------------------ | ----------------------------------------------------- | -------------------------------------- |
| `npm run dev`                        | Vite dev server with HMR on `localhost:5173`          | Daily development                      |
| `npm run build`                      | Production bundle to `dist/`                          | Before checking bundle output          |
| `npm run preview`                    | Serve the `dist/` build locally                       | Verify production build before pushing |
| `npm run typecheck`                  | `tsc --noEmit` on `src/` and `e2e/`                   | Check types without building           |
| `npm run lint`                       | ESLint on `src/` and `e2e/`                           | Check code style                       |
| `npm run lint:fix`                   | ESLint on `src/` and `e2e/` with auto-fix             | Fix fixable lint errors                |
| `npm run format`                     | Prettier — format all files in place                  | Before committing                      |
| `npm run format:check`               | Prettier — check formatting without writing           | Verify formatting (runs in CI)         |
| `npm test`                           | Vitest unit tests (single run)                        | Quick local check                      |
| `npm run test:watch`                 | Vitest in watch mode                                  | During development                     |
| `npm run test:coverage`              | Unit tests + HTML/lcov coverage report                | Before a PR                            |
| `npm run test:e2e`                   | Playwright E2E — Chromium + mobile Chrome             | Before a PR                            |
| `ALL_BROWSERS=true npm run test:e2e` | Adds Firefox + WebKit                                 | Cross-browser check — local only       |
| `npm run test:e2e:functional`        | E2E without visual regression                         | Faster E2E run                         |
| `npm run e2e:visual:update`          | Regenerate visual snapshot baselines                  | After intentional UI changes           |
| `npm run analyze`                    | Bundle build + opens visualizer in browser            | Investigate bundle size                |
| `npm run size`                       | Size-limit check against thresholds in `package.json` | Verify bundle limits                   |
| `npm run ci:local`                   | Full CI pipeline locally (see below)                  | Final check before pushing             |

### Full local CI

```bash
npm run ci:local
# equivalent to:
# typecheck → lint → format:check → test → build → size → test:e2e → npm audit
```

This mirrors what runs on GitHub Actions. Run it before opening a PR to avoid surprises.

---

## Git hooks

Hooks are managed by Husky and run automatically — no manual steps needed.

| Hook         | Trigger      | What runs                                                        |
| ------------ | ------------ | ---------------------------------------------------------------- |
| `pre-commit` | `git commit` | `lint-staged` → Prettier format + ESLint `--fix` on staged files |
| `commit-msg` | `git commit` | `commitlint` — rejects messages that break the convention below  |
| `pre-push`   | `git push`   | `typecheck` + `npm test`                                         |

If the pre-push hook fails, fix the errors before pushing — do not skip with `--no-verify`.

---

## Commit convention

This project uses **Conventional Commits**. Every commit message must follow:

```
<type>(<scope>): <description>
```

### Types

| Type       | Use for                              |
| ---------- | ------------------------------------ |
| `feat`     | New user-visible feature             |
| `fix`      | Bug fix                              |
| `refactor` | Code change with no behaviour change |
| `test`     | Adding or updating tests             |
| `style`    | CSS or formatting changes            |
| `ci`       | CI/CD pipeline changes               |
| `docs`     | Documentation only                   |
| `chore`    | Dependency bumps, tooling, config    |

### Scope (optional but recommended)

Use the area of the codebase: `overlay`, `search`, `pwa`, `a11y`, `e2e`, `visual`, `deps`, `assets`, etc.

### Examples

```
feat(search): add search-by-ID support with 300 ms debounce
fix(overlay): restore focus to trigger element on ESC close
test(visual): regenerate Linux baselines after card layout change
chore(deps): bump vite from 6.x to 7.x
ci: upgrade GitHub Actions runners to v6
```

---

## Testing

### Unit tests (`src/`)

Written with Vitest. Tests live in `src/__tests__/` (`*.test.ts`). Run with `npm test` or `npm run test:watch`.

Coverage is uploaded to Codecov on every CI run. To view it locally:

```bash
npm run test:coverage
# opens coverage/index.html
```

### E2E tests (`e2e/`)

Written with Playwright. The PokeAPI is mocked via `page.route()` — tests do not hit the network.

- `app.spec.ts` — core user flows
- `accessibility.spec.ts` — axe-core checks
- `mobile.spec.ts` — viewport-specific behaviour
- `visual.spec.ts` — pixel-diff snapshots

CI runs Chromium only to keep it fast. Locally you can add Firefox and WebKit:

```bash
ALL_BROWSERS=true npm run test:e2e
```

### Visual regression

Snapshots are stored in `e2e/visual.spec.ts-snapshots/`. They are OS-specific — Linux baselines are used by CI, Windows baselines are used locally.

After intentional UI changes, regenerate the baselines:

```bash
npm run e2e:visual:update
git add e2e/visual.spec.ts-snapshots/
git commit -m "test(visual): update baselines after <description>"
```

CI compares against the Linux baselines, and local renders never match the GitHub runner pixel for pixel. To regenerate them on the runner itself, start the **Update visual snapshots** workflow manually (Actions → Run workflow). It regenerates them and commits the result with `[skip ci]`.

---

## CI pipeline

```
push / PR to main
│
├─ ci job
│   typecheck → lint → format:check → test:coverage → build → size-limit → npm audit
│
├─ e2e job  (needs: ci)
│   functional E2E → visual regression
│
├─ lighthouse job  (needs: ci)
│   build → Lighthouse CI thresholds
│
└─ deploy  (main only, after the whole CI workflow succeeds)
    build → wrangler pages deploy
```

All three jobs must pass before merging. The Lighthouse thresholds are defined in `.lighthouserc.json`. Dependabot patch/minor PRs are merged automatically once these checks are green.

Everything automation leaves to a human is caught by the weekly [health check](.github/workflows/health-check.yml) (Mondays, or **Run workflow** on demand): Dependabot PRs without auto-merge (majors), PRs open longer than 3 days, a failed CI or Deploy run on `main`, the live site not answering 200, and vulnerable production dependencies. Findings go into a single issue titled **❗ Action required: repository health check** (label `action-required`). The issue updates when the findings change and closes itself once every check passes, so fix the cause instead of closing it by hand.

---

## Opening a pull request

1. Branch off `main`: `git checkout -b feat/your-feature`
2. Make changes, commit with the convention above
3. Run `npm run ci:local` — fix anything that fails
4. If you changed the UI, run `npm run e2e:visual:update` and commit the new snapshots
5. Push and open a PR against `main`

The PR description should explain **why** the change is needed, not just what changed.
