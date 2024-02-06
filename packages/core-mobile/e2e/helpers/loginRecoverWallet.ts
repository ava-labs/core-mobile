import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import PortfolioPage from '../pages/portfolio.page'
import commonElsPage from '../pages/commonEls.page'
import nameWalletPage from '../pages/nameWallet.page'
import ExistingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import accountManagePage from '../pages/accountManage.page'
import existingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import Actions from '../helpers/actions'

class LoginRecoverWallet {
  async recoverMnemonicWallet() {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.tapAlreadyHaveAWalletBtn()
    await ExistingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await PortfolioPage.verifyPorfolioScreen()
  }

  async enterPin() {
    await CreatePinPage.tapNumpadZero6Times()
    await commonElsPage.checkIfMainnet()
  }

  async recoverWalletLogin() {
    const isVisisbleNo = await Actions.expectToBeVisible(
      existingRecoveryPhrasePage.forgotPinBtn
    )

    if (isVisisbleNo) {
      console.log(isVisisbleNo, 'isVisisbleNo Yes')
      await this.enterPin()
      await accountManagePage.switchToFirstAccount()
    } else {
      console.log(isVisisbleNo, 'isVisisbleNo No')
      await this.recoverMnemonicWallet()
    }
  }
}

export default new LoginRecoverWallet()
