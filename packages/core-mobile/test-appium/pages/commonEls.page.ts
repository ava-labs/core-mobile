import assert from 'assert'
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import commonEls from '../locators/commonEls.loc'

class CommonElsPage {
  get retryBtn() {
    return selectors.getByText(commonEls.retryBtn)
  }

  get backButton() {
    return selectors.getById(commonEls.backButton)
  }

  get getStartedButton() {
    return selectors.getByText(commonEls.getStartedBtn)
  }

  get inputTextField() {
    return selectors.getById(commonEls.inputTextField)
  }

  get simpleToastMsg() {
    return selectors.getById(commonEls.simpleToastMsg)
  }

  get jailbrokenWarning() {
    return selectors.getById(commonEls.jailbrokenWarning)
  }

  get testnetBanner() {
    return selectors.getById(commonEls.testnetBanner)
  }

  get notNow() {
    return selectors.getByText(commonEls.notNow)
  }

  get turnOnNotifications() {
    return selectors.getByText(commonEls.turnOnNotifications)
  }

  get searchBar() {
    return selectors.getById(commonEls.searchBar)
  }

  get bitcoinSVG() {
    return selectors.getById(commonEls.bitcoinSVG)
  }

  get avaSVG() {
    return selectors.getById(commonEls.avaSVG)
  }

  get reloadSVG() {
    return selectors.getById(commonEls.reloadSVG)
  }

  get carrotSVG() {
    return selectors.getById(commonEls.carrotSVG)
  }

  get calendarSVG() {
    return selectors.getById(commonEls.calendarSVG)
  }

  get updateAppModalTitle() {
    return selectors.getById(commonEls.updateAppModalTitle)
  }

  get datePicker() {
    return selectors.getById(commonEls.datePicker)
  }

  get okBtn() {
    return selectors.getByText(commonEls.okBtn)
  }

  get next() {
    return selectors.getByText(commonEls.next)
  }

  get dismiss() {
    const theBtn = driver.isIOS ? commonEls.dismiss : commonEls.dismissAndroid
    return selectors.getByText(theBtn)
  }

  get grabber() {
    return selectors.getById(commonEls.grabber)
  }

  get cChain() {
    return selectors.getByText(commonEls.cChain)
  }

  get pChain() {
    return selectors.getByText(commonEls.pChain)
  }

  get xChain() {
    return selectors.getByText(commonEls.xChain)
  }

  get xpChain() {
    return selectors.getByText(commonEls.xpChain)
  }

  get ethereum() {
    return selectors.getByText(commonEls.ethereum)
  }

  get evm() {
    return selectors.getByText(commonEls.evm)
  }

  get bitcoin() {
    return selectors.getByText(commonEls.bitcoin)
  }

  get solana() {
    return selectors.getByText(commonEls.solana)
  }

  get bitcoinNetwork() {
    return selectors.getByText(commonEls.bitcoinNetwork)
  }

  get balanceHeaderAccountName() {
    return selectors.getById(commonEls.balanceHeaderAccountName)
  }

  get pinInputField() {
    return selectors.getById(commonEls.pinInputField)
  }

  get copied() {
    return selectors.getByText(commonEls.copied)
  }

  get copyPhrase() {
    return selectors.getByText(commonEls.copyPhrase)
  }

  get save() {
    return selectors.getByText(commonEls.save)
  }

  get dialogInput() {
    return selectors.getById(commonEls.dialogInput)
  }

  get copy() {
    return selectors.getBySomeText(commonEls.copy)
  }

  get nextButton() {
    return selectors.getById(commonEls.nextBtn)
  }

  get approveButton() {
    return selectors.getById(commonEls.approveBtn)
  }

  get rejectButton() {
    return selectors.getById(commonEls.rejectBtn)
  }

  get insufficientBalance() {
    return selectors.getByText(commonEls.insufficientBalance)
  }

  get selectNetworkBitcoin() {
    return selectors.getById(commonEls.selectNetworkBitcoin)
  }

  get selectNetworkCChainEVM() {
    return selectors.getById(commonEls.selectNetworkCChainEVM)
  }

  get selectNetworkXPChain() {
    return selectors.getById(commonEls.selectNetworkXPChain)
  }

  get evmNetwork() {
    return selectors.getByText(commonEls.evmNetwork)
  }

  get XPNetwork() {
    return selectors.getByText(commonEls.XPNetwork)
  }

  get transactionOnboardingNext() {
    return selectors.getById(commonEls.transactionOnboardingNext)
  }

  get tokenAmountInputField() {
    return selectors.getById(commonEls.tokenAmountInputField)
  }

  get transactionsuccess() {
    return selectors.getByText(commonEls.transactionSuccess)
  }

  get transactionFail() {
    return selectors.getByText(commonEls.transactionFail)
  }

  get dropdownScrollView() {
    return selectors.getById(commonEls.dropdownScrollView)
  }

  get settingsBtn() {
    return selectors.getById(commonEls.settingsBtn)
  }

  get delete() {
    return selectors.getByText(commonEls.delete)
  }

  get cancel() {
    return selectors.getByText(commonEls.cancel)
  }

  get approvePopupTitle() {
    return selectors.getByText(commonEls.approvePopupTitle)
  }

