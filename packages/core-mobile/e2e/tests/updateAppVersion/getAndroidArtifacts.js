const { createWriteStream } = require('fs')
const axios = require('axios')

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const slug = process.env.BITRISE_APP_SLUG
const artifactsToken = process.env.BITRISE_ARTIFACTS_TOKEN
const baseURL = 'https://api.bitrise.io/v0.1'

// Get the build slug of external e2e regression run by index
const getAndroidBuildSlug = async buildIndex => {
  const response = await axios.get(
    `${baseURL}/apps/${slug}/builds?sort_by=created_at&branch=main&workflow=android-external-e2e-regression-run`,
    {
      headers: { Authorization: `${artifactsToken}` }
    }
  )
  const builds = response.data.data
  return builds[buildIndex].slug
}

// Returns the apk build slug and the url to get the download link
async function getAndroidArtifacts(buildIndex) {
  const latestAndroidBuildSlug = await getAndroidBuildSlug(buildIndex)
  const url = `${baseURL}/apps/${slug}/builds/${latestAndroidBuildSlug}/artifacts`
  const response = await axios.get(url, {
    headers: { Authorization: `${artifactsToken}` }
  })
  const artifacts = response.data.data
  // Filters the external build artifacts for the signed apk
  const externalSignedApk = artifacts.find(
    artifact =>
      artifact.title.indexOf('app-external-e2e-bitrise-signed.apk') > -1 &&
      artifact.artifact_type === 'android-apk'
  )
  // Filters the external build artifacts for the test apk
  const androidTestApk = artifacts.find(
    artifact =>
      artifact.title.indexOf(
        'app-external-e2e-androidTest-bitrise-signed.apk'
      ) > -1 && artifact.artifact_type === 'android-apk'
  )
  return {
    url: url,
    slug: externalSignedApk.slug,
    testSlug: androidTestApk.slug
  }
}

// Downloads the external signed and test apks
async function downloadExternalApk(buildIndex, apkName, testApkName) {
  const writer = createWriteStream(apkName)
  const testApkWriter = createWriteStream(testApkName)
  const artifacts = await getAndroidArtifacts(buildIndex)
  const apkSlug = artifacts.slug
  const url = artifacts.url
  const apkResponse = await axios.get(`${url}/${apkSlug}`, {
    headers: { Authorization: `${artifactsToken}` }
  })
  const testApkResponse = await axios.get(`${url}/${artifacts.testSlug}`, {
    headers: { Authorization: `${artifactsToken}` }
  })
  const testDownloadUrl = testApkResponse.data.data.expiring_download_url
  const downloadUrl = apkResponse.data.data.expiring_download_url
  const apkFile = await axios.get(downloadUrl, {
    responseType: 'stream'
  })
  const testApkFile = await axios.get(testDownloadUrl, {
    responseType: 'stream'
  })
  apkFile.data.pipe(writer)
  testApkFile.data.pipe(testApkWriter)
}

// Downloads the latest and old versions of the external signed and test apks
async function setupApksForTesting() {
  console.log('Downloading older version external apks for testing')
  downloadExternalApk(
    6,
    './e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk',
    './e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk'
  )
  // Short delay to avoid possible rate limiting
  await delay(2000)
  console.log('Downloading latest version external apks for testing')
  downloadExternalApk(
    0,
    './e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-bitrise-signed.apk',
    './e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-androidTest-bitrise-signed.apk'
  )
}

setupApksForTesting()
