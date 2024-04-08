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
    await device.disableSynchronization()
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await Actions.waitForElement(
      ExistingRecoveryPhrasePage.alreadyHaveAWalletBtn,
      10000,
      0
    )
    await ExistingRecoveryPhrasePage.tapAlreadyHaveAWalletBtn()
    await Actions.waitForElement(
      ExistingRecoveryPhrasePage.recoveryPhrase,
      10000,
      0
    )
    await ExistingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await Actions.waitForElement(AnalyticsConsentPage.noThanksBtn, 10000, 0)
    await AnalyticsConsentPage.tapNoThanksBtn()
    await Actions.waitForElement(
      ExistingRecoveryPhrasePage.recoveryPhraseTextInput,
      10000,
      0
    )
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await Actions.waitForElement(nameWalletPage.nameWalletInput, 10000, 0)
    await nameWalletPage.enterWalletName('testWallet1\n')
    await Actions.waitForElement(CreatePinPage.numpadZero, 10000, 0)
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await Actions.waitForElement(CreatePinPage.agreeAndContinueBtn, 10000, 0)
    await CreatePinPage.tapAgreeAndContinueBtn()
    await Actions.waitForElement(commonElsPage.getStartedButton, 10000, 0)
    await commonElsPage.tapGetStartedButton()
    await Actions.waitForElement(PortfolioPage.colectiblesTab, 10000, 0)
    await PortfolioPage.verifyPorfolioScreen()
    await device.enableSynchronization()
  }

  async enterPin() {
    await CreatePinPage.tapNumpadZero6Times()
    await commonElsPage.checkIfMainnet()
  }

  async recoverWalletLogin() {
    const isVisibleNo = await Actions.expectToBeVisible(
      existingRecoveryPhrasePage.forgotPinBtn
    )

    if (isVisibleNo) {
      await this.enterPin()
      await accountManagePage.switchToFirstAccount()
    } else {
      await this.recoverMnemonicWallet()
    }
  }
}

export default new LoginRecoverWallet()
