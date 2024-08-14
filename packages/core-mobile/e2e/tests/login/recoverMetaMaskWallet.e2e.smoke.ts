/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { handleJailbrokenWarning } from '../../helpers/warmup'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'

describe('Login with metamask wallet', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    await handleJailbrokenWarning()
  })

  it('Should login with a metamask wallet', async () => {
    const recoveryPhrase: string = process.env.E2E_METAMASK_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
  })
})
