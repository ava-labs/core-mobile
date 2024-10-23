import Constants from 'expo-constants'
import { registerRootComponent } from 'expo'

if (Constants.expoConfig?.extra?.storybook === true) {
  registerRootComponent(require('../.storybook').default)
} else {
  module.exports = require('./index.package.ts')
}
