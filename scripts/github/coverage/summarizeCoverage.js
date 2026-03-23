const fs = require('fs')
const path = require('path')

const workspaces = [
  {
    packageName: '@avalabs/core-mobile',
    packagePath: 'packages/core-mobile',
    summarySuffixes: [
      'packages/core-mobile/coverage/coverage-summary.json',
      'core-mobile/coverage/coverage-summary.json'
    ],
    thresholdSuffixes: [
      'packages/core-mobile/coverage-thresholds.json',
      'core-mobile/coverage-thresholds.json'
    ]
  },
  {
    packageName: '@avalabs/k2-alpine',
    packagePath: 'packages/k2-alpine',
    summarySuffixes: [
      'packages/k2-alpine/coverage/coverage-summary.json',
      'k2-alpine/coverage/coverage-summary.json'
    ],
    thresholdSuffixes: [
      'packages/k2-alpine/coverage-thresholds.json',
      'k2-alpine/coverage-thresholds.json'
    ]
  }
]

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index]

    if (!part.startsWith('--')) {
      continue
    }

    const key = part.slice(2)
    const value = argv[index + 1]

    if (!value || value.startsWith('--')) {
      args[key] = 'true'
      continue
    }

    args[key] = value
    index += 1
  }

  return args
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/')
}

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return []
  }

  const files = []
  const directories = [rootDir]

  while (directories.length > 0) {
    const currentDir = directories.pop()
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isSymbolicLink()) {
        continue
      }

      if (entry.isDirectory()) {
        directories.push(fullPath)
        continue
      }

      files.push(fullPath)
    }
  }

  return files
}

function findFile(files, suffixes) {
  return files.find((filePath) => {
    const normalizedFilePath = normalizePath(filePath)
    return suffixes.some((suffix) => normalizedFilePath.endsWith(suffix))
  })
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return 'n/a'
  }

  return `${value.toFixed(2)}%`
}

function formatCount(value) {
  if (!Number.isFinite(value)) {
    return 'n/a'
  }

  return String(value)
}

function formatThreshold(threshold) {
  if (!Number.isFinite(threshold)) {
    return 'n/a'
  }

  return `${threshold}%`
}

