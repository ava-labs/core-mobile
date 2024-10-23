import Constants from 'expo-constants'
import { init as initStorybook } from './storybook'

if (Constants.expoConfig?.extra?.storybook === true) {
  initStorybook()
} else {
  module.exports = require('./index.package.ts')
}
