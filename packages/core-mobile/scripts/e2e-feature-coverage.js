#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Estimates Appium/WebdriverIO e2e "coverage" by correlating `e2e-appium` specs
 * with top-level folders under `packages/core-mobile/app/new/features/` only
 * (not legacy `app/`, not other packages). Modal routes are separate. Deprecated
 * Detox tests in e2e/ are excluded. This is not line coverage.
 *
 * For each feature folder, `FEATURE_SIGNALS` maps spec paths (and optional regex)
 * to that feature. Non-test `.tsx` files are scanned for `testID={...}`; a
 * feature is “covered” (checklist O) if a spec path matches **or** any declared
 * testID string appears in a `*.spec.ts` file. Using testIDs in production UI is
 * optional; path-based matching alone can justify O.
 *
 * **Total coverage %** = % of in-scope **mapped** features that are covered by that
 * union (same as checklist O among those rows). A separate **testID literal %**
 * (share of declared IDs that appear in `*.spec.ts` only) is reported for
 * curiosity — not blended into Total, since teams often keep IDs in pages/locators.
 *
 * Folders in E2E_COVERAGE_EXCLUDED_FEATURES (hardware wallets, seedless-only flows,
 * QR / WalletConnect, store in-app review, deprecated code such as bridge, etc.)
 * are omitted from percent denominators and gap lists. They still appear in the
 * checklist as △ for visibility.
 *
 * **TestRail (optional):** When `TESTRAIL_API_KEY` is set, the script uses HTTP
 * Basic auth (`TESTRAIL_USERNAME` + API key as password). Default username is the
 * shared `mobiledevs@avalabs.org` TestRail user; set `TESTRAIL_USERNAME` when your
 * API key belongs to a different account. It loads the latest **iOS** and **Android**
 * runs whose names match
 * `[REGRESSION] iOS Test Run: YYYY-MM-DD` and `[REGRESSION] Android Test Run: YYYY-MM-DD`
 * (same naming as `e2e-appium/wdio.conf.ts` + `testrail/testrail.service.ts`).
 * Each run is mapped to local `*.spec.ts` files via TestRail section + case title
 * (Mocha `describe` / `it`). **Regression-adjusted coverage %** is computed
 * separately per platform: in-scope mapped features that are checklist-O *and*
 * have no mapped failing result from that platform’s regression run. If the
 * latest matching run’s **date in the run name** is older than
 * `E2E_COVERAGE_REGRESSION_MAX_AGE_DAYS` (default **7**), that platform’s
 * regression-adjusted % is **N/A** (stale run is not applied). If TestRail is
 * skipped (`--no-testrail`, no API key), adjusted % equals the heuristic total.
 *
 * Usage:
 *   node scripts/e2e-feature-coverage.js
 *   node scripts/e2e-feature-coverage.js --json
 *   node scripts/e2e-feature-coverage.js --verbose
 *   node scripts/e2e-feature-coverage.js --no-testrail
 *
 * Optional: `E2E_COVERAGE_REGRESSION_MAX_AGE_DAYS` (default 7) — max age of the
 * `YYYY-MM-DD` in `[REGRESSION] iOS|Android Test Run: …` for regression-adjusted metrics.
 *
 * Optional: `E2E_COVERAGE_TESTRAIL_CASE_CONCURRENCY` (default 12, max 32) —
 * parallel `get_case` calls when resolving a run (fewer round-trips in wall time).
 *
 * Optional: `E2E_COVERAGE_TESTRAIL_RUNS_MAX_PAGES` (default 15, max 50) —
 * max `get_runs` pages (250 runs/page) so we do not scan unbounded project history.
 *
 * Optional: `E2E_COVERAGE_TESTRAIL_SUITE_ID` (default 3) — `suite_id` filter on
 * `get_runs` (same as WDIO TestRail config). `E2E_COVERAGE_TESTRAIL_RUNS_CREATED_AFTER_DAYS`
 * (default 180) — `created_after` on `get_runs` (UNIX). Set
 * `E2E_COVERAGE_TESTRAIL_RUNS_NO_CREATED_AFTER=1` to omit that filter.
 *
 * If `packages/core-mobile/.env` exists, simple `KEY=value` lines are loaded
 * before TestRail runs (existing env vars are not overwritten). Handy for
 * `TESTRAIL_API_KEY` / `TESTRAIL_USERNAME` without exporting in the shell.
 *
 * **Codebase composite (core-web–style):** `e2e-appium/coverage-model.config.json`
 * defines a weighted headline `codebaseCompositeCoverage.percent` from (1) breadth
 * — share of in-scope `app/new/features/*` folders “claimed” by any Appium spec via
 * file stem, outer `describe` title, and long tokens from `it`/`describe` strings;
 * (2) `e2e-appium/required-scenarios.config.json` — flow × wallet cells (**Ledger**
 * never counted; **seedless** is opt-in via `walletModes` when that E2E exists);
 * (3) a **folder × N wallet-slot** assumption where **N = `walletModes.length`**
 * in that config (default mnemonic only). TestRail stays
 * a cross-check for regression-adjusted checklist %, not an input to the composite.
 *
 * Text output lists each `app/new/features/<name>` folder with O / X / △. JSON
 * includes per-feature detail, modals, and composite metrics.
 */

const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const pkgRequire = createRequire(path.join(__dirname, '../package.json'))

const pkgRoot = path.resolve(__dirname, '..')

/**
 * @param {string} line trimmed non-empty, non-comment env line
 * @returns {{ key: string, val: string } | null}
 */
function parseCoreMobileEnvLine(line) {
  let l = line
  if (l.startsWith('export ')) l = l.slice(7).trim()
  const eq = l.indexOf('=')
  if (eq <= 0) return null
  const key = l.slice(0, eq).trim()
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null
  let val = l.slice(eq + 1).trim()
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1)
  }
  return { key, val }
}

/**
 * Load `packages/core-mobile/.env` into `process.env` when present (KEY=val lines).
 * Does not override variables already set in the environment.
 */
function loadOptionalCoreMobileEnv() {
  const envPath = path.join(pkgRoot, '.env')
  let text
  try {
    text = fs.readFileSync(envPath, 'utf8')
  } catch {
    return
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const parsed = parseCoreMobileEnvLine(line)
    if (!parsed) continue
    if (
      process.env[parsed.key] === undefined ||
      process.env[parsed.key] === ''
    ) {
      process.env[parsed.key] = parsed.val
    }
  }
}

loadOptionalCoreMobileEnv()

const featuresDir = path.join(pkgRoot, 'app/new/features')
const modalsDir = path.join(pkgRoot, 'app/new/routes/(signedIn)/(modals)')

/** @type {Record<string, { pathSubstrings?: string[]; content?: RegExp }>} */
const FEATURE_SIGNALS = {
  accountSettings: {
    pathSubstrings: [
      'settings/',
      'showrecoveryphrase',
      'changepin',
      'theme',
      'currency',
      'coreanalytics'
    ]
  },
  activity: {
    pathSubstrings: ['activity'],
    content: /\b(activityTab|activity_tab)\b/i
  },
  addEthereumChain: {
    pathSubstrings: ['customnetwork', 'addcustomnetwork', 'networks']
  },
  appReview: { pathSubstrings: ['appreview', 'app_review'] },
  // ApprovalScreen: dApp / WalletConnect (and similar RPC) sign & approve UI — not swap/send screens themselves
  approval: {
    pathSubstrings: ['approval'],
    content: /\b(approval|signMessage|signTransaction)\b/i
  },
  bridge: { pathSubstrings: ['bridge'] },
  browser: {
    pathSubstrings: ['browser'],
    content: /\b(browserTab|browser_tab|webview)\b/i
  },
  // Thin buy entry; Meld on/off-ramp UI lives in `meld` — separate folder, separate coverage row
  buy: { pathSubstrings: ['buy', 'onramp'] },
  collectibleSend: {
    pathSubstrings: ['collectible', 'sendnft', 'sendethnft', 'nft']
  },
  defi: { pathSubstrings: ['/defi/', 'portfolioTab/defi'] },
  defiMarket: {
    pathSubstrings: ['borrow', 'deposit', 'repay', 'earn/']
  },
  editContact: { pathSubstrings: ['contact', 'addressbook'] },
  keystone: { pathSubstrings: ['keystone'] },
  ledger: { pathSubstrings: ['ledger'] },
  // Same Appium specs as `buy` (onramp); implementation lives here — count both O when buy flow is tested
  meld: { pathSubstrings: ['meld', 'buy', 'onramp'] },
  nestEgg: { pathSubstrings: ['nestegg', 'nest_egg'] },
  notifications: {
    pathSubstrings: ['notification'],
    content: /\b(notification|notifee)\b/i
  },
  onboarding: {
    pathSubstrings: ['onboarding/', 'newwallet', 'metamask', 'signup']
  },
  portfolio: {
    pathSubstrings: [
      'portfoliotab/',
      'performance/portfolio',
      'performance/balance'
    ]
  },
  privacyScreen: { pathSubstrings: ['privacy'] },
  receive: { pathSubstrings: ['receive'] },
  rpc: {
    pathSubstrings: [
      'walletconnect',
      'swapdapps',
      'connect/',
      'authorize',
      'dapp'
    ],
    content: /\b(WalletConnect|walletKit|reown)\b/i
  },
  send: {
    pathSubstrings: [
      'send',
      'withdraw',
      'xpchain',
      'sendbitcoin',
      'sendethereum',
      'sendsolana',
      '/cchain/send',
      '/ethereum/send',
      '/solana/send'
    ]
  },
  stake: {
    pathSubstrings: ['stake', 'staking', 'addstake']
  },
  swap: {
    pathSubstrings: ['swap'],
    content: /\b(swapOnTrack|tapTrackTab|track_tab)\b/i
  },
  toggleDeveloperMode: {
    pathSubstrings: ['testnet', 'developer']
  },
  tokenManagement: {
    pathSubstrings: [
      'assetsfilter',
      'assetssort',
      'assetsview',
      'ownedtoken',
      'managetoken',
      'customtoken',
      'addcustomtoken'
    ]
  },
  track: {
    pathSubstrings: ['tracktab/', 'trending', 'favorites'],
    content: /\b(trackTab|track_tab|tapTrackTab|swapOnTrack|tapTrack)\b/i
  },
  transactionSuccessful: {
    pathSubstrings: ['transaction.spec', 'successtoast'],
    content: /\bverifySuccessToast|successToast\b/i
  },
  wallets: {
    pathSubstrings: [
      'accounts',
      'importpk',
      'importps',
      'importwallet',
      'wallets'
    ]
  },
  // No dedicated watchAsset spec; map to Track / favorites–style E2E (e.g. swap.spec tapTrackTab + swapOnTrack)
  watchAsset: {
    pathSubstrings: ['favorites', 'trending', 'tracktab/'],
    content: /\b(trackTab|track_tab|tapTrackTab|swapOnTrack|tapTrack)\b/i
  }
}

/**
 * Map Expo modal route segment -> app/new/features key when names differ.
 * Used for a second modal metric: modal "covered" if linked feature has e2e.
 */
const MODAL_FEATURE_LINK = {
  accountSettings: 'accountSettings',
  addEthereumChain: 'addEthereumChain',
  addStake: 'stake',
  approval: 'approval',
  authorizeDapp: 'rpc',
  borrow: 'defiMarket',
  borrowDetail: 'defiMarket',
  borrowRepay: 'defiMarket',
  bridge: 'bridge',
  bridgeStatus: 'bridge',
  buy: 'buy',
  claimStakeReward: 'stake',
  collectibleDetail: 'collectibleSend',
  collectibleManagement: 'collectibleSend',
  collectibleSend: 'collectibleSend',
  defiDetail: 'defi',
  deposit: 'defiMarket',
  depositDetail: 'defiMarket',
  discoverCollectibles: 'collectibleSend',
  editContact: 'editContact',
  keystoneSigner: 'keystone',
  keystoneTroubleshooting: 'keystone',
  meld: 'meld',
  meldOfframpCountry: 'meld',
  meldOfframpCurrency: 'meld',
  meldOfframpPaymentMethod: 'meld',
  meldOfframpTokenList: 'meld',
  meldOnrampCountry: 'meld',
  meldOnrampCurrency: 'meld',
  meldOnrampPaymentMethod: 'meld',
  meldOnrampTokenList: 'meld',
  nestEggCampaign: 'nestEgg',
  notifications: 'notifications',
  receive: 'receive',
  selectBridgeSourceNetwork: 'bridge',
  selectBridgeTargetNetwork: 'bridge',
  selectBridgeToken: 'bridge',
  selectCustomTokenNetwork: 'tokenManagement',
  selectReceiveNetwork: 'receive',
  selectSendToken: 'send',
  selectSwapFromToken: 'swap',
  selectSwapToToken: 'swap',
  send: 'send',
  solanaConnection: 'ledger',
  solanaLaunch: 'send',
  stakeDetail: 'stake',
  swap: 'swap',
  toggleDeveloperMode: 'toggleDeveloperMode',
  tokenDetail: 'tokenManagement',
  tokenManagement: 'tokenManagement',
  trackTokenDetail: 'track',
  transactionSuccessful: 'transactionSuccessful',
  walletConnectScan: 'rpc',
  wallets: 'wallets',
  withdraw: 'send',
  addAccountAppConnection: 'ledger',
  appUpdate: 'onboarding'
}

