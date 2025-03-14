import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import PortfolioPage from '../pages/portfolio.page'
import commonElsPage from '../pages/commonEls.page'
import nameWalletPage from '../pages/nameWallet.page'
import accountManagePage from '../pages/accountManage.page'
import existingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import Actions from '../helpers/actions'

class LoginRecoverWallet {
  async recoverMnemonicWallet() {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await existingRecoveryPhrasePage.tapAccessExistingWallet()
    await existingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await existingRecoveryPhrasePage.tapAgreeAndContinue()
    await AnalyticsConsentPage.tapUnlockBtn()
    await existingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await existingRecoveryPhrasePage.tapImport()
    await Actions.waitForElement(by.text('Secure your wallet with a PIN'))
    await CreatePinPage.tapNumpadZero()
    await Actions.waitForElement(by.text('Confirm your PIN code'))
    await CreatePinPage.tapNumpadZero()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await CreatePinPage.tapNextBtn()
    await Actions.waitForElement(by.text('Select your\npersonal avatar'))
    await CreatePinPage.tapNextBtn()
    await CreatePinPage.tapLetsGo()
    // await commonElsPage.tapGetStartedButton()
    await PortfolioPage.verifyPorfolioScreen()
  }

  async enterPin() {
    await CreatePinPage.tapNumpadZero6Times()
    await commonElsPage.checkIfMainnet()
  }

  async recoverWalletLogin() {
    const isLoggedIn = await Actions.expectToBeVisible(
      existingRecoveryPhrasePage.forgotPinBtn
    )

    if (isLoggedIn) {
      await this.enterPin()
      await accountManagePage.switchToFirstAccount()
    } else {
      await this.recoverMnemonicWallet()
    }
  }
}

export default new LoginRecoverWallet()
