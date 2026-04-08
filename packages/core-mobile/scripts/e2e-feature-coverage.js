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
 * **TestRail (optional):** When `TESTRAIL_API_KEY` is set, the script loads the
 * latest **iOS** and **Android** runs whose names match
 * `[REGRESSION] iOS Test Run: YYYY-MM-DD` and `[REGRESSION] Android Test Run: YYYY-MM-DD`
 * (same naming as `e2e-appium/wdio.conf.ts` + `testrail/testrail.service.ts`).
 * Each run is mapped to local `*.spec.ts` files via TestRail section + case title
 * (Mocha `describe` / `it`). **Regression-adjusted coverage %** is computed
 * separately per platform: in-scope mapped features that are checklist-O *and*
 * have no mapped failing result from that platform’s regression run. If no
 * Android run exists yet, the Android row is skipped and adjusted Android %
 * equals the heuristic total. Use `--no-testrail` to skip network calls.
 *
 * Usage:
 *   node scripts/e2e-feature-coverage.js
 *   node scripts/e2e-feature-coverage.js --json
 *   node scripts/e2e-feature-coverage.js --verbose
 *   node scripts/e2e-feature-coverage.js --no-testrail
 *
 * Text output lists each `app/new/features/<name>` folder with O / X / △. JSON
 * includes per-feature detail and modals.
 */

const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const pkgRequire = createRequire(path.join(__dirname, '../package.json'))

const pkgRoot = path.resolve(__dirname, '..')
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

/** Mirrors `e2e-appium/testrail/testrail.config.ts` (API user is not secret). */
const TESTRAIL_DOMAIN =
  process.env.TESTRAIL_DOMAIN || 'https://avalabs.testrail.io'
const TESTRAIL_USERNAME =
  process.env.TESTRAIL_USERNAME || 'mobiledevs@avalabs.org'
const TESTRAIL_PROJECT_ID = Number(process.env.TESTRAIL_PROJECT_ID || 3)

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
 * @param {import('axios').AxiosInstance} client
 */
