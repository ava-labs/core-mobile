import assert from 'assert'
import commonEls from '../locators/commonEls.loc'
import Actions from '../helpers/actions'
import loginRecoverWallet from '../helpers/loginRecoverWallet'
import delay from '../helpers/waits'
import commonElsLoc from '../locators/commonEls.loc'
import advancedPage from './burgerMenu/advanced.page'
import burgerMenuPage from './burgerMenu/burgerMenu.page'

class CommonElsPage {
  get retryBtn() {
    return by.text(commonEls.retryBtn)
  }

  get backButton() {
    return by.id(commonEls.backButton)
  }

  get getStartedButton() {
    return by.text(commonEls.getStartedBtn)
  }

  get inputTextField() {
    return by.id(commonEls.inputTextField)
  }

  get simpleToastMsg() {
    return by.id(commonEls.simpleToastMsg)
  }

  get jailbrokenWarning() {
    return by.id(commonEls.jailbrokenWarning)
  }

  get testnetBanner() {
    return by.id(commonEls.testnetBanner)
  }

  get notNow() {
    return by.text(commonEls.notNow)
  }

  get turnOnNotifications() {
    return by.text(commonEls.turnOnNotifications)
  }

  get searchBar() {
    return by.id(commonEls.searchBar)
  }

  get bitcoinSVG() {
    return by.id(commonEls.bitcoinSVG)
  }

  get avaSVG() {
    return by.id(commonEls.avaSVG)
  }

  get reloadSVG() {
    return by.id(commonEls.reloadSVG)
  }

  get carrotSVG() {
    return by.id(commonEls.carrotSVG)
  }

  get calendarSVG() {
    return by.id(commonEls.calendarSVG)
  }

  get datePicker() {
    return by.id(commonEls.datePicker)
  }

  get okBtn() {
    return by.text(commonEls.okBtn)
  }

  get next() {
    return by.text(commonElsLoc.next)
  }

  get dismiss() {
    return by.text(commonElsLoc.dismiss)
  }

  get grabber() {
    return by.id(commonElsLoc.grabber)
  }

  get cChain() {
    return by.text(commonElsLoc.cChain)
  }

  get pChain() {
    return by.text(commonElsLoc.pChain)
  }

  get xChain() {
    return by.text(commonElsLoc.xChain)
  }

  get xpChain() {
    return by.text(commonElsLoc.xpChain)
  }

  get ethereum() {
    return by.text(commonElsLoc.ethereum)
  }

  get evm() {
    return by.text(commonElsLoc.evm)
  }

  get bitcoin() {
    return by.text(commonElsLoc.bitcoin)
  }

  get solana() {
    return by.text(commonElsLoc.solana)
  }

  get bitcoinNetwork() {
    return by.text(commonElsLoc.bitcoinNetwork)
  }

  get balanceHeaderAccountName() {
    return by.id(commonElsLoc.balanceHeaderAccountName)
  }

  get pinInputField() {
    return by.id(commonElsLoc.pinInputField)
  }

  get copied() {
    return by.text(commonElsLoc.copied)
  }

  get copyPhrase() {
    return by.text(commonElsLoc.copyPhrase)
  }

  get save() {
    return by.text(commonEls.save)
  }

  get dialogInput() {
    return by.id(commonEls.dialogInput)
  }

  get copy() {
    return by.text(commonEls.copy)
  }

  get nextButton() {
    return by.id(commonEls.nextBtn)
  }

  get approveButton() {
    return by.id(commonEls.approveBtn)
  }

  get rejectButton() {
    return by.id(commonEls.rejectBtn)
  }

  get insufficientBalance() {
    return by.text(commonElsLoc.insufficientBalance)
  }

  get selectNetworkBitcoin() {
    return by.id(commonElsLoc.selectNetworkBitcoin)
  }

  get selectNetworkCChainEVM() {
    return by.id(commonElsLoc.selectNetworkCChainEVM)
  }

  get selectNetworkXPChain() {
    return by.id(commonElsLoc.selectNetworkXPChain)
  }

  get evmNetwork() {
    return by.text(commonElsLoc.evmNetwork)
  }

