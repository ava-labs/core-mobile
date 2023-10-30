const merge = require('lodash.merge')
const { getBaseConfig } = require('./metro.base.config')
const monorepoConfig = require('./metro.monorepo.config')

module.exports = (async () => {
  const baseConfig = await getBaseConfig()
  return merge(baseConfig, monorepoConfig)
})()
