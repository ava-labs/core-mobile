/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { warmup } from '../../helpers/warmup'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'

describe('Add existing metamask wallet', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should successfully add an existing metamask wallet', async () => {
    const recoveryPhrase: string = process.env.E2E_METAMASK_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
  })
})