  get XPNetwork() {
    return by.text(commonElsLoc.XPNetwork)
  }

  get transactionOnboardingNext() {
    return by.id(commonElsLoc.transactionOnboardingNext)
  }

  get tokenAmountInputField() {
    return by.id(commonElsLoc.tokenAmountInputField)
  }

  get transactionSuccess() {
    return by.text(commonElsLoc.transactionSuccess)
  }

  get transactionFail() {
    return by.text(commonElsLoc.transactionFail)
  }

  get dropdownScrollView() {
    return by.id(commonElsLoc.dropdownScrollView)
  }

  get settingsBtn() {
    return by.id(commonElsLoc.settingsBtn)
  }

  get delete() {
    return by.text(commonElsLoc.delete)
  }

  get cancel() {
    return by.text(commonElsLoc.cancel)
  }

  get approvePopupTitle() {
    return by.text(commonElsLoc.approvePopupTitle)
  }

  get approvePopupSpendTitle() {
    return by.text(commonElsLoc.approvePopupSpendTitle)
  }

  get filterDropdown() {
    return by.id(commonElsLoc.filterDropdown)
  }

  get networkFilterDropdown() {
    return by.id(commonElsLoc.networkFilterDropdown)
  }

  async filter(
    item = commonElsLoc.cChain_2,
    filterDropdown = this.filterDropdown
  ) {
    await Actions.tap(filterDropdown)
    await this.selectDropdownItem(item)
  }

  async dismissTransactionOnboarding() {
    try {
      await Actions.tap(this.transactionOnboardingNext)
    } catch (e) {
      console.log('Transaction onboarding not found')
    }
  }

  async enterPin(pin = '000000') {
    await Actions.waitForElement(this.pinInputField)
    await Actions.setInputText(this.pinInputField, pin)
  }

  async getBalanceHeaderAccountName(index = 0) {
    return await Actions.getElementText(this.balanceHeaderAccountName, index)
  }

  async tapCarrotSVG(index = 0) {
    await Actions.tapElementAtIndex(this.carrotSVG, index)
  }

  async typeSearchBar(
    text: string,
    searchBar: Detox.NativeMatcher = this.searchBar
  ) {
    await Actions.waitForElement(searchBar)
    await Actions.setInputText(searchBar, text)
  }

  async tapBackButton(index = 0) {
    await Actions.tapElementAtIndex(this.backButton, index)
  }

  async tapGetStartedButton() {
    await Actions.tap(this.getStartedButton)
  }

  async enterTextInput(inputText: string, index = 0) {
    await Actions.setInputText(this.inputTextField, inputText, index)
  }

  async clearTextInput(inputText: string, index = 0) {
    await Actions.setInputText(this.inputTextField, inputText, index)
  }

  async waitForToastMsgGone(index?: number) {
    try {
      await Actions.waitForElementNotVisible(this.simpleToastMsg, index)
    } catch (error) {
      console.log('Toast message not found')
    }
  }

  async waitForJailbrokenWarning() {
    await Actions.waitForElement(this.jailbrokenWarning)
  }

  async tapRetryBtn() {
    await Actions.waitForElement(this.retryBtn, 1)
    try {
      await Actions.tap(this.retryBtn)
    } catch (error) {
      /* empty */
    }
  }

  async tapDeviceBackButton() {
    await device.pressBack()
  }

  async checkIfMainnet() {
    if (process.env.SEEDLESS_TEST === 'true') {
      try {
        await Actions.waitForElement(this.testnetBanner, 10000, 0)
        await advancedPage.switchToMainnet()
        await this.tapBackButton()
        await burgerMenuPage.swipeLeft()
        await Actions.swipeLeft(burgerMenuPage.addressBook, 'slow', 1000, 0)
      } catch (error) {
        return
      }
    }
  }

  async refreshApp() {
    if (Actions.platform() === 'ios') {
      await device.reloadReactNative()
    } else {
      await device.launchApp({ newInstance: true })
    }
    loginRecoverWallet.enterPin()
  }

  async goBack() {
    await delay(1000)
    try {
      await Actions.tapElementAtIndex(this.backButton, 0)
    } catch (e) {
      await Actions.tapElementAtIndex(this.backButton, 1)
    }
    await delay(1500)
  }