async function fetchAllProjectRuns(client) {
  const all = []
  let offset = 0
  const limit = 250
  for (;;) {
    const { data } = await client.get(`/get_runs/${TESTRAIL_PROJECT_ID}`, {
      params: { offset, limit }
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
 * @param {string} src
 */
function extractFirstDescribeTitle(src) {
  const m = src.match(/describe\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/)
  if (!m) return null
  return unescapeJsString(m[2])
}

/**
 * @param {string} src
 * @returns {string[]}
 */
function extractStaticItTitles(src) {
  const titles = []
  const re = /\bit\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g
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
 * @param {{ rel: string, abs: string }[]} testFiles
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

function buildSuiteCaseToSpecRelMap(testFiles) {
  /** @type {Map<string, Set<string>>} */
  const map = new Map()
  for (const { rel, abs } of testFiles) {
    let text = ''
    try {
      text = fs.readFileSync(abs, 'utf8')
    } catch {
      continue
    }
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

function createTestrailCaseResolver(client) {
  const caseMeta = new Map()
  const sectionNameById = new Map()

  return async function resolveCase(caseId) {
    if (caseMeta.has(caseId)) return caseMeta.get(caseId)
    const { data } = await client.get(`/get_case/${caseId}`)
    const caseTitle = (data.title || '').trim()
    const secId = data.section_id
    if (!sectionNameById.has(secId)) {
      const { data: sec } = await client.get(`/get_section/${secId}`)
      sectionNameById.set(secId, (sec.name || '').trim())
    }
    const sectionName = sectionNameById.get(secId) || ''
    const meta = { sectionName, caseTitle }
    caseMeta.set(caseId, meta)
    return meta
  }
}

/**
 * @param {(id: number) => Promise<{ sectionName: string, caseTitle: string }>} resolveCase
 * @param {{ unmappedCount: number, unmappedFailedCount: number, unmappedSamples: string[] }} acc
 */
async function tryResolveTestrailCaseMeta(resolveCase, caseId, sid, acc) {
  try {
    return await resolveCase(caseId)
  } catch {
    acc.unmappedCount += 1
    if (sid === TESTRAIL_STATUS_FAILED) acc.unmappedFailedCount += 1
    if (acc.unmappedSamples.length < 8) {
      acc.unmappedSamples.push(`(case ${caseId} API error)`)
    }
    return null
  }
}

/**
 * @param {object} t TestRail test row
 * @param {Map<string, string[]>} suiteCaseToSpecRels
 * @param {(id: number) => Promise<{ sectionName: string, caseTitle: string }>} resolveCase
 * @param {{ failedSet: Set<string>, mappedTotal: number, mappedPassed: number, mappedFailed: number, unmappedCount: number, unmappedFailedCount: number, unmappedSamples: string[] }} acc
 */
async function applyTestrailTestRow(t, suiteCaseToSpecRels, resolveCase, acc) {
  const sid = t.status_id
  const caseId = t.case_id
  const meta = await tryResolveTestrailCaseMeta(resolveCase, caseId, sid, acc)
  if (!meta) return

  const mapKey = `${meta.sectionName}\t${meta.caseTitle}`
  const rels = suiteCaseToSpecRels.get(mapKey)
  if (!rels || rels.length === 0) {
    acc.unmappedCount += 1
    if (sid === TESTRAIL_STATUS_FAILED) acc.unmappedFailedCount += 1
    if (acc.unmappedSamples.length < 12) acc.unmappedSamples.push(mapKey)
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
 */
async function fetchTestrailPlatformRegressionContext(
  client,
  suiteCaseToSpecRels,
  runs,
  platform
) {
  const run = pickLatestPlatformRegressionRun(runs, platform)
  if (!run) {
    return {
      ok: false,
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

  const tests = await fetchAllTestsForRun(client, run.id)
  const resolveCase = createTestrailCaseResolver(client)
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
    await applyTestrailTestRow(t, suiteCaseToSpecRels, resolveCase, acc)
  }

  const failedSpecRels = [...acc.failedSet].sort()
  const mappedPassPct =
    acc.mappedTotal === 0
      ? null
      : Math.round((100 * acc.mappedPassed) / acc.mappedTotal)

  return {
    ok: true,
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
 * @param {{ ok: boolean, error: string | null, run: object | null, failedSpecRels: string[], mappedTotal: number, mappedPassed: number, mappedFailed: number, mappedPassPct: number | null, unmappedCount: number, unmappedFailedCount: number, unmappedSamples: string[] }} tr
 */
function testrailUiSummaryFromFetch(tr) {
  if (tr.ok && tr.run) {
    return {
      enabled: true,
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
 * Features touched by failing regression tests (spec path heuristic or feature
 * testIDs referenced in the failed spec source).
 * @param {string[]} failedSpecRels
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
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
 * @param {{ rel: string, abs: string }[]} testFiles
 */
function buildSpecLiteralsAndCorpus(testFiles) {
  const specLiteralSet = new Set()
  const specCorpusParts = []
  for (const { abs } of testFiles) {
    let text
    try {
      text = fs.readFileSync(abs, 'utf8')
    } catch {
      continue
    }
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
 * @param {{ rel: string, abs: string }[]} testFiles
 * @param {string[]} featureNames
 * @param {Record<string, { tests: string[] }>} featureStats
 */
function matchSpecsToFeatures(testFiles, featureNames, featureStats) {
  const testToFeatures = []
  for (const { rel, abs } of testFiles) {
    const relLower = rel.toLowerCase()
    let content = ''
    try {
      content = fs.readFileSync(abs, 'utf8')
    } catch {
      content = ''
    }

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
 * @param {{ rel: string, abs: string }[]} testFiles
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function buildOneModalCoverage(m, testFiles, featureNames, featureStats) {
  const relHits = testFiles.filter(({ rel }) =>
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
 * @param {{ rel: string, abs: string }[]} testFiles
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function buildModalCoverage(modals, testFiles, featureNames, featureStats) {
  return modals.map(m =>
    buildOneModalCoverage(m, testFiles, featureNames, featureStats)
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
    regressionFailedFeatureNamesAndroid
  } = counts

  console.log(
    JSON.stringify(
      {
        summary: {
          e2eSource: 'e2e-appium',
          appiumSpecFiles: testFiles.length,
          testIdsDeclaredTotal: totalDeclaredTestIds,
          testIdsReferencedInSpecTotal: totalReferencedTestIdsInSpec,
          testIdLiteralCoverageInSpecPercent: testIdLiteralInSpecPct,
          totalCoveragePercent,
          totalCoveragePercentBasis:
            'inScopeMappedFeatures_union_specPathOrTestIdInSpec',
          regressionAdjustedCoveragePercentIos,
          regressionAdjustedCoveragePercentIosBasis:
            'inScopeMappedFeatures_heuristicO_and_noMappedIosRegressionFailure',
          regressionStableFeatureCountIos,
          regressionFailedFeatureCountIos,
          regressionFailedFeatureNamesIos,
          regressionAdjustedCoveragePercentAndroid,
          regressionAdjustedCoveragePercentAndroidBasis:
            'inScopeMappedFeatures_heuristicO_and_noMappedAndroidRegressionFailure',
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
    testFiles
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
    `Total coverage:    ${totalCoveragePercent}%  (${coveredEither}/${featuresWithSignalsInScope.length} in-scope mapped features — spec path match OR ≥1 feature testID in a *.spec.ts)`
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
    `Appium: ${testFiles.length} spec files scanned for paths + testID text`
  )
  printTestrailRegressionSummary(ctx)
  console.log('')
}

function printTestrailPlatformBlock(tr, label, rAdj, rStable, nScope) {
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
 * @param {{ rel: string, abs: string }[]} testFiles
 * @param {string[]} featureNames
 * @param {Record<string, object>} featureStats
 */
function emptyTestrailSkip(reason) {
  return { enabled: false, skipReason: reason }
}

async function loadTestrailRegressionSummary(
  testFiles,
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
    const suiteCaseToSpecRels = buildSuiteCaseToSpecRelMap(testFiles)
    const trIos = await fetchTestrailPlatformRegressionContext(
      client,
      suiteCaseToSpecRels,
      runs,
      'iOS'
    )
    const trAndroid = await fetchTestrailPlatformRegressionContext(
      client,
      suiteCaseToSpecRels,
      runs,
      'Android'
    )

    const regressionFailedFeaturesIos =
      trIos.ok && trIos.run
        ? computeRegressionFailedFeatures(
            trIos.failedSpecRels,
            featureNames,
            featureStats
          )
        : new Set()
    const regressionFailedFeaturesAndroid =
      trAndroid.ok && trAndroid.run
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
  const { specLiteralSet, specCorpus, specLiteralList } =
    buildSpecLiteralsAndCorpus(testFiles)
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
    testFiles,
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
    testFiles,
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
  } = await loadTestrailRegressionSummary(testFiles, featureNames, featureStats)

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

  const counts = {
    ...coverageBase,
    ...modalPercents,
    regressionAdjustedCoveragePercentIos:
      regressionAdjIos.regressionAdjustedCoveragePercent,
    regressionStableFeatureCountIos:
      regressionAdjIos.regressionStableFeatureCount,
    regressionFailedFeatureCountIos:
      regressionAdjIos.regressionFailedFeatureCount,
    regressionAdjustedCoveragePercentAndroid:
      regressionAdjAndroid.regressionAdjustedCoveragePercent,
    regressionStableFeatureCountAndroid:
      regressionAdjAndroid.regressionStableFeatureCount,
    regressionFailedFeatureCountAndroid:
      regressionAdjAndroid.regressionFailedFeatureCount,
    testrail: { ios: testrailIos, android: testrailAndroid },
    regressionFailedFeatureNamesIos: [...regressionFailedFeaturesIos].sort(),
    regressionFailedFeatureNamesAndroid: [
      ...regressionFailedFeaturesAndroid
    ].sort(),
    regressionFailedFeaturesIos,
    regressionFailedFeaturesAndroid
  }

  if (json) {
    printJsonReport({
      testFiles,
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