/**
 * `app/new/features` directory names not expected to be covered by Appium UI E2E.
 * Excluded from feature-level % denominators, testID totals, the mapped-feature gap
 * list, and modal metrics when coverage would rely only on a linked excluded feature.
 */
const E2E_COVERAGE_EXCLUDED_FEATURES = new Set([
  'appReview',
  'bridge',
  'keystone',
  'ledger',
  'nestEgg',
  'rpc'
])

/**
 * Parse base-10 integer env; returns `defaultVal` if empty, non-finite, or outside `[min,max]`.
 * @param {string | undefined} raw
 * @param {number} defaultVal
 * @param {{ min?: number, max?: number }} [bounds]
 */
function parseEnvInt(raw, defaultVal, bounds = {}) {
  const trimmed = String(raw ?? '').trim()
  if (trimmed === '') return defaultVal
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(n)) return defaultVal
  const { min, max } = bounds
  if (min != null && n < min) return defaultVal
  if (max != null && n > max) return defaultVal
  return n
}

/** Mirrors `e2e-appium/testrail/testrail.config.ts` (API user is not secret). */
const TESTRAIL_DOMAIN =
  process.env.TESTRAIL_DOMAIN || 'https://avalabs.testrail.io'
const TESTRAIL_USERNAME =
  process.env.TESTRAIL_USERNAME || 'mobiledevs@avalabs.org'
const TESTRAIL_PROJECT_ID = parseEnvInt(process.env.TESTRAIL_PROJECT_ID, 3, {
  min: 1
})
/** Default matches `e2e-appium/testrail/testrail.config.ts` `suiteId` (filters `get_runs`). */
const TESTRAIL_SUITE_ID_FOR_RUN_LIST = parseEnvInt(
  process.env.E2E_COVERAGE_TESTRAIL_SUITE_ID,
  3,
  { min: 1 }
)

/** Parsed from `[REGRESSION] … Test Run: YYYY-MM-DD` in the run name; stale runs do not drive regression-adjusted %. */
const REGRESSION_RUN_MAX_AGE_DAYS = parseEnvInt(
  process.env.E2E_COVERAGE_REGRESSION_MAX_AGE_DAYS,
  7,
  { min: 1, max: 3660 }
)

/** Parallel `get_case` fan-out; invalid env falls back to 12 (see file header). */
const E2E_COVERAGE_TESTRAIL_CASE_CONCURRENCY = parseEnvInt(
  process.env.E2E_COVERAGE_TESTRAIL_CASE_CONCURRENCY,
  12,
  { min: 1, max: 32 }
)

/** WDIO posts status_id 1 = pass, 5 = fail (`sendResult` in testrail.service.ts). */
const TESTRAIL_STATUS_PASSED = 1
const TESTRAIL_STATUS_FAILED = 5

/**
 * Specs that use dynamic `it(\`...\${...}\`)` titles; keys are paths relative to
 * `e2e-appium/` (same as `loadAppiumSpecFiles` `rel`).
 */
const DYNAMIC_SUITE_CASES_BY_SPEC_REL = {
  'specs/transactions/receive.spec.ts': {
    suite: '[Smoke] Receive',
    titles: [
      'should verify Avalanche C-Chain/EVM address',
      'should verify Avalanche X/P-Chain address',
      'should verify Bitcoin address',
      'should verify Solana address'
    ]
  },
  'specs/transactions/buy.spec.ts': {
    suite: 'Buy',
    titles: [
      'should follow buy flow AVAX',
      'should follow buy flow USDC',
      'should follow buy flow ETH',
      'should follow buy flow BTC',
      'should follow buy flow SOL',
      'should set locale via Buy flow'
    ]
  }
}

/** @param {'iOS' | 'Android'} platform */
function platformRegressionRunRe(platform) {
  const esc = platform.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(
    `\\[REGRESSION\\]\\s+${esc}\\s+Test\\s+Run:\\s*\\d{4}-\\d{2}-\\d{2}`,
    'i'
  )
}

/** @param {object[]} runs @param {'iOS' | 'Android'} platform */
function pickLatestPlatformRegressionRun(runs, platform) {
  const re = platformRegressionRunRe(platform)
  const hits = runs.filter(
    r => r && typeof r.name === 'string' && re.test(r.name)
  )
  hits.sort((a, b) => (b.created_on || 0) - (a.created_on || 0))
  return hits[0] || null
}

/**
 * @param {string} name TestRail run name
 * @returns {number | null} UTC ms at start of the `YYYY-MM-DD` calendar day in the name
 */
function parseRegressionRunDateMsFromName(name) {
  const m = String(name).match(/Test\s+Run:\s*(\d{4}-\d{2}-\d{2})/i)
  if (!m) return null
  const [y, mo, d] = m[1].split('-').map(Number)
  if (!y || !mo || !d) return null
  return Date.UTC(y, mo - 1, d)
}

/**
 * @param {string} name
 * @param {number} maxAgeDays
 */
function regressionRunNameIsWithinMaxAge(name, maxAgeDays) {
  const runDayMs = parseRegressionRunDateMsFromName(name)
  if (runDayMs === null) return false
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 1) return false
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
  return Date.now() - runDayMs <= maxAgeMs
}

/**
 * JSON `summary.*Basis` for regression-adjusted %: stale run vs TestRail off vs mapped failure semantics.
 * @param {'ios' | 'android'} platformKey
 * @param {{ ios?: object, android?: object } | undefined} testrail
 */
function regressionAdjustedCoveragePercentBasis(platformKey, testrail) {
  const tr = testrail?.[platformKey]
  if (tr?.regressionAdjustedNotApplicable) {
    return `not_applicable_${platformKey}_regression_run_older_than_${REGRESSION_RUN_MAX_AGE_DAYS}_days`
  }
  if (!tr?.enabled) {
    return 'heuristic_total_testrail_skipped'
  }
  return platformKey === 'ios'
    ? 'inScopeMappedFeatures_heuristicO_and_noMappedIosRegressionFailure'
    : 'inScopeMappedFeatures_heuristicO_and_noMappedAndroidRegressionFailure'
}

/**
 * Regression-adjusted headline numbers: N/A when TestRail row is stale, else
 * computed metrics. When TestRail is skipped (`enabled: false`), use `adj`
 * (same as heuristic total).
 * @param {{ enabled?: boolean, staleRun?: boolean, regressionAdjustedNotApplicable?: boolean } | undefined} tr
 * @param {{ regressionAdjustedCoveragePercent: number, regressionStableFeatureCount: number, regressionFailedFeatureCount: number }} adj
 */
function pickRegressionAdjustedCounts(tr, adj) {
  if (tr?.regressionAdjustedNotApplicable || tr?.staleRun) {
    return {
      regressionAdjustedCoveragePercent: null,
      regressionStableFeatureCount: null,
      regressionFailedFeatureCount: null
    }
  }
  if (!tr?.enabled) {
    return {
      regressionAdjustedCoveragePercent: adj.regressionAdjustedCoveragePercent,
      regressionStableFeatureCount: adj.regressionStableFeatureCount,
      regressionFailedFeatureCount: adj.regressionFailedFeatureCount
    }
  }
  return {
    regressionAdjustedCoveragePercent: adj.regressionAdjustedCoveragePercent,
    regressionStableFeatureCount: adj.regressionStableFeatureCount,
    regressionFailedFeatureCount: adj.regressionFailedFeatureCount
  }
}

/** @param {string} featureFolder */
function excludedFromCoverageMetrics(featureFolder) {
  return E2E_COVERAGE_EXCLUDED_FEATURES.has(featureFolder)
}

/**
 * Modals tied only to an excluded feature (no spec path hit) are out of scope.
 * @param {{ coveredByPath: boolean, linkedFeature: string | null }} m
 */
function modalInCoverageMetricsScope(m) {
  if (m.coveredByPath) return true
  const lf = m.linkedFeature
  if (!lf) return true
  return !E2E_COVERAGE_EXCLUDED_FEATURES.has(lf)
}

/**
 * @param {string} f feature folder name
 * @param {Record<string, { tests: string[], testIdsDeclared: number, testIdsReferencedInSpec: number }>} stats
 * @returns {'O' | 'X' | '△'}
 */
function featureCoverageMark(f, stats) {
  if (excludedFromCoverageMetrics(f)) return '△'
  const s = stats[f]
  const spec = s.tests.length > 0
  const tid = s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
  return spec || tid ? 'O' : 'X'
}

/** Only Appium specs; packages/core-mobile/e2e/ (Detox) is deprecated. */
const E2E_APPIUM_DIR = path.join(pkgRoot, 'e2e-appium')

/** `required-scenarios.config.json` walletMode values with detection logic in this script. */
const SUPPORTED_REQUIRED_SCENARIO_WALLET_MODES = new Set([
  'mnemonic',
  'seedless'
])

/** Feature folder names too generic for token-only breadth matching (false positives). */
const BREADTH_AMBIGUOUS_FEATURE_DIRS = new Set([])

/**
 * Tokens shared by many names — excluded from standalone breadth token match
 * (aligned with core-web `GENERIC_FEATURE_TOKENS`).
 */
const BREADTH_GENERIC_FEATURE_TOKENS = new Set([
  'page',
  'tab',
  'tabs',
  'header',
  'grid',
  'list',
  'card',
  'row',
  'form',
  'button',
  'link',
  'table',
  'dialog',
  'modal',
  'drawer',
  'menu',
  'bar',
  'panel',
  'item',
  'cell',
  'icon',
  'layout',
  'content',
  'section'
])

/**
 * @param {unknown} rawVal
 * @param {number} defaultVal
 */
function coalesceFiniteNonNegativeWeight(rawVal, defaultVal) {
  const n = Number(rawVal ?? defaultVal)
  if (!Number.isFinite(n) || n < 0) {
    return defaultVal
  }
  return n
}

/**
 * @param {object} w
 * @param {string} key
 */
function rawWeightValueIsInvalid(w, key) {
  const v = w?.[key]
  return v != null && (!Number.isFinite(Number(v)) || Number(v) < 0)
}

/**
 * @returns {{ weights: { e2eFeatureCoveragePercent: number, requiredScenariosPercent: number, featureFolderWalletSlotPercent: number }, impliedUncertaintyPercentagePoints: number, definition?: string, configPath: string }}
 */
function loadCoverageModelConfig() {
  const configPath = path.join(E2E_APPIUM_DIR, 'coverage-model.config.json')
  const defaults = {
    weights: {
      e2eFeatureCoveragePercent: 0.08,
      requiredScenariosPercent: 0.22,
      featureFolderWalletSlotPercent: 0.7
    },
    impliedUncertaintyPercentagePoints: 10
  }
  if (!fs.existsSync(configPath)) {
    return { ...defaults, definition: undefined, configPath }
  }
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const w = raw.weights
    const weightKeys = [
      'e2eFeatureCoveragePercent',
      'requiredScenariosPercent',
      'featureFolderWalletSlotPercent'
    ]
    const hadInvalidWeight = weightKeys.some(k => rawWeightValueIsInvalid(w, k))
    if (hadInvalidWeight) {
      console.warn(
        'e2e-feature-coverage: coverage-model.config.json weights contained non-finite or negative values; defaults used for those entries.'
      )
    }
    let weights = {
      e2eFeatureCoveragePercent: coalesceFiniteNonNegativeWeight(
        w?.e2eFeatureCoveragePercent,
        defaults.weights.e2eFeatureCoveragePercent
      ),
      requiredScenariosPercent: coalesceFiniteNonNegativeWeight(
        w?.requiredScenariosPercent,
        defaults.weights.requiredScenariosPercent
      ),
      featureFolderWalletSlotPercent: coalesceFiniteNonNegativeWeight(
        w?.featureFolderWalletSlotPercent,
        defaults.weights.featureFolderWalletSlotPercent
      )
    }
    let sum =
      weights.e2eFeatureCoveragePercent +
      weights.requiredScenariosPercent +
      weights.featureFolderWalletSlotPercent
    if (!Number.isFinite(sum) || sum <= 0) {
      console.warn(
        'e2e-feature-coverage: coverage-model.config.json weights sum to zero or are invalid; using default weights.'
      )
      weights = { ...defaults.weights }
      sum =
        weights.e2eFeatureCoveragePercent +
        weights.requiredScenariosPercent +
        weights.featureFolderWalletSlotPercent
    }
    if (Number.isFinite(sum) && sum > 0 && Math.abs(sum - 1) > 0.02) {
      weights.e2eFeatureCoveragePercent /= sum
      weights.requiredScenariosPercent /= sum
      weights.featureFolderWalletSlotPercent /= sum
    }
    const impliedRaw = raw.impliedUncertaintyPercentagePoints
    const impliedInvalid =
      impliedRaw != null &&
      (!Number.isFinite(Number(impliedRaw)) || Number(impliedRaw) < 0)
    if (impliedInvalid) {
      console.warn(
        'e2e-feature-coverage: impliedUncertaintyPercentagePoints invalid; using default.'
      )
    }
    const impliedUncertaintyPercentagePoints = impliedInvalid
      ? defaults.impliedUncertaintyPercentagePoints
      : coalesceFiniteNonNegativeWeight(
          impliedRaw,
          defaults.impliedUncertaintyPercentagePoints
        )
    return {
      weights,
      impliedUncertaintyPercentagePoints,
      definition:
        typeof raw.definition === 'string' ? raw.definition : undefined,
      configPath
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn(
      `e2e-feature-coverage: could not read or parse ${configPath}: ${msg}; using default coverage model.`
    )
    return { ...defaults, definition: undefined, configPath }
  }
}