  async tapDropdownItem(item: string, index = 0) {
    await Actions.waitForElement(by.id(`dropdown_item__${item}`))
    await Actions.tapElementAtIndex(by.id(`dropdown_item__${item}`), index)
  }

  async tapNotNow() {
    try {
      await Actions.tapElementAtIndex(this.notNow, 0)
    } catch (e) {
      console.log('Not now button not found')
    }
  }

  async tapTurnOnNotifications() {
    await Actions.tapElementAtIndex(this.turnOnNotifications, 0)
  }

  async tapAvaSVG(index = 0) {
    await Actions.tapElementAtIndex(this.avaSVG, index)
  }

  async tapBitcoinSVG(index = 0) {
    await Actions.tapElementAtIndex(this.bitcoinSVG, index)
  }

  async tapReloadSVG(index = 0) {
    await Actions.tapElementAtIndex(this.reloadSVG, index)
  }

  async tapNext() {
    await Actions.tap(this.next)
  }

  async dismissBottomSheet() {
    await Actions.waitForElement(this.grabber, 5000)
    await Actions.drag(this.grabber, 'down', 0.5)
  }

  async selectDropdown(name: string, dropdownItem: string) {
    await Actions.tap(by.id(`${name}_dropdown_btn`))
    // await Actions.waitForElement(by.id(`dropdown_item__${dropdownItem}`))
    await Actions.tap(by.id(`dropdown_item__${dropdownItem}`))
  }

  async visibleDropdown(name: string, isVisible = true) {
    if (isVisible) {
      await Actions.waitForElement(by.id(`${name}_dropdown_btn`))
    } else {
      await Actions.waitForElementNotVisible(by.id(`${name}_dropdown_btn`))
    }
  }

  async tapCopyPhrase() {
    await Actions.tap(this.copyPhrase)
  }

  async tapSave(index = 0) {
    await Actions.waitForElement(this.save, 10000)
    await Actions.tapElementAtIndex(this.save, index)
  }

  async verifyAccountName(expectedName: string, index = 0) {
    const UIaccountName = await this.getBalanceHeaderAccountName(index)
    assert(
      expectedName === UIaccountName,
      `Account name mismatch: ${expectedName} !== ${UIaccountName}`
    )
  }

  async exitMetro() {
    await device.disableSynchronization()
    try {
      if (await Actions.isVisible(by.text(/.*8081.*/i), 0)) {
        await Actions.tap(by.text(/.*8081.*/i))
      }
      const xBtn = by.text(/.*developer menu.*/i)
      await Actions.waitForElement(xBtn, 10000)
      await Actions.drag(xBtn, 'down', 0.5)
    } catch (e) {
      console.log('Metro dev menu is not found...')
    }
  }

  async verifySuccessToast() {
    await Actions.waitForElement(this.transactionSuccess, 40000)
    await Actions.failIfElementAppearsWithin(this.transactionFail)
  }

  async enterAmount(amount: string, index = 0) {
    await delay(500)
    await Actions.setInputText(this.tokenAmountInputField, amount, index)
  }

  async tapNextButton() {
    await Actions.waitForElement(this.nextButton, 8000)
    await Actions.tapElementAtIndex(this.nextButton, 0)
  }

  async tapApproveButton() {
    await Actions.waitForElement(this.approveButton, 20000)
    await Actions.tapElementAtIndex(this.approveButton, 0)
  }

  async selectDropdownItem(item: string) {
    await Actions.scrollListUntil(
      by.id(`${commonElsLoc.dropdownItem}${item}`),
      this.dropdownScrollView,
      100
    )
    await Actions.tap(by.id(`${commonElsLoc.dropdownItem}${item}`))
  }

  async goSettings() {
    await Actions.tap(this.settingsBtn)
  }

  async tapDelete(index = 0) {
    await Actions.waitForElement(this.delete, 10000, index)
    await Actions.tapElementAtIndex(this.delete, index)
  }

  async tapCancel() {
    await Actions.tap(this.cancel)
  }

  async tapRejectButton() {
    await Actions.tap(this.rejectButton)
  }
}

export default new CommonElsPage()
