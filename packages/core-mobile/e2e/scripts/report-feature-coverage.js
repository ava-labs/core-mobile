#!/usr/bin/env node
/**
 * Runs `packages/core-mobile/scripts/e2e-feature-coverage.js` from the package root.
 * For TestRail regression metrics, set TESTRAIL_API_KEY (and optional TESTRAIL_USERNAME,
 * TESTRAIL_DOMAIN, TESTRAIL_PROJECT_ID). Loads latest iOS and Android runs matching
 * `[REGRESSION] <platform> Test Run: YYYY-MM-DD`. Flags: --json, --verbose, --no-testrail.
 */
const { spawnSync } = require('child_process')
const path = require('path')

const pkgRoot = path.resolve(__dirname, '../..')
const script = path.join(pkgRoot, 'scripts/e2e-feature-coverage.js')
const r = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: pkgRoot
})
process.exit(r.status === null ? 1 : r.status)
