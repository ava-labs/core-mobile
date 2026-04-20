#!/usr/bin/env node
/**
 * Download an internal Android APK from Bitrise via the public API.
 *
 * Scope (what this file does NOT do):
 * - Does not upload to AWS Device Farm, package tests, or run Appium.
 * - Does not read BITRISE_APK_PATH from the current CI job (that artifact is already on disk in Bitrise).
 *
 * Callers (orchestration scripts that invoke this as step 1 before Device Farm):
 * - scripts/devicefarm/bitrise-to-devicefarm.sh — download → package tests → trigger-devicefarm-api.js
 * - scripts/devicefarm/trigger-test-run.sh — optional download when DEVICEFARM_APP_PATH is not set
 *
 * Bitrise CI: workflows that build the APK in the same pipeline (e.g. android-internal-e2e-aws-regression-run)
 * use the APK produced by Gradle and pass it to the in-repo Device Farm step; they do not run this script.
 *
 * Usage:
 *   BITRISE_APP_SLUG=<slug> BITRISE_ARTIFACTS_TOKEN=<token> node scripts/devicefarm/download-bitrise-apk.js [buildType] [buildIndex] [outputPath] [branch]
 *
 * Environment variables:
 *   BITRISE_APP_SLUG - Your Bitrise app slug (required)
 *   BITRISE_ARTIFACTS_TOKEN - Bitrise artifacts access token (required)
 *
 * Arguments:
 *   buildType - Type of build: 'e2e' (default) or 'release'. Default: 'e2e'
 *   buildIndex - Which build to download (0 = latest, 1 = second latest, etc.). Default: 0
 *   outputPath - Where to save the APK. Default: based on buildType
 *   branch - Branch name to filter builds by. Optional. If not provided, downloads from any branch
 *
 * Examples:
 *   # Download latest internalE2e APK (default)
 *   node scripts/devicefarm/download-bitrise-apk.js
 *
 *   # Download latest internal release APK (if available)
 *   node scripts/devicefarm/download-bitrise-apk.js release
 *
 *   # Download second latest e2e build
 *   node scripts/devicefarm/download-bitrise-apk.js e2e 1
 *
 *   # Download latest e2e build from specific branch
 *   node scripts/devicefarm/download-bitrise-apk.js e2e 0 ./app.apk feature/my-branch
 */

const { createWriteStream, statSync } = require('fs')
const { dirname } = require('path')
const { mkdir } = require('fs').promises
const axios = require('axios')

const slug = process.env.BITRISE_APP_SLUG
const artifactsToken = process.env.BITRISE_ARTIFACTS_TOKEN
const baseURL = 'https://api.bitrise.io/v0.1'

// Parse arguments
const buildType =
  process.argv[2] === 'release' || process.argv[2] === 'e2e'
    ? process.argv[2]
    : 'e2e'
const buildIndex = parseInt(
  process.argv[2] === 'release' || process.argv[2] === 'e2e'
    ? process.argv[3] || '0'
    : process.argv[2] || '0',
  10
)

// Determine outputPath and branch based on argument positions
let outputPath, branch
if (process.argv[2] === 'release' || process.argv[2] === 'e2e') {
  // Format: e2e [buildIndex] [outputPath] [branch]
  outputPath =
    process.argv[4] ||
    (buildType === 'e2e'
      ? './android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk'
      : './android/app/build/outputs/apk/internal/release/app-internal-release.apk')
  branch = process.argv[5] || undefined
} else {
  // Format: [buildIndex] [outputPath] [branch] (buildType defaults to 'e2e')
  outputPath =
    process.argv[3] ||
    './android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk'
  branch = process.argv[4] || undefined
}

if (!slug) {
  console.error('❌ Error: BITRISE_APP_SLUG environment variable is required')
  console.error('   Get it from: https://app.bitrise.io/app/<your-app-slug>')
  process.exit(1)
}

if (!artifactsToken) {
  console.error(
    '❌ Error: BITRISE_ARTIFACTS_TOKEN environment variable is required'
  )
  console.error(
    '   Get it from: Bitrise Dashboard > Settings > API > Artifacts Access Token'
  )
  process.exit(1)
}

// Get the build slug for internal builds
const getInternalBuildSlug = async (buildType, buildIndex, branchFilter) => {
  console.log(
    `📋 Fetching build list for ${buildType} builds (index ${buildIndex})...`
  )
  if (branchFilter) {
    console.log(`   Branch filter: ${branchFilter}`)
  }

  // Define workflows based on build type
  const workflows =
    buildType === 'e2e' ? ['android-internal-e2e'] : ['android-internal']

  let allBuilds = []

  for (const workflow of workflows) {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        sort_by: 'created_at',
        workflow: workflow
      })
      if (branchFilter) {
        params.append('branch', branchFilter)
      }

      const response = await axios.get(
        `${baseURL}/apps/${slug}/builds?${params.toString()}`,
        {
          headers: { Authorization: `token ${artifactsToken}` }
        }
      )
      const builds = response.data.data
      const branchInfo = branchFilter ? ` on branch "${branchFilter}"` : ''
      console.log(
        `   Found ${builds.length} builds for workflow "${workflow}"${branchInfo}`
      )
      allBuilds = allBuilds.concat(builds.map(b => ({ ...b, workflow })))
    } catch (error) {
      console.log(
        `   ⚠️  Could not fetch builds for workflow "${workflow}": ${error.message}`
      )
    }
  }

  // Sort by creation date (newest first) and filter for successful builds
  allBuilds.sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at))

  // Filter to only successful builds (status 1 = success)
  const successfulBuilds = allBuilds.filter(build => build.status === 1)

  if (successfulBuilds.length === 0) {
    const statusCounts = {}
    allBuilds.forEach(b => {
      statusCounts[b.status_text] = (statusCounts[b.status_text] || 0) + 1
    })
    console.error(`\n⚠️  No successful ${buildType} builds found.`)
    console.error('Build status summary:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.error(`  ${status}: ${count}`)
    })
    throw new Error(
      `No successful ${buildType} builds found. All builds are aborted, failed, or in progress.`
    )
  }

  if (buildIndex >= successfulBuilds.length) {
    throw new Error(
      `Build index ${buildIndex} out of range. Found ${successfulBuilds.length} successful builds.`
    )
  }

  const build = successfulBuilds[buildIndex]
  console.log(`✅ Found build: ${build.slug} (${build.status_text})`)
  console.log(`   Workflow: ${build.workflow}`)
  console.log(`   Branch: ${build.branch}`)
  console.log(`   Created: ${build.triggered_at}`)

  return build.slug
}

