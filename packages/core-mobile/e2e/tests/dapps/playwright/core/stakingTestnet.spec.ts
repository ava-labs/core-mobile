import { test } from '@playwright/test'
import {
  getCurrentContext,
  playwrightSetup
} from '../../../../helpers/playwrightSetup'
import actions from '../../../../helpers/playwrightActions'

test.describe.serial('Testnet - Core.app and Mobile integration', () => {
  test.beforeAll(async () => {
    const { core } = await playwrightSetup(true)
    await core.connect(true)
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

  test('Testnet transfer - C to P', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('C', 'P', true)
  })

  test('Testnet transfer - C to X', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('C', 'X', true)
  })

  test('Testnet transfer - P to C', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('P', 'C', true)
  })

  test('Testnet transfer - P to X', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('P', 'X', true)
  })

  test('Testnet transfer - X to C', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('X', 'C', true)
  })

  test('Testnet transfer - X to P', async () => {
    const { core } = await getCurrentContext()
    await core.transfer('X', 'P', true)
  })

  test('Testnet delegate', async () => {
    const { core } = await getCurrentContext()
    await core.delegate()
  })
})
