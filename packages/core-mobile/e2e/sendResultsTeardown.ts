import { globalTeardown } from 'detox/runners/jest'

module.exports = async () => {
  await globalTeardown()
}
