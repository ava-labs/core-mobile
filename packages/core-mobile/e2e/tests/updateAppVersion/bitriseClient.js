const assert = require('assert')
const axios = require('axios')
const axiosRetry = require('axios-retry').default

const token = process.env.BITRISE_ARTIFACTS_TOKEN

const client = () => {
  assert(token, 'An access token is required')

  axiosRetry(bitriseClient, { retries: 3 })

  const bitriseClient = axios.create({
    baseURL: 'https://api.bitrise.io/v0.1',
    headers: { Authorization: `token ${token}` }
  })

  return bitriseClient
}

module.exports = client