function formatDelta(delta) {
  if (!Number.isFinite(delta)) {
    return 'n/a'
  }

  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(2)}%`
}

function packageStatusEmoji(workspace) {
  return workspace.thresholdsPassed ? '🟢' : '🔴'
}

function reportStatusEmoji(report) {
  if (report.packages.length === 0) {
    return '⚪'
  }

  return report.allThresholdsPassed ? '✅' : '❌'
}

function metricSummary(summary, metricName) {
  const metric = summary?.total?.[metricName]
  return {
    pct: typeof metric?.pct === 'number' ? metric.pct : Number.NaN,
    covered: typeof metric?.covered === 'number' ? metric.covered : Number.NaN,
    total: typeof metric?.total === 'number' ? metric.total : Number.NaN
  }
}

function metricPercentageText(metric, threshold) {
  const delta = metric.pct - threshold
  const directionIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '•'

  return `**${formatPercent(metric.pct)}** (${formatDelta(delta)} vs ${formatThreshold(
    threshold
  )} ${directionIcon})`
}

function metricCoveredText(metric) {
  return `${formatCount(metric.covered)}/${formatCount(metric.total)}`
}

function relativeTo(rootDir, filePath) {
  return normalizePath(path.relative(rootDir, filePath))
}

function writeFileIfRequested(filePath, contents) {
  if (!filePath) {
    return
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, contents)
}

const args = parseArgs(process.argv.slice(2))
const artifactsDir = path.resolve(process.cwd(), args['artifacts-dir'] || 'coverage-artifacts')
const runUrl = args['run-url'] || ''
const files = walkFiles(artifactsDir)
const metrics = ['lines', 'statements', 'functions', 'branches']
const metricDisplayOrder = [
  ['statements', 'Statements'],
  ['branches', 'Branches'],
  ['functions', 'Functions'],
  ['lines', 'Lines']
]

const packages = []
const missingPackages = []

for (const workspace of workspaces) {
  const summaryPath = findFile(files, workspace.summarySuffixes)
  const thresholdPath = findFile(files, workspace.thresholdSuffixes)

  if (!summaryPath || !thresholdPath) {
    missingPackages.push(workspace.packageName)
    continue
  }

  const summary = readJson(summaryPath)
  const thresholds = readJson(thresholdPath)
  const actual = Object.fromEntries(
    metrics.map((metricName) => [metricName, metricSummary(summary, metricName)])
  )

  const thresholdsPassed = metrics.every((metricName) => {
    return Number.isFinite(actual[metricName].pct) && actual[metricName].pct >= thresholds[metricName]
  })

  packages.push({
    packageName: workspace.packageName,
    packagePath: workspace.packagePath,
    summaryPath: relativeTo(artifactsDir, summaryPath),
    thresholdPath: relativeTo(artifactsDir, thresholdPath),
    actual,
    thresholds,
    thresholdsPassed
  })
}

const report = {
  generatedAt: new Date().toISOString(),
  artifactsDir: normalizePath(path.relative(process.cwd(), artifactsDir)),
  runUrl,
  packages,
  missingPackages,
  allThresholdsPassed: missingPackages.length === 0 && packages.length > 0
    ? packages.every((workspace) => workspace.thresholdsPassed)
    : false
}

const passingPackages = packages.filter((workspace) => workspace.thresholdsPassed)
const failingPackages = packages.filter((workspace) => !workspace.thresholdsPassed)
const overallStatus = reportStatusEmoji(report)

const markdownLines = [
  `## Coverage report ${overallStatus}`,
  '',
  packages.length > 0
    ? `**${passingPackages.length}/${packages.length} packages passed thresholds**`
    : 'No coverage summaries were found in the uploaded artifact.',
  packages.length > 0
    ? 'Thresholds are shown inline against each package baseline.'
    : '',
]

if (failingPackages.length > 0) {
  markdownLines.push(
    '',
    `**Failing packages:** ${failingPackages
      .map((workspace) => `\`${workspace.packageName}\``)
      .join(', ')}`
  )
}

if (missingPackages.length > 0) {
  markdownLines.push(
    '',
    `**Missing coverage data:** ${missingPackages
      .map((packageName) => `\`${packageName}\``)
      .join(', ')}`
  )
}

if (packages.length > 0) {
  for (const workspace of packages) {
    markdownLines.push('', `### ${packageStatusEmoji(workspace)} ${workspace.packageName}`, '')
    markdownLines.push(
      '| St. | Category | Percentage | Covered / Total |',
      '| --- | --- | --- | --- |'
    )

    for (const [metricName, label] of metricDisplayOrder) {
      const metric = workspace.actual[metricName]
      const threshold = workspace.thresholds[metricName]
      const passed = Number.isFinite(metric.pct) && metric.pct >= threshold

      markdownLines.push(
        `| ${passed ? '🟢' : '🔴'} | ${label} | ${metricPercentageText(
          metric,
          threshold
        )} | ${metricCoveredText(metric)} |`
      )
    }
  }

  markdownLines.push(
    '',
    '<details>',
    '<summary>Artifacts and threshold sources</summary>',
    ''
  )

  for (const workspace of packages) {
    markdownLines.push(
      `- \`${workspace.packageName}\`: summary \`${workspace.summaryPath}\`, thresholds \`${workspace.thresholdPath}\``
    )
  }

  markdownLines.push('', '</details>')
}

if (runUrl) {
  markdownLines.push('', `Source run: [Mobile PR](${runUrl})`)
}

const markdown = `${markdownLines.join('\n')}\n`
const json = `${JSON.stringify(report, null, 2)}\n`

writeFileIfRequested(args['json-out'], json)
writeFileIfRequested(args['markdown-out'], markdown)

if (!args['json-out']) {
  process.stdout.write(json)
}
