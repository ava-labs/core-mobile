module.exports = {
  baseUrl: 'https://avalabs.testrail.net/',
  user: 'md.cuenta@avalabs.org' || process.env.TESTRAIL_USERNAME,
  pass: process.env.TESTRAIL_API_KEY,
  milestone: 'test milestone',
  regex: /[C][?\d]{3,6}/gm
}
