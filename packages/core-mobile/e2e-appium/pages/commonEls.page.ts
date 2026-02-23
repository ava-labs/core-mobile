import assert from 'assert'
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import commonEls from '../locators/commonEls.loc'
import portfolioPage from './portfolio.page'
import settingsPage from './settings.page'

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
    return selectors.getByText(commonEls.dismiss)
  }

  get dismissAndroid() {
    return selectors.getByText(commonEls.dismissAndroid)
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

  get saveUpperCase() {
    return selectors.getByText(commonEls.save.toUpperCase())
  }

  get dialogInput() {
    return selectors.getById(commonEls.dialogInput)
  }

  get copy() {
    return selectors.getBySomeText(commonEls.copy)
  }

  get nextBtnById() {
    return selectors.getById(commonEls.nextBtnById)
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

  get deleteUpperCase() {
    return selectors.getByText(commonEls.delete.toUpperCase())
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

  get hkd() {
    return selectors.getByText(commonEls.hkd)
  }

  get successfullyAdded() {
    return selectors.getBySomeText(commonEls.successfullyAdded)
  }

  get loadingSpinnerVisible() {
    return selectors.getById(commonEls.loadingSpinnerVisible)
  }

  get loadingSpinnerHidden() {
    return selectors.getById(commonEls.loadingSpinnerHidden)
  }

  get inProgress() {
    return selectors.getByText(commonEls.inProgress)
  }

  get keypadUpButton() {
    return selectors.getById(commonEls.keypadUpButton)
  }

  listItem(name: string) {
    return selectors.getById(`list_item__${name}`)
  }

  async filter(
    item = commonEls.cChain_2,
    filterDropdown = this.filterDropdown
  ) {
    await actions.click(filterDropdown)
    await this.selectDropdownItem(item)
  }

  async selectDropdown(name: string, dropdownItem: string) {
    await actions.click(selectors.getById(`${name}_dropdown_btn`))
    await this.selectDropdownItem(dropdownItem)
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
    await actions.tapEnterOnKeyboard()
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

  async goAndroidBack() {
    await driver.back()
  }

  async goBack(nxtEle: ChainablePromiseElement | undefined = undefined) {
    await actions.delay(1000)
    try {
      await actions.click(this.backButton)
    } catch (e) {
      if (nxtEle) {
        await actions.tap(this.backButton, nxtEle)
      } else {
        await actions.tap(this.backButton)
      }
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
      await actions.tap(this.nextBtnById)
    }
  }

  async tapNextBtnById() {
    await actions.tap(this.nextBtnById)
  }

  async dismissBottomSheet(element = this.grabber) {
    await actions.delay(1000)
    const backBtn =
      !(await actions.getVisible(element)) &&
      (await actions.getVisible(this.backButton))
    if (backBtn) {
      await actions.tap(this.backButton)
    }
    await actions.waitFor(element, 30000)
    await actions.dragAndDrop(element, [0, 1500])
    await actions.delay(1000)
    console.log('Dismissed bottom sheet')
  }

  async pullToRefresh(ele = this.filterDropdown) {
    await actions.dragAndDrop(ele, [0, 1000])
  }

  async visibleDropdown(name: string, isVisible = true) {
    if (isVisible) {
      await actions.waitFor(selectors.getById(`${name}_dropdown_btn`))
    } else {
      await actions.isNotVisible(selectors.getById(`${name}_dropdown_btn`))
    }
  }

  async tapCopyPhrase() {
    await actions.tap(this.copyPhrase)
  }

  async tapSave() {
    await actions.click(this.save)
  }

  async tapSaveAlert() {
    if (driver.isIOS) {
      try {
        await actions.click(selectors.getById(commonEls.save))
      } catch (e) {
        console.log('Appium handled the auto accept alerts')
      }
    } else {
      await actions.click(selectors.getBySmartText(commonEls.save))
    }
  }

  async tapDeleteAlert() {
    if (driver.isIOS) {
      try {
        await actions.click(selectors.getById(commonEls.delete))
      } catch (e) {
        console.log('Appium handled the auto accept alerts')
      }
    } else {
      await actions.click(selectors.getBySmartText(commonEls.delete))
    }
  }

  async tapRemoveAlert() {
    if (driver.isIOS) {
      try {
        await actions.click(selectors.getById(commonEls.remove))
      } catch (e) {
        console.log('Appium handled the auto accept alerts')
      }
    } else {
      await actions.click(selectors.getBySmartText(commonEls.remove))
    }
  }

  async verifyAccountName(expectedName: string, whichScreen = 'settings') {
    await actions.waitFor(selectors.getByText(expectedName), 30000)
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

  async selectDropdownItem(item: string, dropdown = this.filterDropdown) {
    const ele = selectors.getBySomeText(item)
    if (await actions.getVisible(ele)) {
      await actions.click(ele)
    } else {
      await actions.click(dropdown)
      await actions.tap(ele)
    }
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

  async switchAccount(
    account = commonEls.secondAccount,
    walletName = 'Wallet 1'
  ) {
    await this.goMyWallets()
    await settingsPage.tapAccount(account, walletName)
  }

  async goMyWallets() {
    await actions.tap(portfolioPage.portfolioAccountName)
  }
}

export default new CommonElsPage()
