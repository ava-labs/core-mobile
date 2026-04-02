#!/usr/bin/env node
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
 * Usage:
 *   node scripts/e2e-feature-coverage.js
 *   node scripts/e2e-feature-coverage.js --json
 *   node scripts/e2e-feature-coverage.js --verbose
 *
 * Text output lists each `app/new/features/<name>` folder with O / X / △. JSON
 * includes per-feature detail and modals.
 */

const fs = require('fs')
const path = require('path')

const pkgRoot = path.resolve(__dirname, '..')
const featuresDir = path.join(pkgRoot, 'app/new/features')
const modalsDir = path.join(
  pkgRoot,
  'app/new/routes/(signedIn)/(modals)'
)

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

/**
 * @param {string} dir
 * @param {(rel: string) => boolean} ignore
 * @param {string[]} exts
 * @returns {string[]} relative posix paths from pkgRoot
 */
function walkTests(dir, ignore, exts) {
  const out = []
  if (!fs.existsSync(dir)) return out

  function walk(abs, rel) {
    let stat
    try {
      stat = fs.statSync(abs)
    } catch {
      return
    }
    if (stat.isDirectory()) {
      const base = path.basename(abs)
      if (ignore(rel, base)) return
      for (const name of fs.readdirSync(abs)) {
        walk(path.join(abs, name), rel ? `${rel}/${name}` : name)
      }
      return
    }
    if (!exts.some(ext => abs.endsWith(ext))) return
    out.push(rel.split(path.sep).join('/'))
  }

  walk(dir, '')
  return out.sort()
}

/**
 * Extract static testID strings from TSX (and dynamic template prefixes).
 * @param {string} content
 * @returns {Set<string>}
 */
