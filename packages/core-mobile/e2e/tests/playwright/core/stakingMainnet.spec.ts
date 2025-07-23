import { test } from '@playwright/test'
import {
  getCurrentContext,
  playwrightSetup
} from '../../../helpers/playwrightSetup'
import actions from '../../../helpers/playwrightActions'

test.describe.serial('Mainnet - Core.app and Mobile integration', () => {
  test.beforeAll(async () => {
    const { core } = await playwrightSetup(true)
    await core.connect()
  })

  // eslint-disable-next-line no-empty-pattern
  test.afterEach(async ({}, testInfo) => {
    console.log('testInfo.title: ', testInfo.title)
    actions.addTestResultToFile(
      testInfo.title,
      testInfo.status === 'passed' ? 'PASS' : 'FAIL',
      'playwright',
      './e2e/tests/dapps/playwright/playground/playwrightResults.json'
    )
  })

  test('Mainnet transfer - C to P', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('C', 'P')
  })

  test('Mainnet transfer - C to X', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('C', 'X')
  })

  test('Mainnet transfer - P to C', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('P', 'C')
  })

  test('Mainnet transfer - P to X', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('P', 'X')
  })

  test('Mainnet transfer - X to C', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('X', 'C')
  })

  test('Mainnet transfer - X to P', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('X', 'P')
  })
})
