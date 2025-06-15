/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { ENV } from '../../helpers/getEnvs'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'

describe('Onboard MetaMask wallet', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    await commonElsPage.exitMetro()
    await handleJailbrokenWarning()
  })

  it('Should login with a metamask wallet', async () => {
    await loginRecoverWallet.login(ENV.E2E_METAMASK_MNEMONIC)
  })
})
