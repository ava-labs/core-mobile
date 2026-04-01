#!/usr/bin/env node
/**
 * Estimates Appium/WebdriverIO e2e "coverage" of app features by correlating
 * spec paths under e2e-appium/ (and light content hints) with feature folders
 * under app/new/features and modal routes. Deprecated Detox tests in e2e/ are
 * intentionally excluded. This is not line coverage — it highlights gaps
 * between product surface and automated Appium specs.
 *
 * Also scans `testID={...}` values under each feature’s `.tsx` files and checks
 * whether those strings (or dynamic prefixes before `${`) appear in
 * `e2e-appium` `*.spec.ts` files only (not page objects or locators). A feature
 * counts as covered if either a spec path matches OR at least one declared
 * testID string appears in a spec file.
 *
 * **Total coverage %** (summary): average of (1) % of mapped features with a
 * matching spec path and (2) % of all declared testIDs (across features) that
 * appear in spec files. If the app declares no testIDs, (2) is skipped and the
 * total equals the spec-path % only.
 *
 * Usage:
 *   node scripts/e2e-feature-coverage.js
 *   node scripts/e2e-feature-coverage.js --json
 *   node scripts/e2e-feature-coverage.js --verbose
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
  approval: {
    pathSubstrings: ['approval'],
    content: /\b(approval|signMessage|signTransaction)\b/i
  },
  bridge: { pathSubstrings: ['bridge'] },
  browser: {
    pathSubstrings: ['browser'],
    content: /\b(browserTab|browser_tab|webview)\b/i
  },
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
  meld: { pathSubstrings: ['meld'] },
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
    content: /\b(trackTab|track_tab|tapTrack)\b/i
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
  const coveredBySpec = featuresWithSignals.filter(
    f => featureStats[f].tests.length > 0
  ).length
  const specPct =
    featuresWithSignals.length === 0
      ? 0
      : Math.round((100 * coveredBySpec) / featuresWithSignals.length)

  const coveredByTestId = featuresWithSignals.filter(f => {
    const s = featureStats[f]
    return s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
  }).length
  const testIdPct =
    featuresWithSignals.length === 0
      ? 0
      : Math.round((100 * coveredByTestId) / featuresWithSignals.length)

  const coveredEither = featuresWithSignals.filter(f => {
    const s = featureStats[f]
    const spec = s.tests.length > 0
    const tid =
      s.testIdsDeclared > 0 && s.testIdsReferencedInSpec > 0
    return spec || tid
  }).length
  const eitherPct =
    featuresWithSignals.length === 0
      ? 0
      : Math.round((100 * coveredEither) / featuresWithSignals.length)

  let totalDeclaredTestIds = 0
  let totalReferencedTestIdsInSpec = 0
  for (const f of featureNames) {
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
  const totalCoveragePercent =
    testIdLiteralInSpecPct === null
      ? specPct
      : Math.round((specPct + testIdLiteralInSpecPct) / 2)

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

  const coveredModalsPath = modalCoverage.filter(m => m.coveredByPath).length
  const coveredModalsEither = modalCoverage.filter(m => m.covered).length
  const modalPctPath =
    modals.length === 0
      ? 0
      : Math.round((100 * coveredModalsPath) / modals.length)
  const modalPctEither =
    modals.length === 0
      ? 0
      : Math.round((100 * coveredModalsEither) / modals.length)

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
            featuresTotal: featureNames.length,
            featuresWithMapping: featuresWithSignals.length,
            featuresTouchedBySpecPath: coveredBySpec,
            featureSpecPathCoveragePercent: specPct,
            featuresWithDeclaredTestIdsReferencedInSpec: coveredByTestId,
            featureTestIdInSpecCoveragePercent: testIdPct,
            featuresTouchedBySpecOrTestIdInSpec: coveredEither,
            featureCombinedCoveragePercent: eitherPct,
            modalsTotal: modals.length,
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
          modals: modalCoverage
        },
        null,
        2
      )
    )
    return
  }

  console.log('Appium e2e ↔ feature coverage (heuristic, not line coverage)')
  console.log('Package:', pkgRoot)
  console.log('Specs:   e2e-appium/ only (e2e/ Detox excluded)')
  console.log('testIDs: matched only inside *.spec.ts (not pages/locators)')
  console.log('')
  if (testIdLiteralInSpecPct === null) {
    console.log(
      `Total coverage:    ${totalCoveragePercent}%  (spec-path only; no testIDs declared in feature .tsx)`
    )
  } else {
    console.log(
      `Total coverage:    ${totalCoveragePercent}%  (average of spec-path ${specPct}% and testID-in-spec ${testIdLiteralInSpecPct}% — ${totalReferencedTestIdsInSpec}/${totalDeclaredTestIds} IDs found in spec files)`
    )
  }
  console.log(
    `Features (mapped): ${coveredEither}/${featuresWithSignals.length} with spec path OR testID in a spec (${eitherPct}%)  [union]`
  )
  console.log(
    `                   ${coveredBySpec}/${featuresWithSignals.length} with ≥1 matching Appium spec path (${specPct}%)`
  )
  console.log(
    `                   ${coveredByTestId}/${featuresWithSignals.length} with ≥1 declared testID appearing in a spec file (${testIdPct}%)`
  )
  console.log(
    `Modals:   ${coveredModalsPath}/${modals.length} path/filename match (${modalPctPath}%)`
  )
  console.log(
    `          ${coveredModalsEither}/${modals.length} path match OR linked feature (spec OR testID) (${modalPctEither}%)`
  )
  console.log(
    `Appium: ${testFiles.length} spec files scanned for paths + testID text`
  )
  console.log('')

  console.log(
    'Mapped features with neither spec path nor testID string in any spec:'
  )
  for (const f of featuresWithSignals) {
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
      console.log(`\n${f} (${tests.length}):`)
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
    console.log('\nModals with no path match AND no linked-feature (spec OR testID):')
    for (const m of modalCoverage) {
      if (!m.covered) console.log(`  - ${m.modal}`)
    }
  } else {
    console.log('Run with --verbose for per-feature spec lists and unmatched modals.')
  }
}

main()
