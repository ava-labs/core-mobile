/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { warmup } from '../../helpers/warmup'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    console.log('The recovery phrase is ' + recoveryPhrase)
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
  })
})
