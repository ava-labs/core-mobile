/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import PortfolioPage from '../../pages/portfolio.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import delay from '../../helpers/waits'
import nameWalletPage from '../../pages/nameWallet.page'
import commonElsPage from '../../pages/commonEls.page'
import analyticsConsentPage from '../../pages/analyticsConsent.page'

describe('Unlock app with recovery phrase', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should successfully unlock app with recovery phrase', async () => {
    await device.reloadReactNative()
    // This is a workaround for the issue with Android where the app is not launched after reloadReactNative. Does nothing if app is launched.
    if (device.getPlatform() === 'android') {
      await delay(5000)
      await device.launchApp({ newInstance: false })
    }
    await ExistingRecoveryPhrasePage.tapForgotPinBtn()
    await ExistingRecoveryPhrasePage.tapContinueBtn()
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await analyticsConsentPage.tapIAgreeBtn()
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  })
})
