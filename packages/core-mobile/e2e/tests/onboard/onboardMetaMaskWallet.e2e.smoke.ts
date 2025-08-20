/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { ENV } from '../../helpers/getEnvs'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'

describe('Onboarding', () => {
  beforeAll(async () => {
    await device.reloadReactNative()
    await device.launchApp({ newInstance: true })
    await device.reloadReactNative()
    await commonElsPage.exitMetro()
    await handleJailbrokenWarning()
  })

  it('should onboard a metamask wallet', async () => {
    await loginRecoverWallet.login(ENV.E2E_METAMASK_MNEMONIC)
  })
})