  get approvePopupSpendTitle() {
    return selectors.getByText(commonEls.approvePopupSpendTitle)
  }

  get filterDropdown() {
    return selectors.getById(commonEls.filterDropdown)
  }

  get networkFilterDropdown() {
    return selectors.getById(commonEls.networkFilterDropdown)
  }

  get gotIt() {
    return selectors.getByText(commonEls.gotIt)
  }

  get solanaLaunchTitle() {
    return selectors.getById(commonEls.solanaLaunchTitle)
  }

  get accountOne() {
    return selectors.getByText(commonEls.accountOne)
  }

  async filter(
    item = commonEls.cChain_2,
    filterDropdown = this.filterDropdown
  ) {
    await actions.click(filterDropdown)
    await this.selectDropdownItem(item)
    console.log('3 done selecting dropdown item')
  }

  async getBalanceHeaderAccountName(whichScreen: string) {
    return await actions.getText(
      selectors.getById(`${whichScreen}__${commonEls.balanceHeaderAccountName}`)
    )
  }

  async tapCarrotSVG() {
    await actions.tap(this.carrotSVG)
  }

  async typeSearchBar(text: string, searchBar = this.searchBar) {
    await actions.type(searchBar, text)
  }

  async tapBackButton() {
    await actions.tap(this.backButton)
  }

  async tapGetStartedButton() {
    await actions.tap(this.getStartedButton)
  }

  async enterTextInput(inputText: string) {
    await actions.type(this.inputTextField, inputText)
  }

  async clearSearchBar() {
    await actions.clearText(this.searchBar)
    await actions.tap(this.cancel)
  }

  async waitForJailbrokenWarning() {
    await actions.waitFor(this.jailbrokenWarning)
  }

  async tapRetryBtn() {
    await actions.waitFor(this.retryBtn)
    try {
      await actions.tap(this.retryBtn)
    } catch (error) {
      /* empty */
    }
  }

  async tapDeviceBackButton() {
    await driver.back()
  }

  async goBack() {
    await actions.delay(1000)
    try {
      await actions.tap(this.backButton)
    } catch (e) {
      await actions.tap(this.backButton)
    }
    await actions.delay(1500)
  }

  async tapDropdownItem(item: string) {
    await actions.waitFor(selectors.getById(`dropdown_item__${item}`))
    await actions.tap(selectors.getById(`dropdown_item__${item}`))
  }

  async tapNotNow() {
    try {
      await actions.tap(this.notNow)
    } catch (e) {
      console.log('Not now button not found')
    }
  }

  async tapTurnOnNotifications() {
    await actions.tap(this.turnOnNotifications)
  }

  async tapAvaSVG() {
    await actions.tap(this.avaSVG)
  }

  async tapBitcoinSVG() {
    await actions.tap(this.bitcoinSVG)
  }

  async tapReloadSVG() {
    await actions.tap(this.reloadSVG)
  }

  async tapNext() {
    try {
      await actions.tap(this.next)
    } catch (e) {
      await actions.tap(this.nextButton)
    }
  }

  async dismissBottomSheet(element = this.grabber) {
    await actions.waitFor(element, 20000)
    await actions.dragAndDrop(this.grabber, [0, 1500])
  }

  async selectDropdown(name: string, dropdownItem: string) {
    await actions.tap(selectors.getById(`${name}_dropdown_btn`))
    await actions.tap(selectors.getById(`dropdown_item__${dropdownItem}`))
  }

  async visibleDropdown(name: string, isVisible = true) {
    if (isVisible) {
      await actions.waitFor(selectors.getById(`${name}_dropdown_btn`))
    } else {
      await actions.isVisible(selectors.getById(`${name}_dropdown_btn`), false)
    }
  }

  async tapCopyPhrase() {
    await actions.tap(this.copyPhrase)
  }

  async tapSave() {
    await actions.waitFor(this.save)
    await actions.tap(this.save)
  }

  async verifyAccountName(expectedName: string, whichScreen = 'settings') {
    const UIaccountName = await this.getBalanceHeaderAccountName(whichScreen)
    assert(
      expectedName === UIaccountName,
      `Account name mismatch: ${expectedName} !== ${UIaccountName}`
    )
  }

  async tapApproveButton() {
    await actions.waitFor(this.approveButton, 20000)
    await actions.tap(this.approveButton)
  }

  async selectDropdownItem(item: string) {
    const xpath = driver.isIOS
      ? `//XCUIElementTypeCell//*[contains(@name, "${item}")]`
      : `//android.widget.ListView//*[contains(@text, "${item}")]`
    const ele = selectors.getByXpath(xpath)
    await actions.tap(ele)
  }

  async goSettings() {
    await actions.tap(this.settingsBtn)
  }

  async tapDelete() {
    await actions.waitFor(this.delete, 10000)
    await actions.tap(this.delete)
  }

  async tapCancel() {
    await actions.tap(this.cancel)
  }

  async tapRejectButton() {
    await actions.tap(this.rejectButton)
  }

  async tapGotIt(gotItIsVisible = true) {
    if (gotItIsVisible) {
      await actions.delay(2000)
      await this.dismissBottomSheet()
    }
  }

  async tapCopy() {
    await actions.tap(this.copy)
    await actions.waitForDisplayed(this.copied)
  }
}

export default new CommonElsPage()
