/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./jestCustomEnv
 */
import { handleJailbrokenWarning, warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import PortfolioPage from '../../pages/portfolio.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import nameWalletPage from '../../pages/nameWallet.page'
import commonElsPage from '../../pages/commonEls.page'
import analyticsConsentPage from '../../pages/analyticsConsent.page'
import burgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'

describe('Login with Mnemonic wallet', () => {
  beforeAll(async () => {
    await warmup()
    await handleJailbrokenWarning()
  })

  it('should login with recovery phrase', async () => {
    await device.launchApp({ newInstance: true })
    await ExistingRecoveryPhrasePage.tapForgotPinBtn()
    await burgerMenuPage.swipeToLogout()
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapImport()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await commonElsPage.tapNotNow()
    await analyticsConsentPage.tapUnlockBtn()
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  })
})