/**
 * @param {object} raw
 * @param {{ flows: string[], walletModes: string[] }} defaults
 */
function walletModesFromRequiredScenariosRaw(raw, defaults) {
  const rawModes =
    Array.isArray(raw.walletModes) && raw.walletModes.length
      ? raw.walletModes.map(m => String(m).trim())
      : defaults.walletModes
  if (rawModes.includes('ledger')) {
    console.warn(
      'e2e-feature-coverage: walletMode "ledger" is ignored in required-scenarios (not automatable in Appium).'
    )
  }
  const unsupported = rawModes.filter(
    m => m !== 'ledger' && !SUPPORTED_REQUIRED_SCENARIO_WALLET_MODES.has(m)
  )
  if (unsupported.length) {
    console.warn(
      `e2e-feature-coverage: required-scenarios walletModes ignored (no detection logic): ${unsupported.join(
        ', '
      )}. Supported: ${[...SUPPORTED_REQUIRED_SCENARIO_WALLET_MODES].join(
        ', '
      )}.`
    )
  }
  return rawModes.filter(
    m => m !== 'ledger' && SUPPORTED_REQUIRED_SCENARIO_WALLET_MODES.has(m)
  )
}

/**
 * @param {object} raw
 * @param {{ flows: string[], walletModes: string[] }} defaults
 */
function flowsFromRequiredScenariosRaw(raw, defaults) {
  const rawFlows =
    Array.isArray(raw.flows) && raw.flows.length
      ? raw.flows.map(f => String(f).trim())
      : defaults.flows
  const unknownFlows = rawFlows.filter(
    f => !Object.prototype.hasOwnProperty.call(SPEC_COVERS_FLOW_MOBILE, f)
  )
  if (unknownFlows.length) {
    console.warn(
      `e2e-feature-coverage: required-scenarios flows ignored (no heuristic in SPEC_COVERS_FLOW_MOBILE): ${unknownFlows.join(
        ', '
      )}`
    )
  }
  const flows = rawFlows.filter(f =>
    Object.prototype.hasOwnProperty.call(SPEC_COVERS_FLOW_MOBILE, f)
  )
  return flows.length ? flows : defaults.flows
}

/**
 * @returns {{ flows: string[], walletModes: string[], definition?: string, configPath: string }}
 */
function loadRequiredScenariosConfig() {
  const configPath = path.join(E2E_APPIUM_DIR, 'required-scenarios.config.json')
  const defaults = {
    flows: ['send', 'swap'],
    walletModes: ['mnemonic']
  }
  if (!fs.existsSync(configPath)) {
    return { ...defaults, definition: undefined, configPath }
  }
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const walletModes = walletModesFromRequiredScenariosRaw(raw, defaults)
    const flows = flowsFromRequiredScenariosRaw(raw, defaults)
    return {
      flows,
      walletModes: walletModes.length ? walletModes : defaults.walletModes,
      definition:
        typeof raw.definition === 'string' ? raw.definition : undefined,
      configPath
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn(
      `e2e-feature-coverage: could not read or parse ${configPath}: ${msg}; using default required-scenarios config.`
    )
    return { ...defaults, definition: undefined, configPath }
  }
}

/**
 * @param {string} dirName
 */
function featureDirMatchTokens(dirName) {
  const normalized = dirName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  const words = normalized.split(/[\s_-]+/).filter(w => w.length > 0)
  const tokens = new Set([dirName.toLowerCase(), ...words])
  if (words.length > 1) {
    tokens.add(words.join(''))
  }
  return [...tokens].filter(
    t => t.length >= 3 && !BREADTH_GENERIC_FEATURE_TOKENS.has(t)
  )
}

/**
 * @param {{ dir: string, dirLower: string, corpus: string, minTokenLen: number, matched: Set<string> }} o
 */
