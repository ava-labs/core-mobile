/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { warmup } from '../../helpers/warmup'
import PerformancePage from '../../pages/performance.page'
const fs = require('fs')

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should display performance for recoverWallet flow', async () => {
    const recoveryPhrase = process.env.E2E_MNEMONIC as string
    try {
      const result = await PerformancePage.recoverWallet(recoveryPhrase)
      fs.writeFile(
        '/Users/artembespalov/Documents/app2/avalanche-wallet-apps/e2e/tests/performance/testResults/tempResults.txt',
        result,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any) => {
          if (err) throw err
        }
      )
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })
})