function extractTestIdsFromTsx(content) {
  const ids = new Set()

  const add = s => {
    if (!s || typeof s !== 'string') return
    const t = s.trim()
    if (t.length === 0 || t.length > 200) return
    if (t === 'string' || t === 'boolean' || t === 'undefined') return
    ids.add(t)
  }

  for (const m of content.matchAll(/testID\s*=\s*"([^"]+)"/g)) add(m[1])
  for (const m of content.matchAll(/testID\s*=\s*'([^']+)'/g)) add(m[1])
  for (const m of content.matchAll(/testID\s*=\s*\{\s*["']([^'"]+)["']\s*\}/g)) {
    add(m[1])
  }

  for (const m of content.matchAll(/testID\s*=\s*\{\s*`([^`]+)`\s*\}/g)) {
    const raw = m[1].replace(/\\`/g, '`')
    if (!raw.includes('${')) {
      add(raw)
    } else {
      const pre = raw.split('${')[0]
      if (pre.length >= 3) add(pre)
    }
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
    if (base.includes('Screen') || abs.includes(`${path.sep}screens${path.sep}`)) {
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
  if (sig.pathSubstrings) {
    for (const s of sig.pathSubstrings) {
      if (relTestPath.includes(s.toLowerCase())) return true
    }
  }
  if (sig.content && content && sig.content.test(content)) return true
  return false
}

/**
 * @param {string} modalName
 * @param {string} relLower
 */
function modalMatchesTest(modalName, relLower) {
  if (modalName === 'notifications' && relLower.includes('notification')) {
    return true
  }
  const compact = modalName.toLowerCase()
  if (relLower.includes(compact)) return true
  const slug = modalName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
  const squashed = slug.replace(/_/g, '')
  if (squashed.length >= 4 && relLower.includes(squashed)) return true
  return false
}

/**
 * @param {string} modalName
 * @param {string[]} featureNames
 */
function modalLinkedFeature(modalName, featureNames) {
  if (MODAL_FEATURE_LINK[modalName]) return MODAL_FEATURE_LINK[modalName]
  if (featureNames.includes(modalName)) return modalName
  return null
}

function main() {
  const json = process.argv.includes('--json')
  const verbose = process.argv.includes('--verbose')

  const ignoreAppium = (rel, base) => base === 'node_modules'

  const testFiles = walkTests(
    E2E_APPIUM_DIR,
    ignoreAppium,
    ['.spec.ts']
  ).map(rel => ({
    rel,
    abs: path.join(E2E_APPIUM_DIR, ...rel.split('/'))
  }))

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
  const specCorpus = specCorpusParts.join('\n')
  const specLiteralList = [...specLiteralSet]

  const featureNames = fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()

  const featureStats = {}
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

  const featuresWithSignals = featureNames.filter(f => FEATURE_SIGNALS[f])
  const excludedFeatureList = [...E2E_COVERAGE_EXCLUDED_FEATURES].sort()
  const featuresWithSignalsInScope = featuresWithSignals.filter(
    f => !excludedFromCoverageMetrics(f)
  )

  const coveredBySpec = featuresWithSignalsInScope.filter(
    f => featureStats[f].tests.length > 0
  ).length
  const specPct =
    featuresWithSignalsInScope.length === 0
      ? 0
      : Math.round((100 * coveredBySpec) / featuresWithSignalsInScope.length)

  const coveredByTestId = featuresWithSignalsInScope.filter(f => {
    const s = featureStats[f]
    return s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
  }).length
  const testIdPct =
    featuresWithSignalsInScope.length === 0
      ? 0
      : Math.round((100 * coveredByTestId) / featuresWithSignalsInScope.length)

  const coveredEither = featuresWithSignalsInScope.filter(f => {
    const s = featureStats[f]
    const spec = s.tests.length > 0
    const tid =
      s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
    return spec || tid
  }).length
  const eitherPct =
    featuresWithSignalsInScope.length === 0
      ? 0
      : Math.round((100 * coveredEither) / featuresWithSignalsInScope.length)

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
      : Math.round(
          (100 * totalReferencedTestIdsInSpec) / totalDeclaredTestIds
        )
  const totalCoveragePercent = eitherPct

  let modals = []
  if (fs.existsSync(modalsDir)) {
    modals = fs
      .readdirSync(modalsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
  }

  const modalCoverage = modals.map(m => {
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
  })

  const modalsInScope = modalCoverage.filter(modalInCoverageMetricsScope)
  const coveredModalsPath = modalsInScope.filter(m => m.coveredByPath).length
  const coveredModalsEither = modalsInScope.filter(m => m.covered).length
  const modalPctPath =
    modalsInScope.length === 0
      ? 0
      : Math.round((100 * coveredModalsPath) / modalsInScope.length)
  const modalPctEither =
    modalsInScope.length === 0
      ? 0
      : Math.round((100 * coveredModalsEither) / modalsInScope.length)

  if (json) {
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
    return
  }

  console.log('Appium e2e ↔ feature coverage (heuristic, not line coverage)')
  console.log('Package:', pkgRoot)
  console.log(`Features: app/new/features/<folder> → ${featuresDir}`)
  console.log('Specs:   e2e-appium/ only (e2e/ Detox excluded)')
  console.log('testIDs: all feature .tsx (excl. *.test.tsx); matched in *.spec.ts only (not pages/locators)')
  console.log(
    `Excluded from metrics (△): ${excludedFeatureList.join(', ')} (${excludedFeatureList.length} folders)`
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
    `Mapping scope:     ${featuresWithSignals.length} folders with FEATURE_SIGNALS; ${featuresWithSignals.length - featuresWithSignalsInScope.length} of those excluded (△)`
  )
  console.log(
    `Modals (in scope): ${coveredModalsPath}/${modalsInScope.length} path/filename match (${modalPctPath}%)`
  )
  console.log(
    `                   ${coveredModalsEither}/${modalsInScope.length} path match OR linked feature (spec OR testID) (${modalPctEither}%)`
  )
  console.log(
    `                   (${modals.length} modal routes; ${modals.length - modalsInScope.length} omitted — no path hit and linked feature excluded from metrics)`
  )
  console.log(
    `Appium: ${testFiles.length} spec files scanned for paths + testID text`
  )
  console.log('')

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
  console.log('')
  const nameColWidth = Math.max(...featureNames.map(n => n.length), 1)
  const sortedFeatureNamesForList = [...featureNames].sort((a, b) => {
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
  })
  for (const f of sortedFeatureNamesForList) {
    const mark = featureCoverageMark(f, featureStats)
    const unmapped = !FEATURE_SIGNALS[f] ? '  [no FEATURE_SIGNALS in script]' : ''
    console.log(`${mark}  ${f.padEnd(nameColWidth)}${unmapped}`)
  }
  console.log('')

  console.log(
    'Mapped features with neither spec path nor testID string in any spec:'
  )
  for (const f of featuresWithSignalsInScope) {
    const s = featureStats[f]
    const spec = s.tests.length > 0
    const tid =
      s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
    if (!spec && !tid) {
      const { components, screens, testIdsDeclared } = s
      console.log(
        `  - ${f} (${screens} screen-like .tsx, ${components} .tsx; ${testIdsDeclared} testIDs in feature .tsx)`
      )
    }
  }
  console.log('')

  const unmappedFeatures = featureNames.filter(f => !FEATURE_SIGNALS[f])
  if (unmappedFeatures.length > 0) {
    console.log('Unmapped feature folders (add signals in script if needed):')
    for (const f of unmappedFeatures) {
      const { components, screens } = featureStats[f]
      console.log(`  - ${f} (${screens} screen-like, ${components} .tsx)`)
    }
    console.log('')
  }

  if (verbose) {
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
      if (show.length > 0) {
        console.log('  not seen in any spec (sample):')
        for (const id of show) console.log(`    ${id}`)
        if (s.testIdsUnreferencedList.length > show.length) {
          console.log(
            `    … +${s.testIdsUnreferencedList.length - show.length} more`
          )
        }
      }
    }
    console.log(
      '\nModals (in scope) with no path match AND no linked-feature (spec OR testID):'
    )
    for (const m of modalCoverage) {
      if (!modalInCoverageMetricsScope(m) || m.covered) continue
      console.log(`  - ${m.modal}`)
    }
  } else {
    console.log('Run with --verbose for per-feature spec lists and unmatched modals.')
  }
}

main()