// Get the APK artifact from a build
const getApkArtifact = async (buildSlug, buildType) => {
  console.log(`📦 Fetching artifacts for build ${buildSlug}...`)
  const url = `${baseURL}/apps/${slug}/builds/${buildSlug}/artifacts`
  const response = await axios.get(url, {
    headers: { Authorization: `token ${artifactsToken}` }
  })

  const artifacts = response.data.data
  console.log(`   Found ${artifacts.length} artifacts`)

  // Match artifact title: e2e = exact Bitrise name; release = internal * -signed.apk
  const apkTitleMatcher =
    buildType === 'e2e'
      ? 'app-internal-e2e-bitrise-signed.apk'
      : /app-internal.*-signed\.apk/i

  const apkArtifact = artifacts.find(artifact => {
    if (!artifact.title || artifact.artifact_type !== 'android-apk') {
      return false
    }
    const t = artifact.title
    return typeof apkTitleMatcher === 'string'
      ? t.includes(apkTitleMatcher)
      : apkTitleMatcher.test(t)
  })

  if (!apkArtifact) {
    const expectedName =
      typeof apkTitleMatcher === 'string'
        ? apkTitleMatcher
        : 'app-internal-*-signed.apk'
    console.error(`\n❌ Could not find ${expectedName} artifact`)
    if (artifacts.length > 0) {
      console.error('\nAvailable artifacts:')
      artifacts.forEach(art => {
        console.error(`  - ${art.title} (${art.artifact_type})`)
      })
    } else {
      console.error('\n⚠️  No artifacts found for this build.')
      console.error('   This might mean:')
      console.error('   - The build is still in progress')
      console.error('   - The build failed before creating artifacts')
      console.error('   - The build was aborted')
    }
    throw new Error(`Could not find ${expectedName} artifact`)
  }

  console.log(`✅ Found APK artifact: ${apkArtifact.title}`)
  return { artifactSlug: apkArtifact.slug, artifactsUrl: url }
}

// Download the APK
const downloadApk = async (artifactsUrl, artifactSlug, outputPath) => {
  console.log(`📥 Getting download URL...`)
  const artifactResponse = await axios.get(`${artifactsUrl}/${artifactSlug}`, {
    headers: { Authorization: `token ${artifactsToken}` }
  })

  const downloadUrl = artifactResponse.data.data.expiring_download_url
  if (!downloadUrl) {
    throw new Error('No download URL found in artifact response')
  }

  console.log(`📥 Downloading APK to: ${outputPath}`)

  // Ensure output directory exists
  const outputDir = dirname(outputPath)
  await mkdir(outputDir, { recursive: true })

  const writer = createWriteStream(outputPath)
  const response = await axios.get(downloadUrl, {
    responseType: 'stream'
  })

  return new Promise((resolve, reject) => {
    let downloadedBytes = 0
    const totalBytes = parseInt(response.headers['content-length'] || '0', 10)

    response.data.on('data', chunk => {
      downloadedBytes += chunk.length
      if (totalBytes > 0) {
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1)
        process.stdout.write(
          `\r   Progress: ${percent}% (${(
            downloadedBytes /
            1024 /
            1024
          ).toFixed(2)} MB)`
        )
      }
    })

    // Resolve only after the file write stream finishes (all bytes flushed), not on HTTP `end`.
    response.data.on('error', err => {
      writer.destroy(err)
      reject(err)
    })
    writer.on('error', err => {
      response.data.destroy()
      reject(err)
    })
    writer.on('finish', () => {
      console.log('\n✅ Download complete!')
      try {
        const stats = statSync(outputPath)
        console.log(`📦 APK size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
      } catch (e) {
        reject(e)
        return
      }
      resolve()
    })

    response.data.pipe(writer)
  })
}

// Main: list builds (workflow android-internal-e2e | android-internal) → pick successful build → find APK artifact → download to disk
async function main() {
  try {
    console.log(`🚀 Downloading internal ${buildType} APK from Bitrise...\n`)
    if (branch) {
      console.log(`🌿 Filtering by branch: ${branch}\n`)
    }

    const buildSlug = await getInternalBuildSlug(buildType, buildIndex, branch)
    const { artifactSlug, artifactsUrl } = await getApkArtifact(
      buildSlug,
      buildType
    )
    await downloadApk(artifactsUrl, artifactSlug, outputPath)

    console.log(`\n✅ Success! APK saved to: ${outputPath}`)
    console.log(`\n💡 To use this APK with Device Farm:`)
    console.log(`   export DEVICEFARM_APP_PATH="${outputPath}"`)
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(
        `   Response: ${JSON.stringify(error.response.data, null, 2)}`
      )
    }
    process.exit(1)
  }
}

main()
