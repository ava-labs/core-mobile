export const testRailConfig = {
  domain: 'https://avalabs.testrail.io',
  username: process.env.TESTRAIL_USERNAME?.trim() || 'mobiledevs@avalabs.org',
  apiKey: process.env.TESTRAIL_API_KEY,
  projectId: 3,
  suiteId: 3
}
