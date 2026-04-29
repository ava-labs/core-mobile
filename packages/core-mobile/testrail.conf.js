module.exports = {
  baseUrl: 'https://avalabs.testrail.net/',
  user: process.env.TESTRAIL_USERNAME || 'md.cuenta@avalabs.org',
  pass: process.env.TESTRAIL_API_KEY,
  milestone: 'test milestone',
  regex: /[C][?\d]{3,6}/gm
}
