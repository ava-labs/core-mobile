/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { handleJailbrokenWarning } from '../../helpers/warmup'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'

describe('Add existing wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await handleJailbrokenWarning()
  })

  it('should successfully add an existing wallet', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
  })
})
