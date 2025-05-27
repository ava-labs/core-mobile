/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
import { handleJailbrokenWarning } from '../../helpers/warmup'

describe('Onboard MetaMask wallet', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    await handleJailbrokenWarning()
  })

  it('Should login with a metamask wallet', async () => {
    await loginRecoverWallet.login(process.env.E2E_METAMASK_MNEMONIC as string)
  })
})
