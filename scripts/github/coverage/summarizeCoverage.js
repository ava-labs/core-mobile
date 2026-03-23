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

function metricValue(summary, metricName) {
  const metric = summary?.total?.[metricName]
  return typeof metric?.pct === 'number' ? metric.pct : Number.NaN
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
    metrics.map((metricName) => [metricName, metricValue(summary, metricName)])
  )

  const thresholdsPassed = metrics.every((metricName) => {
    return Number.isFinite(actual[metricName]) && actual[metricName] >= thresholds[metricName]
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

const markdownLines = [
  '# Mobile PR Coverage',
  '',
  packages.length > 0
    ? `Overall thresholds: ${report.allThresholdsPassed ? 'PASS' : 'FAIL'}`
    : 'No coverage summaries were found in the uploaded artifact.',
  '',
  '| Package | Lines | Statements | Functions | Branches | Thresholds |',
  '| --- | --- | --- | --- | --- | --- |'
]

for (const workspace of packages) {
  markdownLines.push(
    `| ${workspace.packageName} | ${formatPercent(workspace.actual.lines)} (>= ${workspace.thresholds.lines}%) | ${formatPercent(workspace.actual.statements)} (>= ${workspace.thresholds.statements}%) | ${formatPercent(workspace.actual.functions)} (>= ${workspace.thresholds.functions}%) | ${formatPercent(workspace.actual.branches)} (>= ${workspace.thresholds.branches}%) | ${workspace.thresholdsPassed ? 'PASS' : 'FAIL'} |`
  )
}

if (packages.length === 0) {
  markdownLines.push('| n/a | n/a | n/a | n/a | n/a | n/a |')
}

if (missingPackages.length > 0) {
  markdownLines.push('', `Missing coverage data for: ${missingPackages.join(', ')}`)
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