function addMatchedDirsFromTokens(o) {
  const { dir, dirLower, corpus, minTokenLen, matched } = o
  if (dirLower.length >= 8 && corpus.includes(dirLower)) {
    matched.add(dir)
    return
  }
  for (const tok of featureDirMatchTokens(dir)) {
    if (tok.length < minTokenLen) continue
    try {
      const re = new RegExp(
        `\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      )
      if (re.test(corpus)) {
        matched.add(dir)
        break
      }
    } catch {
      // ignore bad regex
    }
  }
}

/**
 * @param {string[]} foldersInScope
 * @param {string[]} corpusParts
 * @param {{ minTokenLen?: number }} [opts]
 */
function inferMatchedFeatureFolders(foldersInScope, corpusParts, opts = {}) {
  const minTokenLen = opts.minTokenLen ?? 4
  const corpus = corpusParts.join(' ').toLowerCase()
  const matched = new Set()
  for (const dir of foldersInScope) {
    if (BREADTH_AMBIGUOUS_FEATURE_DIRS.has(dir)) continue
    addMatchedDirsFromTokens({
      dir,
      dirLower: dir.toLowerCase(),
      corpus,
      minTokenLen,
      matched
    })
  }
  return matched
}

/**
 * First suite title from Mocha `describe` / `describe.skip` / `describe.only` or
 * `context` variants (breadth + TestRail section mapping).
 * @param {string} src
 */
function extractFirstDescribeTitle(src) {
  const m = src.match(
    /\b(?:describe|context)(?:\.(?:skip|only))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/
  )
  if (!m) return null
  return unescapeJsString(m[2])
}

/**
 * @param {string} content
 * @param {string | null} outerDescribe
 */
function collectItAndDescribeTitles(content, outerDescribe) {
  const fromIt = extractStaticItTitles(content)
  const fromDesc = extractAllStaticDescribeTitles(content)
  const merged = [...fromDesc, ...fromIt]
  if (outerDescribe != null) {
    const idx = merged.indexOf(outerDescribe)
    if (idx >= 0) merged.splice(idx, 1)
  }
  return merged
}

/** @type {Record<string, (relLower: string, text: string) => boolean>} */
const SPEC_COVERS_FLOW_MOBILE = {
  send: (relLower, text) =>
    /\/send|withdraw|sendnft|xpchain|sendethereum|sendsolana|sendbitcoin|cchain\/send|ethereum\/send|solana\/send/i.test(
      relLower
    ) ||
    /\.send\s*\(/i.test(text) ||
    /\btxPage\.send\b/i.test(text) ||
    /\bsendXPChain\b/i.test(text) ||
    /\bsendEthereum\b/i.test(text) ||
    /\bsendSolana\b/i.test(text),
  swap: (relLower, text) =>
    /swap/i.test(relLower) ||
    /\bswapOnTrack\b/i.test(text) ||
    /\btxPage\.swap\b/i.test(text) ||
    /describe\s*\(\s*['"][^'"]*swap/i.test(text),
  'cross-chain-transfer': (relLower, text) =>
    /cross.chain|crosschain|subnet.transfer|export.?chain|import.?chain|c.?bridge/i.test(
      text
    ) || /\/bridge\/|cross.chain|subnet/i.test(relLower),
  'stake-delegate': (relLower, text) =>
    /stake|staking|delegate|p.chain|addstake/i.test(relLower) ||
    /\bstakeTestnet\b/i.test(text) ||
    /\bstaking\b/i.test(text),
  defi: (relLower, text) =>
    /\/defi\/|\/earn\/|borrow|deposit/i.test(relLower) ||
    /\bdefiPage\b/i.test(text) ||
    /\bdefi\b/i.test(relLower),
  collectibles: (relLower, _text) =>
    /collectible|nft|sendnft|sendethnft/i.test(relLower),
  activity: (relLower, text) =>
    /\/activity/i.test(relLower) ||
    /\bactivityTab\b/i.test(text) ||
    /\bactivity_tab\b/i.test(text),
  settings: (relLower, _text) => relLower.includes('specs/settings/'),
  accounts: (relLower, _text) => /accounts\.spec/i.test(relLower)
}

/**
 * @param {string} flow
 * @param {string} relLower
 * @param {string} text
 */
function specCoversFlowMobile(flow, relLower, text) {
  const fn = SPEC_COVERS_FLOW_MOBILE[flow]
  if (!fn) return false
  return fn(relLower, text)
}

/**
 * @param {string} relLower
 * @param {string} text
 */
function specHasSeedlessContext(relLower, text) {
  if (relLower.includes('/seedless/') || relLower.includes('seedless/')) {
    return true
  }
  return (
    /\bseedlessWarmup\b/i.test(text) ||
    /\bWalletType\.SEEDLESS\b/.test(text) ||
    /from\s+['"][^'"]*seedless\//i.test(text) ||
    /\bSEEDLESS_/i.test(text)
  )
}

/**
 * Recovery-phrase / created-wallet login paths (Ledger excluded at matrix level).
 * @param {string} relLower
 * @param {string} text
 */
function specHasMnemonicContext(relLower, text) {
  if (relLower.includes('/ledger/')) return false
  return (
    /\bwarmup\s*\(/.test(text) ||
    /helpers\/warmup/.test(relLower) ||
    /['"]\.\.\/.*helpers\/warmup['"]/.test(text) ||
    /['"]\.\/.*helpers\/warmup['"]/.test(text) ||
    /\benterRecoveryPhrase\b/.test(text) ||
    /\bgetMnemonicWords\b/.test(text) ||
    /\btapTypeInRecoveryPhase\b/.test(text) ||
    /\btapManuallyCreateNewWallet\b/.test(text) ||
    /\bE2E_MNEMONIC\b/.test(text) ||
    /\bE2E_METAMASK_MNEMONIC\b/.test(text)
  )
}

/**
 * @param {string} mode
 * @param {string} relLower
 * @param {string} txt
 */
function specImplementsRequiredScenarioMode(mode, relLower, txt) {
  if (mode === 'mnemonic') {
    if (
      specHasSeedlessContext(relLower, txt) &&
      !specHasMnemonicContext(relLower, txt)
    ) {
      return false
    }
    return specHasMnemonicContext(relLower, txt)
  }
  if (mode === 'seedless') {
    return specHasSeedlessContext(relLower, txt)
  }
  throw new Error(
    `e2e-feature-coverage: unhandled walletMode "${mode}" (add detection or filter in loadRequiredScenariosConfig)`
  )
}

/**
 * @param {{ rel: string, abs: string, relLower: string, text: string }[]} specEntries
 * @param {{ flows: string[], walletModes: string[] }} cfg
 */
function computeRequiredScenarioMatrixMobile(specEntries, cfg) {
  /** @type {{ id: string, flow: string, walletMode: string, implemented: boolean, evidence: string[] }[]} */
  const scenarios = []

  for (const flow of cfg.flows) {
    for (const mode of cfg.walletModes) {
      const evidence = []
      for (const { rel, relLower, text: txt } of specEntries) {
        if (!specCoversFlowMobile(flow, relLower, txt)) continue
        if (specImplementsRequiredScenarioMode(mode, relLower, txt)) {
          evidence.push(rel)
        }
      }
      const evidenceSorted = [...new Set(evidence)].sort()
      scenarios.push({
        id: `${flow}-${mode}`,
        flow,
        walletMode: mode,
        implemented: evidenceSorted.length > 0,
        evidence: evidenceSorted
      })
    }
  }

  const totalRequired = scenarios.length
  const implementedCount = scenarios.filter(s => s.implemented).length
  const pct =
    totalRequired === 0
      ? 0
      : Math.round((100 * implementedCount) / totalRequired)
  return {
    scenarios,
    totalRequired,
    implementedCount,
    percent: pct,
    missing: scenarios.filter(s => !s.implemented).map(s => s.id)
  }
}

/**
 * @param {{ rel: string, abs: string, relLower: string, text: string }[]} specEntries
 * @param {string[]} foldersInScope breadth denominator: `app/new/features/*` minus exclusions
 */
function computeE2eFeatureBreadth(specEntries, foldersInScope) {
  const claimed = new Set()
  for (const { rel, text: content } of specEntries) {
    const base = path.basename(rel, path.extname(rel))
    const stem = base.replace(/\.spec$/i, '') || base
    const describeTitle = extractFirstDescribeTitle(content)
    const primaryCorpus = [
      stem,
      ...(describeTitle ? [describeTitle] : [])
    ].filter(Boolean)
    const matchedPrimary = inferMatchedFeatureFolders(
      foldersInScope,
      primaryCorpus,
      { minTokenLen: 3 }
    )
    const looseTitles = collectItAndDescribeTitles(content, describeTitle)
    const matchedLoose = inferMatchedFeatureFolders(
      foldersInScope,
      looseTitles,
      {
        minTokenLen: 8
      }
    )
    for (const d of matchedPrimary) claimed.add(d)
    for (const d of matchedLoose) claimed.add(d)
  }

  const totalAppFeatureAreas = foldersInScope.length
  const matchedSet = new Set(claimed)
  const featureAreasMatchedBySpecs = matchedSet.size
  const uncoveredFeatureAreas = foldersInScope
    .filter(f => !matchedSet.has(f))
    .sort()
  const pct =
    totalAppFeatureAreas === 0
      ? 0
      : Math.round((100 * featureAreasMatchedBySpecs) / totalAppFeatureAreas)

  return {
    totalAppFeatureAreas,
    featureAreasMatchedByAtLeastOneSpec: featureAreasMatchedBySpecs,
    percent: pct,
    uncoveredFeatureAreas,
    featureAreasClaimedSet: matchedSet
  }
}

/**
 * @param {number} featureCoveragePercent
 * @param {number} requiredScenariosPercent
 * @param {number} featureWalletSlotPercent
 * @param {{ weights: { e2eFeatureCoveragePercent: number, requiredScenariosPercent: number, featureFolderWalletSlotPercent: number } }} modelCfg
 */
function computeCodebaseCompositePercent(
  featureCoveragePercent,
  requiredScenariosPercent,
  featureWalletSlotPercent,
  modelCfg
) {
  const w = modelCfg.weights
  return (
    Math.round(
      (w.e2eFeatureCoveragePercent * featureCoveragePercent +
        w.requiredScenariosPercent * requiredScenariosPercent +
        w.featureFolderWalletSlotPercent * featureWalletSlotPercent) *
        100
    ) / 100
  )
}

function loadAxios() {
  return pkgRequire('axios')
}

function createTestrailClient() {
  const apiKey = process.env.TESTRAIL_API_KEY
  if (!apiKey) return null
  const axios = loadAxios()
  return axios.create({
    baseURL: `${TESTRAIL_DOMAIN}/index.php?/api/v2`,
    auth: { username: TESTRAIL_USERNAME, password: apiKey },
    timeout: 120000
  })
}

/**
 * Paginates `get_runs` until a short page or `E2E_COVERAGE_TESTRAIL_RUNS_MAX_PAGES`
 * (default 15, max 50) is reached. Requests are scoped with `suite_id` and
 * optional `created_after` (see file header) to reduce payload vs full history.
 * @param {import('axios').AxiosInstance} client
 */
async function fetchAllProjectRuns(client) {
  const all = []
  let offset = 0
  const limit = 250
  const maxPages = parseEnvInt(
    process.env.E2E_COVERAGE_TESTRAIL_RUNS_MAX_PAGES,
    15,
    { min: 1, max: 50 }
  )
  const createdAfterDaysFallback = parseEnvInt(
    process.env.E2E_COVERAGE_TESTRAIL_RUNS_CREATED_AFTER_DAYS,
    180,
    { min: 1, max: 3660 }
  )
  const createdAfterDays = Math.max(
    REGRESSION_RUN_MAX_AGE_DAYS + 1,
    createdAfterDaysFallback
  )
  const useCreatedAfter =
    process.env.E2E_COVERAGE_TESTRAIL_RUNS_NO_CREATED_AFTER !== '1'
  const createdAfterUnix = useCreatedAfter
    ? Math.floor(Date.now() / 1000) - createdAfterDays * 24 * 60 * 60
    : undefined
  for (let page = 0; page < maxPages; page++) {
    const { data } = await client.get(`/get_runs/${TESTRAIL_PROJECT_ID}`, {
      params: {
        offset,
        limit,
        suite_id: TESTRAIL_SUITE_ID_FOR_RUN_LIST,
        ...(createdAfterUnix != null ? { created_after: createdAfterUnix } : {})
      }
    })
    const batch = Array.isArray(data) ? data : data.runs || []
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return all
}

/**
 * @param {import('axios').AxiosInstance} client
 * @param {number} runId
 */
async function fetchAllTestsForRun(client, runId) {
  const all = []
  let offset = 0
  const limit = 250
  for (;;) {
    const { data } = await client.get(`/get_tests/${runId}`, {
      params: { offset, limit }
    })
    const batch = Array.isArray(data) ? data : data.tests || []
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return all
}

/**
 * Static `it` / `it.skip` / `it.only` / `test` / `test.skip` / `test.only` titles.
 * @param {string} src
 * @returns {string[]}
 */
function extractStaticItTitles(src) {
  const titles = []
  const re =
    /\b(?:it|test)(?:\.(?:skip|only))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(src)) !== null) {
    const q = m[1]
    const inner = unescapeJsString(m[2])
    if (q === '`' && inner.includes('${')) continue
    titles.push(inner)
  }
  return titles
}

/**
 * Static `describe` / `describe.skip` / `describe.only` / `context` titles (breadth loose corpus).
 * @param {string} src
 * @returns {string[]}
 */
function extractAllStaticDescribeTitles(src) {
  const titles = []
  const re =
    /\b(?:describe|context)(?:\.(?:skip|only))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g
  let m
  while ((m = re.exec(src)) !== null) {
    const q = m[1]
    const inner = unescapeJsString(m[2])
    if (q === '`' && inner.includes('${')) continue
    titles.push(inner)
  }
  return titles
}

/**
 * Map `"<describe title>\\t<it title>"` → spec rel paths (see WDIO `beforeTest` / `afterTest`).
 */
function addSuiteCaseKeysForSpec(map, rel, suite, titles) {
  const s = suite.trim()
  for (const raw of titles) {
    const t = raw.trim()
    if (!t) continue
    const key = `${s}\t${t}`
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(rel)
  }
}

/**
 * @param {{ rel: string, text: string }[]} specEntries
 */
function buildSuiteCaseToSpecRelMap(specEntries) {
  /** @type {Map<string, Set<string>>} */
  const map = new Map()
  for (const { rel, text } of specEntries) {
    const manual = DYNAMIC_SUITE_CASES_BY_SPEC_REL[rel]
    const suite = manual?.suite ?? extractFirstDescribeTitle(text)
    if (!suite) continue
    const titles = manual?.titles ?? extractStaticItTitles(text)
    addSuiteCaseKeysForSpec(map, rel, suite, titles)
  }
  /** @type {Map<string, string[]>} */
  const out = new Map()
  for (const [k, set] of map) {
    out.set(k, [...set])
  }
  return out
}

/**
 * @param {import('axios').AxiosInstance} client
 * @param {object} run TestRail run (from get_runs / picker)
 */
async function fetchRunSuiteId(client, run) {
  if (run?.suite_id != null && run.suite_id !== '') return Number(run.suite_id)
  const { data } = await client.get(`/get_run/${run.id}`)
  return data?.suite_id != null ? Number(data.suite_id) : null
}

/**
 * All section names for a suite (one paginated endpoint family vs many get_section).
 * @param {import('axios').AxiosInstance} client
 * @param {number | null} suiteId
 * @returns {Promise<Map<number, string>>}
 */
/**
 * @param {Map<number, string>} map
 * @param {object[]} batch
 */
function mergeSectionBatchIntoMap(map, batch) {
  for (const s of batch) {
    if (s?.id != null) map.set(Number(s.id), String(s.name || '').trim())
  }
}

async function fetchSectionNameByIdMap(client, suiteId) {
  /** @type {Map<number, string>} */
  const map = new Map()
  if (suiteId == null || Number.isNaN(suiteId)) return map
  let offset = 0
  const limit = 250
  for (;;) {
    const { data } = await client.get(
      `/get_sections/${TESTRAIL_PROJECT_ID}&suite_id=${suiteId}`,
      { params: { offset, limit } }
    )
    const batch = Array.isArray(data) ? data : data.sections || []
    if (!Array.isArray(batch) || batch.length === 0) break
    mergeSectionBatchIntoMap(map, batch)
    if (batch.length < limit) break
    offset += limit
  }
  return map
}

/**
 * @param {import('axios').AxiosInstance} client
 * @param {number} caseId
 * @param {Map<number, string>} sectionNameById
 */
async function fetchCaseMetaForId(client, caseId, sectionNameById) {
  try {
    const { data } = await client.get(`/get_case/${caseId}`)
    const caseTitle = (data.title || '').trim()
    const secId = data.section_id != null ? Number(data.section_id) : null
    let sectionName = secId != null ? sectionNameById.get(secId) || '' : ''
    if (!sectionName && secId != null) {
      const { data: sec } = await client.get(`/get_section/${secId}`)
      sectionName = String(sec.name || '').trim()
      sectionNameById.set(secId, sectionName)
    }
    return { sectionName, caseTitle }
  } catch {
    return null
  }
}

/**
 * Parallel `get_case` for unique case IDs (bounded concurrency), plus one
 * suite-wide `get_sections` map—avoids N+1 sequential `get_case`/`get_section`
 * per test row. Uses `get_tests` `title` when applying rows (see `applyTestrailTestRowSync`).
 * @param {import('axios').AxiosInstance} client
 * @param {number[]} caseIds
 * @param {Map<number, string>} sectionNameById — mutated when fallback get_section runs
 * @param {Map<number, { sectionName: string, caseTitle: string } | null> | undefined} sharedCaseMetaById — when set (same Map for iOS + Android in one script run), reuses `get_case` results across platforms
 */
async function fetchCaseMetaByIdsParallel(
  client,
  caseIds,
  sectionNameById,
  sharedCaseMetaById
) {
  /** @type {Map<number, { sectionName: string, caseTitle: string } | null>} */
  const backing = sharedCaseMetaById ?? new Map()
  const ids = [...new Set(caseIds)].filter(
    id => id != null && !Number.isNaN(id)
  )
  const toFetch = ids.filter(id => !backing.has(id))
  const concurrency = E2E_COVERAGE_TESTRAIL_CASE_CONCURRENCY
  let cursor = 0
  async function worker() {
    for (;;) {
      const i = cursor++
      if (i >= toFetch.length) return
      const caseId = toFetch[i]
      const meta = await fetchCaseMetaForId(client, caseId, sectionNameById)
      backing.set(caseId, meta)
    }
  }
  if (toFetch.length > 0) {
    const n = Math.min(concurrency, toFetch.length)
    await Promise.all(Array.from({ length: n }, () => worker()))
  }
  const slice = new Map()
  for (const id of ids) {
    slice.set(id, backing.get(id) ?? null)
  }
  return slice
}

/**
 * @param {{ unmappedCount: number, unmappedFailedCount: number, unmappedSamples: string[] }} acc
 * @param {number} sid
 * @param {string} sample
 * @param {number} maxSamples
 */
function recordTestrailUnmapped(acc, sid, sample, maxSamples) {
  acc.unmappedCount += 1
  if (sid === TESTRAIL_STATUS_FAILED) acc.unmappedFailedCount += 1
  if (acc.unmappedSamples.length < maxSamples) {
    acc.unmappedSamples.push(sample)
  }
}

/**
 * @param {object} t TestRail test row (`get_tests` includes `title` = case title)
 * @param {Map<string, string[]>} suiteCaseToSpecRels
 * @param {Map<number, { sectionName: string, caseTitle: string } | null>} caseMetaById
 * @param {{ failedSet: Set<string>, mappedTotal: number, mappedPassed: number, mappedFailed: number, unmappedCount: number, unmappedFailedCount: number, unmappedSamples: string[] }} acc
 */
function applyTestrailTestRowSync(t, suiteCaseToSpecRels, caseMetaById, acc) {
  const sid = t.status_id
  const caseId = t.case_id
  const row = caseMetaById.get(caseId)
  if (!row) {
    recordTestrailUnmapped(acc, sid, `(case ${caseId} API error)`, 8)
    return
  }
  const caseTitle = String(t.title || row.caseTitle || '').trim()
  const mapKey = `${row.sectionName}\t${caseTitle}`
  const rels = suiteCaseToSpecRels.get(mapKey)
  if (!rels || rels.length === 0) {
    recordTestrailUnmapped(acc, sid, mapKey, 12)
    return
  }

  acc.mappedTotal += 1
  if (sid === TESTRAIL_STATUS_PASSED) acc.mappedPassed += 1
  else if (sid === TESTRAIL_STATUS_FAILED) acc.mappedFailed += 1

  if (sid === TESTRAIL_STATUS_FAILED) {
    for (const rel of rels) acc.failedSet.add(rel)
  }
}

/**
 * @param {import('axios').AxiosInstance} client
 * @param {Map<string, string[]>} suiteCaseToSpecRels
 * @param {object[]} runs — from `fetchAllProjectRuns` (reused for iOS + Android)
 * @param {'iOS' | 'Android'} platform
 * @param {Map<number, { sectionName: string, caseTitle: string } | null> | undefined} caseMetaByIdCache — shared across both platforms in one invocation to avoid duplicate `get_case` calls
 */
async function fetchTestrailPlatformRegressionContext(
  client,
  suiteCaseToSpecRels,
  runs,
  platform,
  caseMetaByIdCache
) {
  const run = pickLatestPlatformRegressionRun(runs, platform)
  if (!run) {
    return {
      ok: false,
      staleRun: false,
      error: `No [REGRESSION] ${platform} Test Run: YYYY-MM-DD found in TestRail project`,
      run: null,
      failedSpecRels: [],
      mappedTotal: 0,
      mappedPassed: 0,
      mappedFailed: 0,
      unmappedCount: 0,
      unmappedFailedCount: 0,
      unmappedSamples: /** @type {string[]} */ ([])
    }
  }

  if (!regressionRunNameIsWithinMaxAge(run.name, REGRESSION_RUN_MAX_AGE_DAYS)) {
    return {
      ok: true,
      staleRun: true,
      error: null,
      run,
      failedSpecRels: [],
      mappedTotal: 0,
      mappedPassed: 0,
      mappedFailed: 0,
      mappedPassPct: null,
      unmappedCount: 0,
      unmappedFailedCount: 0,
      unmappedSamples: /** @type {string[]} */ ([])
    }
  }

  const tests = await fetchAllTestsForRun(client, run.id)
  const suiteId = await fetchRunSuiteId(client, run)
  const sectionNameById = await fetchSectionNameByIdMap(client, suiteId)
  const uniqueCaseIds = tests.map(t => t.case_id).filter(Boolean)
  const caseMetaById = await fetchCaseMetaByIdsParallel(
    client,
    uniqueCaseIds,
    sectionNameById,
    caseMetaByIdCache
  )
  const acc = {
    failedSet: new Set(),
    mappedTotal: 0,
    mappedPassed: 0,
    mappedFailed: 0,
    unmappedCount: 0,
    unmappedFailedCount: 0,
    unmappedSamples: /** @type {string[]} */ ([])
  }
  for (const t of tests) {
    applyTestrailTestRowSync(t, suiteCaseToSpecRels, caseMetaById, acc)
  }

  const failedSpecRels = [...acc.failedSet].sort()
  const mappedPassPct =
    acc.mappedTotal === 0
      ? null
      : Math.round((100 * acc.mappedPassed) / acc.mappedTotal)

  return {
    ok: true,
    staleRun: false,
    error: null,
    run,
    failedSpecRels,
    mappedTotal: acc.mappedTotal,
    mappedPassed: acc.mappedPassed,
    mappedFailed: acc.mappedFailed,
    mappedPassPct,
    unmappedCount: acc.unmappedCount,
    unmappedFailedCount: acc.unmappedFailedCount,
    unmappedSamples: acc.unmappedSamples
  }
}

/**
 * @param {{ ok: boolean, staleRun?: boolean, error: string | null, run: object | null, failedSpecRels: string[], mappedTotal: number, mappedPassed: number, mappedFailed: number, mappedPassPct: number | null, unmappedCount: number, unmappedFailedCount: number, unmappedSamples: string[] }} tr
 */
function testrailUiSummaryFromFetch(tr) {
  if (tr.ok && tr.run) {
    const base = {
      enabled: true,
      regressionRunMaxAgeDays: REGRESSION_RUN_MAX_AGE_DAYS,
      staleRun: Boolean(tr.staleRun),
      runId: tr.run.id,
      runName: tr.run.name,
      mappedTestsInRun: tr.mappedTotal,
      mappedPassed: tr.mappedPassed,
      mappedFailed: tr.mappedFailed,
      mappedPassPercent: tr.mappedPassPct,
      unmappedTestResults: tr.unmappedCount,
      unmappedFailedTestResults: tr.unmappedFailedCount,
      failedSpecRelPaths: tr.failedSpecRels,
      unmappedKeySamples: tr.unmappedSamples
    }
    if (tr.staleRun) {
      return {
        ...base,
        regressionAdjustedNotApplicable: true,
        regressionAdjustedNotApplicableReason: `Latest matching run is older than ${REGRESSION_RUN_MAX_AGE_DAYS} day(s) (date in run name); regression-adjusted % and mapped failures are not applied.`
      }
    }
    return base
  }
  return {
    enabled: false,
    skipReason: tr.error || 'TestRail fetch incomplete'
  }
}

/** @param {string} abs */
function safeStatSync(abs) {
  try {
    return fs.statSync(abs)
  } catch {
    return null
  }
}

/**
 * @param {string} abs
 * @param {string} rel
 * @param {(rel: string, base: string) => boolean} ignore
 * @param {(abs: string, rel: string) => void} walkFn
 */
function walkTestsDirectory(abs, rel, ignore, walkFn) {
  const base = path.basename(abs)
  if (ignore(rel, base)) return
  for (const name of fs.readdirSync(abs)) {
    walkFn(path.join(abs, name), rel ? `${rel}/${name}` : name)
  }
}

/**
 * @param {string} dir
 * @param {(rel: string, base: string) => boolean} ignore
 * @param {string[]} exts
 * @returns {string[]} relative posix paths from pkgRoot
 */
function walkTests(dir, ignore, exts) {
  const out = []
  if (!fs.existsSync(dir)) return out

  function walk(abs, rel) {
    const stat = safeStatSync(abs)
    if (!stat) return
    if (stat.isDirectory()) {
      walkTestsDirectory(abs, rel, ignore, walk)
      return
    }
    if (!exts.some(ext => abs.endsWith(ext))) return
    out.push(rel.split(path.sep).join('/'))
  }

  walk(dir, '')
  return out.sort()
}

/**
 * @param {Set<string>} ids
 * @param {string | undefined} s
 */
function addSanitizedTestId(ids, s) {
  if (!s || typeof s !== 'string') return
  const t = s.trim()
  if (t.length === 0 || t.length > 200) return
  if (t === 'string' || t === 'boolean' || t === 'undefined') return
  ids.add(t)
}

/**
 * @param {Set<string>} ids
 * @param {RegExpMatchArray} m
 */
function addTestIdsFromTemplateLiteralMatch(ids, m) {
  const raw = m[1].replace(/\\`/g, '`')
  if (!raw.includes('${')) {
    addSanitizedTestId(ids, raw)
    return
  }
  const pre = raw.split('${')[0]
  if (pre.length >= 3) addSanitizedTestId(ids, pre)
}

/**
 * Extract static testID strings from TSX (and dynamic template prefixes).
 * @param {string} content
 * @returns {Set<string>}
 */
function extractTestIdsFromTsx(content) {
  const ids = new Set()
  const add = s => addSanitizedTestId(ids, s)

  for (const m of content.matchAll(/testID\s*=\s*"([^"]+)"/g)) add(m[1])
  for (const m of content.matchAll(/testID\s*=\s*'([^']+)'/g)) add(m[1])
  for (const m of content.matchAll(
    /testID\s*=\s*\{\s*["']([^'"]+)["']\s*\}/g
  )) {
    add(m[1])
  }

  for (const m of content.matchAll(/testID\s*=\s*\{\s*`([^`]+)`\s*\}/g)) {
    addTestIdsFromTemplateLiteralMatch(ids, m)
  }

  for (const m of content.matchAll(/testID\s*=\s*\{([^}]+)\}/g)) {
    const inner = m[1]
    for (const sm of inner.matchAll(/['"]([^'"]+)['"]/g)) add(sm[1])
  }

  return ids
}

/**
 * Collect quoted string literals from TS (locator values, getById args, etc.).
 * @param {string} text
 * @param {Set<string>} into
 */
function collectStringLiteralsFromTs(text, into) {
  const dq = /"([^"\\]|\\.)*"/g
  let m
  while ((m = dq.exec(text)) !== null) {
    into.add(unescapeJsString(m[0].slice(1, -1)))
  }
  const sq = /'([^'\\]|\\.)*'/g
  while ((m = sq.exec(text)) !== null) {
    into.add(unescapeJsString(m[0].slice(1, -1)))
  }
  const bt = /`([^`\\]|\\.)*`/g
  while ((m = bt.exec(text)) !== null) {
    const inner = m[0].slice(1, -1)
    if (!inner.includes('${')) {
      into.add(unescapeJsString(inner))
    }
  }
}

function unescapeJsString(s) {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

/**
 * @param {string} id
 * @param {Set<string>} literals
 * @param {string} corpus
 * @param {string[]} literalList — only used for prefix checks
 */
function isTestIdReferencedInSpecSources(id, literals, corpus, literalList) {
  if (literals.has(id)) return true
  // Substring in spec file text (covers string concat in specs); skip very
  // short ids to reduce accidental matches inside unrelated strings.
  if (id.length >= 4 && corpus.includes(id)) return true
  if (id.length < 4 && corpus.includes(id)) {
    const re = new RegExp(
      `['"\`]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`
    )
    if (re.test(corpus)) return true
  }
  if (id.endsWith('__') || id.endsWith('-')) {
    for (const lit of literalList) {
      if (lit.startsWith(id)) return true
    }
  }
  return false
}

/**
 * Adds to `failed` any mapped in-scope features touched by one failed spec
 * (path heuristic or feature testIDs referenced in that spec’s source).
 * @param {string} rel Path relative to `e2e-appium/` (e.g. `specs/foo.spec.ts`)
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 * @param {Set<string>} failed
 */
function addFeaturesTouchedByFailedSpec(
  rel,
  featureNames,
  featureStats,
  failed
) {
  const abs = path.join(E2E_APPIUM_DIR, ...rel.split('/'))
  let specText = ''
  try {
    specText = fs.readFileSync(abs, 'utf8')
  } catch {
    specText = ''
  }
  const literals = new Set()
  collectStringLiteralsFromTs(specText, literals)
  const literalList = [...literals]
  const relLower = rel.toLowerCase()
  for (const f of featureNames) {
    if (!FEATURE_SIGNALS[f] || excludedFromCoverageMetrics(f)) continue
    if (featureMatches(relLower, specText, f)) {
      failed.add(f)
      continue
    }
    const ids = featureStats[f].testIdsDeclaredList
    if (!ids || ids.length === 0) continue
    for (const id of ids) {
      if (
        isTestIdReferencedInSpecSources(id, literals, specText, literalList)
      ) {
        failed.add(f)
        break
      }
    }
  }
}

function computeRegressionFailedFeatures(
  failedSpecRels,
  featureNames,
  featureStats
) {
  const failed = new Set()
  for (const rel of failedSpecRels) {
    addFeaturesTouchedByFailedSpec(rel, featureNames, featureStats, failed)
  }
  return failed
}

/**
 * @param {string[]} featuresWithSignalsInScope
 * @param {Record<string, object>} featureStats
 * @param {Set<string>} regressionFailedFeatures
 */
function computeRegressionAdjustedMetrics(
  featuresWithSignalsInScope,
  featureStats,
  regressionFailedFeatures
) {
  const nInScope = featuresWithSignalsInScope.length
  const stableCount = featuresWithSignalsInScope.filter(f => {
    const s = featureStats[f]
    const o =
      s.tests.length > 0 ||
      (s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0)
    return o && !regressionFailedFeatures.has(f)
  }).length
  const unstableCount = featuresWithSignalsInScope.filter(f =>
    regressionFailedFeatures.has(f)
  ).length
  const stablePct =
    nInScope === 0 ? 0 : Math.round((100 * stableCount) / nInScope)
  return {
    regressionAdjustedCoveragePercent: stablePct,
    regressionStableFeatureCount: stableCount,
    regressionFailedFeatureCount: unstableCount
  }
}

/**
 * @param {string} featureDirAbs
 * @returns {{ declared: Set<string>, filesScanned: number }}
 */
function collectFeatureTestIds(featureDirAbs) {
  const declared = new Set()
  let filesScanned = 0

  function walk(abs) {
    let stat
    try {
      stat = fs.statSync(abs)
    } catch {
      return
    }
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(abs)) {
        walk(path.join(abs, name))
      }
      return
    }
    if (!abs.endsWith('.tsx') || abs.endsWith('.test.tsx')) return
    filesScanned += 1
    let text
    try {
      text = fs.readFileSync(abs, 'utf8')
    } catch {
      return
    }
    for (const id of extractTestIdsFromTsx(text)) declared.add(id)
  }

  walk(featureDirAbs)
  return { declared, filesScanned }
}

/**
 * @param {string} featureDir
 */
function countFeatureTsx(featureDir) {
  let components = 0
  let screens = 0

  function walk(abs) {
    let stat
    try {
      stat = fs.statSync(abs)
    } catch {
      return
    }
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(abs)) {
        if (name === 'node_modules') continue
        walk(path.join(abs, name))
      }
      return
    }
    if (!abs.endsWith('.tsx')) return
    if (abs.endsWith('.test.tsx')) return
    components += 1
    const base = path.basename(abs)
    if (
      base.includes('Screen') ||
      abs.includes(`${path.sep}screens${path.sep}`)
    ) {
      screens += 1
    }
  }

  walk(featureDir)
  return { components, screens }
}

/**
 * @param {string} relTestPath posix, lowercase
 * @param {string} content
 * @param {string} feature
 */
function featureMatches(relTestPath, content, feature) {
  const sig = FEATURE_SIGNALS[feature]
  if (!sig) return false
  const pathHit =
    sig.pathSubstrings?.some(s => relTestPath.includes(s.toLowerCase())) ??
    false
  const contentHit = Boolean(
    sig.content && content && sig.content.test(content)
  )
  return pathHit || contentHit
}

/**
 * @param {string} modalName
 * @param {string} relLower
 */
function modalMatchesTest(modalName, relLower) {
  const notificationsHit =
    modalName === 'notifications' && relLower.includes('notification')
  const compact = modalName.toLowerCase()
  const compactHit = relLower.includes(compact)
  const slug = modalName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
  const squashed = slug.replace(/_/g, '')
  const squashedHit = squashed.length >= 4 && relLower.includes(squashed)
  return notificationsHit || compactHit || squashedHit
}

/**
 * @param {string} modalName
 * @param {string[]} featureNames
 */
function modalLinkedFeature(modalName, featureNames) {
  return (
    MODAL_FEATURE_LINK[modalName] ??
    (featureNames.includes(modalName) ? modalName : null)
  )
}

function loadAppiumSpecFiles() {
  const ignoreAppium = (rel, base) => base === 'node_modules'
  return walkTests(E2E_APPIUM_DIR, ignoreAppium, ['.spec.ts']).map(rel => ({
    rel,
    abs: path.join(E2E_APPIUM_DIR, ...rel.split('/'))
  }))
}

/**
 * Single `readFileSync` per spec; reuse for literals/corpus, breadth, scenarios, feature matching, TestRail map.
 * Specs that cannot be read are omitted from metrics that depend on file contents (and listed in a warning).
 * @param {{ rel: string, abs: string }[]} testFiles
 * @returns {{ rel: string, abs: string, relLower: string, text: string }[]}
 */
function buildAppiumSpecEntries(testFiles) {
  /** @type {{ rel: string, abs: string, relLower: string, text: string }[]} */
  const entries = []
  /** @type {string[]} */
  const skippedRel = []
  for (const { rel, abs } of testFiles) {
    try {
      const text = fs.readFileSync(abs, 'utf8')
      entries.push({ rel, abs, relLower: rel.toLowerCase(), text })
    } catch {
      skippedRel.push(rel)
    }
  }
  if (skippedRel.length > 0) {
    console.warn(
      `e2e-feature-coverage: skipped ${
        skippedRel.length
      } Appium spec(s) (unreadable); excluded from content-based metrics: ${skippedRel.join(
        ', '
      )}`
    )
  }
  return entries
}

/**
 * @param {{ rel: string, abs: string, relLower: string, text: string }[]} specEntries
 */
function buildSpecLiteralsAndCorpusFromEntries(specEntries) {
  const specLiteralSet = new Set()
  const specCorpusParts = []
  for (const { text } of specEntries) {
    specCorpusParts.push(text)
    collectStringLiteralsFromTs(text, specLiteralSet)
  }
  return {
    specLiteralSet,
    specCorpus: specCorpusParts.join('\n'),
    specLiteralList: [...specLiteralSet]
  }
}

function readFeatureFolderNames() {
  return fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()
}

/**
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 * @param {Set<string>} specLiteralSet
 * @param {string} specCorpus
 * @param {string[]} specLiteralList
 */
function populateFeatureStats(
  featureNames,
  featureStats,
  specLiteralSet,
  specCorpus,
  specLiteralList
) {
  for (const name of featureNames) {
    const featAbs = path.join(featuresDir, name)
    const counts = countFeatureTsx(featAbs)
    const { declared: testIdsDeclaredSet, filesScanned: testIdFilesScanned } =
      collectFeatureTestIds(featAbs)

    const testIdsDeclaredList = [...testIdsDeclaredSet]
    const testIdsReferencedList = testIdsDeclaredList.filter(id =>
      isTestIdReferencedInSpecSources(
        id,
        specLiteralSet,
        specCorpus,
        specLiteralList
      )
    )
    const referencedSet = new Set(testIdsReferencedList)
    const testIdsUnreferencedList = testIdsDeclaredList.filter(
      id => !referencedSet.has(id)
    )

    featureStats[name] = {
      ...counts,
      tests: [],
      testIdFilesScanned,
      testIdsDeclared: testIdsDeclaredList.length,
      testIdsReferencedInSpec: testIdsReferencedList.length,
      testIdReferencePercent:
        testIdsDeclaredList.length === 0
          ? null
          : Math.round(
              (100 * testIdsReferencedList.length) / testIdsDeclaredList.length
            ),
      testIdsDeclaredList,
      testIdsReferencedList,
      testIdsUnreferencedList
    }
  }
}

/**
 * @param {{ rel: string, abs: string, relLower: string, text: string }[]} specEntries
 * @param {string[]} featureNames
 * @param {Record<string, { tests: string[] }>} featureStats
 */
function matchSpecsToFeatures(specEntries, featureNames, featureStats) {
  const testToFeatures = []
  for (const { rel, relLower, text: content } of specEntries) {
    const matched = []
    for (const f of featureNames) {
      if (!FEATURE_SIGNALS[f]) continue
      if (featureMatches(relLower, content, f)) {
        matched.push(f)
        featureStats[f].tests.push(rel)
      }
    }
    testToFeatures.push({ rel, features: matched })
  }
  return testToFeatures
}

/**
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 * @param {string[]} excludedFeatureList
 */
function buildCoverageCounts(featureNames, featureStats, excludedFeatureList) {
  const featuresWithSignals = featureNames.filter(f => FEATURE_SIGNALS[f])
  const featuresWithSignalsInScope = featuresWithSignals.filter(
    f => !excludedFromCoverageMetrics(f)
  )

  const coveredBySpec = featuresWithSignalsInScope.filter(
    f => featureStats[f].tests.length > 0
  ).length
  const nInScope = featuresWithSignalsInScope.length
  const specPct =
    nInScope === 0 ? 0 : Math.round((100 * coveredBySpec) / nInScope)

  const coveredByTestId = featuresWithSignalsInScope.filter(f => {
    const s = featureStats[f]
    return s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
  }).length
  const testIdPct =
    nInScope === 0 ? 0 : Math.round((100 * coveredByTestId) / nInScope)

  const coveredEither = featuresWithSignalsInScope.filter(f => {
    const s = featureStats[f]
    const spec = s.tests.length > 0
    const tid = s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
    return spec || tid
  }).length
  const eitherPct =
    nInScope === 0 ? 0 : Math.round((100 * coveredEither) / nInScope)

  let totalDeclaredTestIds = 0
  let totalReferencedTestIdsInSpec = 0
  for (const f of featureNames) {
    if (excludedFromCoverageMetrics(f)) continue
    const s = featureStats[f]
    totalDeclaredTestIds += s.testIdsDeclared
    totalReferencedTestIdsInSpec += s.testIdsReferencedInSpec
  }
  const testIdLiteralInSpecPct =
    totalDeclaredTestIds === 0
      ? null
      : Math.round((100 * totalReferencedTestIdsInSpec) / totalDeclaredTestIds)

  return {
    featuresWithSignals,
    excludedFeatureList,
    featuresWithSignalsInScope,
    coveredBySpec,
    specPct,
    coveredByTestId,
    testIdPct,
    coveredEither,
    eitherPct,
    totalDeclaredTestIds,
    totalReferencedTestIdsInSpec,
    testIdLiteralInSpecPct,
    totalCoveragePercent: eitherPct
  }
}

function readModalFolderNames() {
  if (!fs.existsSync(modalsDir)) return []
  return fs
    .readdirSync(modalsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()
}

/**
 * @param {string} m
 * @param {{ rel: string, abs: string, relLower?: string, text?: string }[]} specEntries
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function buildOneModalCoverage(m, specEntries, featureNames, featureStats) {
  const relHits = specEntries.filter(({ rel }) =>
    modalMatchesTest(m, rel.toLowerCase())
  )
  const linked = modalLinkedFeature(m, featureNames)
  const linkedFeat = linked ? featureStats[linked] : null
  const linkedSpecHit = Boolean(linkedFeat && linkedFeat.tests.length > 0)
  const linkedTestIdHit = Boolean(
    linkedFeat &&
      linkedFeat.testIdsDeclared > 0 &&
      linkedFeat.testIdsReferencedInSpec > 0
  )
  const featureHit = linkedSpecHit || linkedTestIdHit
  const pathHit = relHits.length > 0
  return {
    modal: m,
    linkedFeature: linked,
    coveredByPath: pathHit,
    coveredByLinkedFeature: featureHit,
    coveredByLinkedSpec: linkedSpecHit,
    coveredByLinkedTestIds: linkedTestIdHit,
    covered: pathHit || featureHit,
    pathTests: relHits.map(h => h.rel)
  }
}

/**
 * @param {string[]} modals
 * @param {{ rel: string, abs: string, relLower?: string, text?: string }[]} specEntries
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function buildModalCoverage(modals, specEntries, featureNames, featureStats) {
  return modals.map(m =>
    buildOneModalCoverage(m, specEntries, featureNames, featureStats)
  )
}

/**
 * @param {object[]} modalCoverage
 * @param {object[]} modalsInScope
 * @param {string[]} modals
 */
function computeModalPercents(modalCoverage, modalsInScope, modals) {
  const coveredModalsPath = modalsInScope.filter(m => m.coveredByPath).length
  const coveredModalsEither = modalsInScope.filter(m => m.covered).length
  const n = modalsInScope.length
  const modalPctPath = n === 0 ? 0 : Math.round((100 * coveredModalsPath) / n)
  const modalPctEither =
    n === 0 ? 0 : Math.round((100 * coveredModalsEither) / n)
  return {
    coveredModalsPath,
    coveredModalsEither,
    modalPctPath,
    modalPctEither,
    modalsOmittedCount: modals.length - modalsInScope.length
  }
}

/**
 * @param {object} ctx
 */
function printJsonReport(ctx) {
  const {
    testFiles,
    appiumSpecsReadable,
    featureNames,
    featureStats,
    testToFeatures,
    modalCoverage,
    modals,
    modalsInScope,
    counts
  } = ctx
  const {
    featuresWithSignals,
    excludedFeatureList,
    featuresWithSignalsInScope,
    coveredBySpec,
    specPct,
    coveredByTestId,
    testIdPct,
    coveredEither,
    eitherPct,
    totalDeclaredTestIds,
    totalReferencedTestIdsInSpec,
    testIdLiteralInSpecPct,
    totalCoveragePercent,
    coveredModalsPath,
    coveredModalsEither,
    modalPctPath,
    modalPctEither,
    regressionAdjustedCoveragePercentIos,
    regressionStableFeatureCountIos,
    regressionFailedFeatureCountIos,
    regressionAdjustedCoveragePercentAndroid,
    regressionStableFeatureCountAndroid,
    regressionFailedFeatureCountAndroid,
    testrail,
    regressionFailedFeatureNamesIos,
    regressionFailedFeatureNamesAndroid,
    codebaseCompositeCoverage,
    e2eFeatureBreadth,
    requiredScenarios,
    featureFolderWalletSlotAssumption
  } = counts

  console.log(
    JSON.stringify(
      {
        summary: {
          e2eSource: 'e2e-appium',
          appiumSpecFiles: testFiles.length,
          appiumSpecFilesLoadedForMetrics: appiumSpecsReadable,
          testIdsDeclaredTotal: totalDeclaredTestIds,
          testIdsReferencedInSpecTotal: totalReferencedTestIdsInSpec,
          testIdLiteralCoverageInSpecPercent: testIdLiteralInSpecPct,
          totalCoveragePercent,
          totalCoveragePercentBasis:
            'inScopeMappedFeatures_union_specPathOrTestIdInSpec',
          codebaseCompositeCoverage,
          codebaseCompositeCoveragePercent: codebaseCompositeCoverage.percent,
          codebaseCompositeCoverageBasis:
            'weighted_e2eFeatureBreadth_requiredScenarios_folderTimesNWalletSlots_testRailExcluded',
          e2eFeatureBreadth,
          requiredScenarios,
          featureFolderWalletSlotAssumption,
          regressionAdjustedCoveragePercentIos,
          regressionAdjustedCoveragePercentIosBasis:
            regressionAdjustedCoveragePercentBasis('ios', testrail),
          regressionStableFeatureCountIos,
          regressionFailedFeatureCountIos,
          regressionFailedFeatureNamesIos,
          regressionAdjustedCoveragePercentAndroid,
          regressionAdjustedCoveragePercentAndroidBasis:
            regressionAdjustedCoveragePercentBasis('android', testrail),
          regressionStableFeatureCountAndroid,
          regressionFailedFeatureCountAndroid,
          regressionFailedFeatureNamesAndroid,
          testrail,
          featuresTotal: featureNames.length,
          featuresWithMapping: featuresWithSignals.length,
          featuresExcludedFromMetrics: excludedFeatureList,
          featuresWithMappingInScope: featuresWithSignalsInScope.length,
          featuresTouchedBySpecPath: coveredBySpec,
          featureSpecPathCoveragePercent: specPct,
          featuresWithDeclaredTestIdsReferencedInSpec: coveredByTestId,
          featureTestIdInSpecCoveragePercent: testIdPct,
          featuresTouchedBySpecOrTestIdInSpec: coveredEither,
          featureCombinedCoveragePercent: eitherPct,
          modalsTotal: modals.length,
          modalsInScopeForMetrics: modalsInScope.length,
          modalsTouchedByE2ePath: coveredModalsPath,
          modalPathCoveragePercent: modalPctPath,
          modalsTouchedByPathOrLinkedFeature: coveredModalsEither,
          modalCoveragePercentPathOrLinkedFeature: modalPctEither
        },
        features: featureNames.map(f => {
          const s = featureStats[f]
          const {
            testIdsDeclaredList,
            testIdsReferencedList,
            testIdsUnreferencedList,
            ...rest
          } = s
          const iosFail = regressionFailedFeatureNamesIos.includes(f)
          const androidFail = regressionFailedFeatureNamesAndroid.includes(f)
          return {
            name: f,
            ...rest,
            hasMapping: Boolean(FEATURE_SIGNALS[f]),
            excludedFromCoverageMetrics: excludedFromCoverageMetrics(f),
            coverageMark: featureCoverageMark(f, featureStats),
            coveredBySpecPath: s.tests.length > 0,
            coveredByTestIdInSpec:
              s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0,
            coveredBySpecOrTestIdInSpec:
              s.tests.length > 0 ||
              (s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0),
            iosRegressionMappedFailure: iosFail,
            androidRegressionMappedFailure: androidFail,
            testIdsDeclaredList,
            testIdsReferencedList,
            testIdsUnreferencedList
          }
        }),
        tests: testToFeatures,
        modals: modalCoverage.map(m => ({
          ...m,
          inCoverageMetricsScope: modalInCoverageMetricsScope(m)
        }))
      },
      null,
      2
    )
  )
}

function featureListSortKey(a, b, featureStats) {
  const markA = featureCoverageMark(a, featureStats)
  const markB = featureCoverageMark(b, featureStats)
  const listTier = m => {
    if (m === 'O') return 0
    if (m === 'X') return 1
    return 2
  }
  const byTier = listTier(markA) - listTier(markB)
  if (byTier !== 0) return byTier
  if (markA === 'O') return a.localeCompare(b)
  const ca = featureStats[a].components
  const cb = featureStats[b].components
  if (cb !== ca) return cb - ca
  const ta = featureStats[a].testIdsDeclared
  const tb = featureStats[b].testIdsDeclared
  if (tb !== ta) return tb - ta
  return a.localeCompare(b)
}

/**
 * @param {object} ctx
 */
function printTextReportHeader(ctx) {
  const {
    appiumSpecsReadable,
    excludedFeatureList,
    totalCoveragePercent,
    coveredEither,
    featuresWithSignalsInScope,
    testIdLiteralInSpecPct,
    totalReferencedTestIdsInSpec,
    totalDeclaredTestIds,
    coveredBySpec,
    specPct,
    coveredByTestId,
    testIdPct,
    featuresWithSignals,
    coveredModalsPath,
    modalsInScope,
    modalPctPath,
    coveredModalsEither,
    modalPctEither,
    modals,
    modalsOmittedCount,
    testFiles,
    codebaseCompositeCoverage,
    e2eFeatureBreadth,
    requiredScenarios,
    featureFolderWalletSlotAssumption
  } = ctx

  console.log('Appium e2e ↔ feature coverage (heuristic, not line coverage)')
  console.log('Package:', pkgRoot)
  console.log(`Features: app/new/features/<folder> → ${featuresDir}`)
  console.log('Specs:   e2e-appium/ only (e2e/ Detox excluded)')
  console.log(
    'testIDs: all feature .tsx (excl. *.test.tsx); matched in *.spec.ts only (not pages/locators)'
  )
  console.log(
    `Excluded from metrics (△): ${excludedFeatureList.join(', ')} (${
      excludedFeatureList.length
    } folders)`
  )
  console.log(
    '  → Percent denominators omit △ folders. Total % = checklist O rate for in-scope mapped features (spec path OR testID in *.spec.ts).'
  )
  console.log('')
  console.log(
    `Codebase composite (headline model): ${codebaseCompositeCoverage.percent}% (±${codebaseCompositeCoverage.impliedUncertaintyPercentagePoints} pp model uncertainty) — ${codebaseCompositeCoverage.configPath}`
  )
  console.log(
    `  components: breadth ${e2eFeatureBreadth.percent}% (${e2eFeatureBreadth.featureAreasMatchedByAtLeastOneSpec}/${e2eFeatureBreadth.totalAppFeatureAreas} in-scope folders from spec stem/describe/titles) · required scenarios ${requiredScenarios.percent}% (${requiredScenarios.implementedCount}/${requiredScenarios.totalRequired} flow×wallet cells per ${requiredScenarios.configPath}) · wallet×folder slots ${featureFolderWalletSlotAssumption.percent}% (${featureFolderWalletSlotAssumption.filledSlotsCredited}/${featureFolderWalletSlotAssumption.totalSlots})`
  )
  console.log('')
  console.log(
    `Checklist total:   ${totalCoveragePercent}%  (${coveredEither}/${featuresWithSignalsInScope.length} in-scope mapped features — spec path match OR ≥1 feature testID in a *.spec.ts)`
  )
  if (testIdLiteralInSpecPct !== null) {
    console.log(
      `Supplemental:      testID strings in *.spec.ts only: ${testIdLiteralInSpecPct}% (${totalReferencedTestIdsInSpec}/${totalDeclaredTestIds} IDs on in-scope .tsx — often low if IDs live in pages/locators)`
    )
  } else {
    console.log(
      'Supplemental:      no testIDs declared on in-scope feature .tsx (testID literal % N/A)'
    )
  }
  console.log(
    `Breakdown (same denominator): ${coveredBySpec}/${featuresWithSignalsInScope.length} spec-path only (${specPct}%)`
  )
  console.log(
    `                              ${coveredByTestId}/${featuresWithSignalsInScope.length} ≥1 feature testID in a *.spec.ts (${testIdPct}%)`
  )
  console.log(
    `Mapping scope:     ${
      featuresWithSignals.length
    } folders with FEATURE_SIGNALS; ${
      featuresWithSignals.length - featuresWithSignalsInScope.length
    } of those excluded (△)`
  )
  console.log(
    `Modals (in scope): ${coveredModalsPath}/${modalsInScope.length} path/filename match (${modalPctPath}%)`
  )
  console.log(
    `                   ${coveredModalsEither}/${modalsInScope.length} path match OR linked feature (spec OR testID) (${modalPctEither}%)`
  )
  console.log(
    `                   (${modals.length} modal routes; ${modalsOmittedCount} omitted — no path hit and linked feature excluded from metrics)`
  )
  console.log(
    (() => {
      const skipped = testFiles.length - appiumSpecsReadable
      const base = `Appium: ${appiumSpecsReadable} spec file(s) read for paths + testID text`
      return skipped > 0
        ? `${base} (${skipped} path(s) under e2e-appium unreadable — skipped from content metrics; see warning above)`
        : base
    })()
  )
  printTestrailRegressionSummary(ctx)
  console.log('')
}

function printTestrailPlatformBlock(tr, label, rAdj, rStable, nScope) {
  if (tr?.enabled && tr?.staleRun) {
    console.log('')
    console.log(
      `Regression-adjusted (${label}): N/A — latest matching run is older than ${REGRESSION_RUN_MAX_AGE_DAYS} day(s) (“${tr.runName}”).`
    )
    console.log(
      `TestRail ${label} (reference): id ${tr.runId} — not used for regression-adjusted % or checklist ${label} fail markers (stale).`
    )
    return
  }
  if (tr?.enabled) {
    console.log('')
    console.log(
      `Regression-adjusted (${label}): ${rAdj}%  (${rStable}/${nScope} in-scope mapped features — heuristic O and no failing mapped ${label} regression test)`
    )
    console.log(
      `TestRail ${label} run:   "${tr.runName}" (id ${
        tr.runId
      }) — mapped results: ${tr.mappedPassed} pass, ${tr.mappedFailed} fail / ${
        tr.mappedTestsInRun
      } (${tr.mappedPassPercent ?? 'n/a'}% pass); ${
        tr.unmappedTestResults
      } unmapped rows (${tr.unmappedFailedTestResults} failed)`
    )
    if (tr.failedSpecRelPaths?.length) {
      console.log(
        `  Failing specs (${label}, maintenance / UI drift): ${tr.failedSpecRelPaths.join(
          ', '
        )}`
      )
    }
    return
  }
  if (tr?.skipReason) {
    console.log('')
    console.log(
      `TestRail ${label}: skipped (${tr.skipReason}). Regression-adjusted (${label}) % equals heuristic total when skipped.`
    )
  }
}

function printTestrailRegressionSummary(ctx) {
  const {
    testrail,
    regressionAdjustedCoveragePercentIos: rAdjIos,
    regressionStableFeatureCountIos: rStableIos,
    regressionAdjustedCoveragePercentAndroid: rAdjAnd,
    regressionStableFeatureCountAndroid: rStableAnd,
    featuresWithSignalsInScope
  } = ctx
  const n = featuresWithSignalsInScope.length
  printTestrailPlatformBlock(testrail?.ios, 'iOS', rAdjIos, rStableIos, n)
  printTestrailPlatformBlock(
    testrail?.android,
    'Android',
    rAdjAnd,
    rStableAnd,
    n
  )
}

function printMappedFeatureGaps(featuresWithSignalsInScope, featureStats) {
  console.log(
    'Mapped features with neither spec path nor testID string in any spec:'
  )
  for (const f of featuresWithSignalsInScope) {
    const s = featureStats[f]
    const spec = s.tests.length > 0
    const tid = s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
    if (!spec && !tid) {
      const { components, screens, testIdsDeclared } = s
      console.log(
        `  - ${f} (${screens} screen-like .tsx, ${components} .tsx; ${testIdsDeclared} testIDs in feature .tsx)`
      )
    }
  }
  console.log('')
}

function printUnmappedFeatureSignalGaps(featureNames, featureStats) {
  const unmappedFeatures = featureNames.filter(f => !FEATURE_SIGNALS[f])
  if (unmappedFeatures.length === 0) return
  console.log('Unmapped feature folders (add signals in script if needed):')
  for (const f of unmappedFeatures) {
    const { components, screens } = featureStats[f]
    console.log(`  - ${f} (${screens} screen-like, ${components} .tsx)`)
  }
  console.log('')
}

/**
 * @param {object} ctx
 */
function printTextReportBody(ctx) {
  const {
    featureNames,
    featureStats,
    featuresWithSignalsInScope,
    modalCoverage,
    verbose,
    regressionFailedFeaturesIos,
    regressionFailedFeaturesAndroid,
    testrail
  } = ctx

  console.log(
    'All app/new/features folders (order: O A–Z, then all X by .tsx count ↓, then all △ by .tsx count ↓):'
  )
  console.log(
    '  O  = spec path heuristic match OR any declared testID from that feature appears in a *.spec.ts'
  )
  console.log(
    '  X  = in-scope gap: add/extend Appium specs (or FEATURE_SIGNALS / testIDs)'
  )
  console.log(
    '  △  = excluded from metrics (see E2E_COVERAGE_EXCLUDED_FEATURES)'
  )
  console.log(
    '  columns after O/X/△: * = iOS regression failure, # = Android regression failure (mapped spec or testIDs in that spec)'
  )
  console.log('')
  const nameColWidth = Math.max(...featureNames.map(n => n.length), 1)
  const regIos =
    regressionFailedFeaturesIos instanceof Set
      ? regressionFailedFeaturesIos
      : new Set(regressionFailedFeaturesIos || [])
  const regAnd =
    regressionFailedFeaturesAndroid instanceof Set
      ? regressionFailedFeaturesAndroid
      : new Set(regressionFailedFeaturesAndroid || [])
  const sortedFeatureNamesForList = [...featureNames].sort((a, b) =>
    featureListSortKey(a, b, featureStats)
  )
  for (const f of sortedFeatureNamesForList) {
    const mark = featureCoverageMark(f, featureStats)
    const unmapped = !FEATURE_SIGNALS[f]
      ? '  [no FEATURE_SIGNALS in script]'
      : ''
    const iMark = regIos.has(f) ? '*' : ' '
    const aMark = regAnd.has(f) ? '#' : ' '
    console.log(`${mark}${iMark}${aMark} ${f.padEnd(nameColWidth)}${unmapped}`)
  }
  console.log('')

  printMappedFeatureGaps(featuresWithSignalsInScope, featureStats)
  printUnmappedFeatureSignalGaps(featureNames, featureStats)

  if (verbose) {
    printVerboseReport({
      featureNames,
      featureStats,
      modalCoverage,
      testrail
    })
  } else {
    console.log(
      'Run with --verbose for per-feature spec lists and unmatched modals.'
    )
  }
}

/**
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function printVerboseSpecMatches(featureNames, featureStats) {
  console.log('Per-feature matching specs:')
  for (const f of featureNames) {
    if (!FEATURE_SIGNALS[f]) continue
    const tests = featureStats[f].tests
    const ex = excludedFromCoverageMetrics(f) ? ' [excluded from metrics]' : ''
    console.log(`\n${f} (${tests.length})${ex}:`)
    for (const t of [...new Set(tests)].sort()) {
      console.log(`  ${t}`)
    }
  }
}

/**
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function printVerboseTestIdGaps(featureNames, featureStats) {
  console.log(
    '\nPer-feature testIDs (declared in feature .tsx vs found in *.spec.ts only):'
  )
  for (const f of featureNames) {
    const s = featureStats[f]
    if (s.testIdsDeclared === 0) continue
    console.log(
      `\n${f}: ${s.testIdsReferencedInSpec}/${s.testIdsDeclared} referenced (${s.testIdReferencePercent}%)`
    )
    const show = s.testIdsUnreferencedList.slice(0, 15)
    if (show.length === 0) continue
    console.log('  not seen in any spec (sample):')
    for (const id of show) console.log(`    ${id}`)
    if (s.testIdsUnreferencedList.length > show.length) {
      console.log(
        `    … +${s.testIdsUnreferencedList.length - show.length} more`
      )
    }
  }
}

/** @param {object[]} modalCoverage */
function printVerboseUncoveredModals(modalCoverage) {
  console.log(
    '\nModals (in scope) with no path match AND no linked-feature (spec OR testID):'
  )
  for (const m of modalCoverage) {
    if (!modalInCoverageMetricsScope(m) || m.covered) continue
    console.log(`  - ${m.modal}`)
  }
}

/**
 * @param {{ ios?: object, android?: object } | undefined} testrail
 */
function printVerboseTestrailFailures(testrail) {
  for (const [label, key] of [
    ['iOS', 'ios'],
    ['Android', 'android']
  ]) {
    const tr = testrail?.[key]
    if (!tr?.enabled || !tr.failedSpecRelPaths?.length) continue
    console.log(
      `\nTestRail ${label} — specs with failing results in mapped run:`
    )
    for (const p of tr.failedSpecRelPaths) console.log(`  ${p}`)
  }
}

function printVerboseReport(ctx) {
  const { featureNames, featureStats, modalCoverage, testrail } = ctx
  printVerboseSpecMatches(featureNames, featureStats)
  printVerboseTestIdGaps(featureNames, featureStats)
  printVerboseUncoveredModals(modalCoverage)
  printVerboseTestrailFailures(testrail)
}

/**
 * @param {string} reason Human-readable reason TestRail was not applied
 */
function emptyTestrailSkip(reason) {
  return { enabled: false, skipReason: reason }
}

async function loadTestrailRegressionSummary(
  specEntries,
  featureNames,
  featureStats
) {
  const noKey = emptyTestrailSkip('TESTRAIL_API_KEY not set')
  const empty = {
    testrailIos: noKey,
    testrailAndroid: noKey,
    regressionFailedFeaturesIos: new Set(),
    regressionFailedFeaturesAndroid: new Set()
  }

  if (process.argv.includes('--no-testrail')) {
    const skip = emptyTestrailSkip('--no-testrail')
    return {
      testrailIos: skip,
      testrailAndroid: skip,
      regressionFailedFeaturesIos: new Set(),
      regressionFailedFeaturesAndroid: new Set()
    }
  }

  if (!process.env.TESTRAIL_API_KEY) {
    return empty
  }

  const client = createTestrailClient()
  if (!client) {
    const fail = emptyTestrailSkip('createTestrailClient failed')
    return {
      testrailIos: fail,
      testrailAndroid: fail,
      regressionFailedFeaturesIos: new Set(),
      regressionFailedFeaturesAndroid: new Set()
    }
  }

  try {
    const runs = await fetchAllProjectRuns(client)
    const suiteCaseToSpecRels = buildSuiteCaseToSpecRelMap(specEntries)
    /** Reuse `get_case` results between iOS and Android runs in one process. */
    const caseMetaByIdCache = new Map()
    const trIos = await fetchTestrailPlatformRegressionContext(
      client,
      suiteCaseToSpecRels,
      runs,
      'iOS',
      caseMetaByIdCache
    )
    const trAndroid = await fetchTestrailPlatformRegressionContext(
      client,
      suiteCaseToSpecRels,
      runs,
      'Android',
      caseMetaByIdCache
    )

    const regressionFailedFeaturesIos =
      trIos.ok && trIos.run && !trIos.staleRun
        ? computeRegressionFailedFeatures(
            trIos.failedSpecRels,
            featureNames,
            featureStats
          )
        : new Set()
    const regressionFailedFeaturesAndroid =
      trAndroid.ok && trAndroid.run && !trAndroid.staleRun
        ? computeRegressionFailedFeatures(
            trAndroid.failedSpecRels,
            featureNames,
            featureStats
          )
        : new Set()

    return {
      testrailIos: testrailUiSummaryFromFetch(trIos),
      testrailAndroid: testrailUiSummaryFromFetch(trAndroid),
      regressionFailedFeaturesIos,
      regressionFailedFeaturesAndroid
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const err = emptyTestrailSkip(msg)
    return {
      testrailIos: err,
      testrailAndroid: err,
      regressionFailedFeaturesIos: new Set(),
      regressionFailedFeaturesAndroid: new Set()
    }
  }
}

async function main() {
  const json = process.argv.includes('--json')
  const verbose = process.argv.includes('--verbose')

  const testFiles = loadAppiumSpecFiles()
  const specEntries = buildAppiumSpecEntries(testFiles)
  const { specLiteralSet, specCorpus, specLiteralList } =
    buildSpecLiteralsAndCorpusFromEntries(specEntries)
  const featureNames = readFeatureFolderNames()
  const featureStats = {}
  populateFeatureStats(
    featureNames,
    featureStats,
    specLiteralSet,
    specCorpus,
    specLiteralList
  )
  const testToFeatures = matchSpecsToFeatures(
    specEntries,
    featureNames,
    featureStats
  )

  const excludedFeatureList = [...E2E_COVERAGE_EXCLUDED_FEATURES].sort()
  const coverageBase = buildCoverageCounts(
    featureNames,
    featureStats,
    excludedFeatureList
  )
  const modals = readModalFolderNames()
  const modalCoverage = buildModalCoverage(
    modals,
    specEntries,
    featureNames,
    featureStats
  )
  const modalsInScope = modalCoverage.filter(modalInCoverageMetricsScope)
  const modalPercents = computeModalPercents(
    modalCoverage,
    modalsInScope,
    modals
  )

  const {
    testrailIos,
    testrailAndroid,
    regressionFailedFeaturesIos,
    regressionFailedFeaturesAndroid
  } = await loadTestrailRegressionSummary(
    specEntries,
    featureNames,
    featureStats
  )

  const regressionAdjIos = computeRegressionAdjustedMetrics(
    coverageBase.featuresWithSignalsInScope,
    featureStats,
    regressionFailedFeaturesIos
  )
  const regressionAdjAndroid = computeRegressionAdjustedMetrics(
    coverageBase.featuresWithSignalsInScope,
    featureStats,
    regressionFailedFeaturesAndroid
  )

  const iosAdj = pickRegressionAdjustedCounts(testrailIos, regressionAdjIos)
  const androidAdj = pickRegressionAdjustedCounts(
    testrailAndroid,
    regressionAdjAndroid
  )

  const foldersInBreadthScope = featureNames.filter(
    f => !excludedFromCoverageMetrics(f)
  )
  const coverageModelCfg = loadCoverageModelConfig()
  const requiredScenariosCfg = loadRequiredScenariosConfig()
  const e2eFeatureBreadth = computeE2eFeatureBreadth(
    specEntries,
    foldersInBreadthScope
  )
  const requiredScenarioMatrix = computeRequiredScenarioMatrixMobile(
    specEntries,
    requiredScenariosCfg
  )
  /** Slot denominator = in-scope folders × wallet modes in required-scenarios config. */
  const walletModesAssumedForSlots = Math.max(
    1,
    requiredScenariosCfg.walletModes.length
  )
  const featureWalletSlotsTotal =
    e2eFeatureBreadth.totalAppFeatureAreas * walletModesAssumedForSlots
  const featureWalletSlotPercent =
    featureWalletSlotsTotal === 0
      ? 0
      : Math.round(
          (10000 * e2eFeatureBreadth.featureAreasMatchedByAtLeastOneSpec) /
            featureWalletSlotsTotal
        ) / 100
  const codebaseCompositePercent = computeCodebaseCompositePercent(
    e2eFeatureBreadth.percent,
    requiredScenarioMatrix.percent,
    featureWalletSlotPercent,
    coverageModelCfg
  )

  const counts = {
    ...coverageBase,
    ...modalPercents,
    regressionAdjustedCoveragePercentIos:
      iosAdj.regressionAdjustedCoveragePercent,
    regressionStableFeatureCountIos: iosAdj.regressionStableFeatureCount,
    regressionFailedFeatureCountIos: iosAdj.regressionFailedFeatureCount,
    regressionAdjustedCoveragePercentAndroid:
      androidAdj.regressionAdjustedCoveragePercent,
    regressionStableFeatureCountAndroid:
      androidAdj.regressionStableFeatureCount,
    regressionFailedFeatureCountAndroid:
      androidAdj.regressionFailedFeatureCount,
    testrail: { ios: testrailIos, android: testrailAndroid },
    regressionFailedFeatureNamesIos: [...regressionFailedFeaturesIos].sort(),
    regressionFailedFeatureNamesAndroid: [
      ...regressionFailedFeaturesAndroid
    ].sort(),
    regressionFailedFeaturesIos,
    regressionFailedFeaturesAndroid,
    codebaseCompositeCoverage: {
      percent: codebaseCompositePercent,
      formula: 'weightedSum',
      weights: coverageModelCfg.weights,
      impliedUncertaintyPercentagePoints:
        coverageModelCfg.impliedUncertaintyPercentagePoints,
      definition:
        coverageModelCfg.definition ??
        'Weighted blend of breadth, required flow×wallet cells, and folder×N-wallet-slot assumption (codebase only; TestRail not included).',
      configPath: path.relative(
        pkgRoot,
        coverageModelCfg.configPath ??
          path.join(E2E_APPIUM_DIR, 'coverage-model.config.json')
      ),
      components: {
        e2eFeatureBreadthPercent: e2eFeatureBreadth.percent,
        requiredScenariosPercent: requiredScenarioMatrix.percent,
        featureFolderWalletSlotPercent: featureWalletSlotPercent
      }
    },
    e2eFeatureBreadth: {
      definition:
        'Share of in-scope app/new/features/* folders associated with at least one Appium *.spec.ts via file stem, outer describe title, or it/describe title tokens (min length 8 for title-only matches). Not based on FEATURE_SIGNALS or testID.',
      totalAppFeatureAreas: e2eFeatureBreadth.totalAppFeatureAreas,
      featureAreasMatchedByAtLeastOneSpec:
        e2eFeatureBreadth.featureAreasMatchedByAtLeastOneSpec,
      percent: e2eFeatureBreadth.percent,
      uncoveredFeatureAreas: e2eFeatureBreadth.uncoveredFeatureAreas
    },
    requiredScenarios: {
      definition:
        requiredScenariosCfg.definition ??
        'Flow × wallet matrix from required-scenarios.config.json (Ledger never used; add seedless to walletModes when that E2E exists).',
      configPath: path.relative(pkgRoot, requiredScenariosCfg.configPath),
      flows: requiredScenariosCfg.flows,
      walletModes: requiredScenariosCfg.walletModes,
      totalRequired: requiredScenarioMatrix.totalRequired,
      implementedCount: requiredScenarioMatrix.implementedCount,
      percent: requiredScenarioMatrix.percent,
      missing: requiredScenarioMatrix.missing,
      scenarios: requiredScenarioMatrix.scenarios
    },
    featureFolderWalletSlotAssumption: {
      definition:
        'Assumes each in-scope feature folder should be covered under N wallet modes (N = walletModes in required-scenarios.config.json); credits one slot per folder with any breadth match. Denominator = folders×N.',
      walletModesAssumed: walletModesAssumedForSlots,
      totalSlots: featureWalletSlotsTotal,
      filledSlotsCredited:
        e2eFeatureBreadth.featureAreasMatchedByAtLeastOneSpec,
      percent: featureWalletSlotPercent
    }
  }

  if (json) {
    printJsonReport({
      testFiles,
      appiumSpecsReadable: specEntries.length,
      featureNames,
      featureStats,
      testToFeatures,
      modalCoverage,
      modals,
      modalsInScope,
      counts
    })
    return
  }

  printTextReportHeader({
    ...counts,
    excludedFeatureList,
    testFiles,
    appiumSpecsReadable: specEntries.length,
    modals,
    modalsInScope
  })
  printTextReportBody({
    featureNames,
    featureStats,
    featuresWithSignalsInScope: counts.featuresWithSignalsInScope,
    modalCoverage,
    verbose,
    regressionFailedFeaturesIos: counts.regressionFailedFeaturesIos,
    regressionFailedFeaturesAndroid: counts.regressionFailedFeaturesAndroid,
    testrail: counts.testrail
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
