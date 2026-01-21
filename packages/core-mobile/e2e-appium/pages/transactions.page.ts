/* eslint-disable max-params */
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import txLoc from '../locators/transactions.loc'
import browserPage from './browser.page'
import commonElsPage from './commonEls.page'
import portfolioPage from './portfolio.page'

class TransactionsPage {
  get sendButton() {
    return selectors.getById(txLoc.sendButton)
  }

  get receiveButton() {
    return selectors.getById(txLoc.receiveButton)
  }

  get buyButton() {
    return selectors.getById(txLoc.buyButton)
  }

  get bridgeButton() {
    return selectors.getById(txLoc.bridgeButton)
  }

  get withdrawButton() {
    return selectors.getById(txLoc.withdrawButton)
  }

  get swapButton() {
    return selectors.getById(txLoc.swapButton)
  }

  get swapText() {
    return selectors.getByText(txLoc.swapText)
  }

  get trendingDetailSwapBtn() {
    return selectors.getById(txLoc.trendingDetailSwapBtn)
  }

  get swapVerticalIcon() {
    return selectors.getById(txLoc.swapVerticalIcon)
  }

  get transactionOnboardingNext() {
    return selectors.getById(txLoc.transactionOnboardingNext)
  }

  get searchBar() {
    return selectors.getById(txLoc.searchBar)
  }

  get selectTokenTitle() {
    return selectors.getByText(txLoc.selectTokenTitle)
  }

  get sendSelectTokenListBtn() {
    return selectors.getById(txLoc.sendSelectTokenListBtn)
  }

  get approveBtn() {
    return selectors.getById(txLoc.approveBtn)
  }

  get amountToSendInput() {
    return selectors.getById(txLoc.amountToSend)
  }

  get amountToStakeInput() {
    return selectors.getById(txLoc.amountToStake)
  }

  get nextBtn() {
    return selectors.getById(txLoc.nextBtn)
  }

  get nextBtnDisabled() {
    return selectors.getById(txLoc.nextBtnDisabled)
  }

  get transactionsuccess() {
    return selectors.getByText(txLoc.transactionSuccess)
  }

  get youPay() {
    return selectors.getById(txLoc.youPay)
  }

  get youReceive() {
    return selectors.getById(txLoc.youReceive)
  }

  get tokenSpendApproval() {
    return selectors.getByText(txLoc.approvePopupSpendTitle)
  }

  get approveTitle() {
    return selectors.getByText(txLoc.approvePopupTitle)
  }

  get errorMsg() {
    return selectors.getById(txLoc.errorMsg)
  }

  get receiveCryptoTitle() {
    return selectors.getByText(txLoc.receiveCryptoTitle)
  }

  get receiveCryptoSubtitle() {
    return selectors.getBySomeText(txLoc.receiveCryptoSubtitle)
  }

  get receiveQrCode() {
    return selectors.getById(txLoc.receiveQrCode)
  }

  get selectReceiveNetwork() {
    return selectors.getById(txLoc.selectReceiveNetwork)
  }

  get selectOtherTokenBtn() {
    return selectors.getById(txLoc.selectOtherTokenBtn)
  }

  get evmSupportedAddressText() {
    return selectors.getById(txLoc.evmSupportedAddressText)
  }

  get countrySelector() {
    return selectors.getById(txLoc.countrySelector)
  }

  get currencySelector() {
    return selectors.getById(txLoc.currencySelector)
  }

  get addStakeCard() {
    return selectors.getById(txLoc.addStakeCard)
  }

  get claimCard() {
    return selectors.getById(txLoc.claimCard)
  }

  get claimNow() {
    return selectors.getById(txLoc.claimNow)
  }

  get reviewStakeTitle() {
    return selectors.getBySomeText(txLoc.reviewStakeTitle)
  }

  async tapSelectTokenTitle() {
    await actions.tap(this.selectTokenTitle)
  }

  async typeSearchBar(text: string) {
    await actions.type(this.searchBar, text)
  }

  async dismissTransactionOnboarding() {
    try {
      await actions.tap(this.transactionOnboardingNext)
    } catch (e) {
      console.log('Transaction onboarding not found')
    }
  }

  async tapSend() {
    await actions.waitFor(this.sendButton, 40000)
    await actions.tap(this.sendButton)
  }

  async tapReceive() {
    await actions.waitFor(this.receiveButton, 40000)
    await actions.tap(this.receiveButton)
  }

  async tapBuy() {
    await actions.waitFor(this.buyButton, 40000)
    await actions.tap(this.buyButton)
  }

  async tapWithdraw() {
    await actions.waitFor(this.receiveButton, 40000)
    await actions.dragAndDrop(this.receiveButton, [-500, 0])
    await actions.tap(this.withdrawButton)
  }

  async tapSwap() {
    await actions.waitFor(this.swapButton, 40000)
    await actions.tap(this.swapButton)
  }

  async goToSelectTokenList() {
    await actions.tap(this.sendSelectTokenListBtn)
  }

  async selectToken(
    tokenName: string,
    network: string | undefined = undefined
  ) {
    if (network) {
      await actions.tap(selectors.getById(`network_selector__${network}`))
    }
    await actions.type(this.searchBar, tokenName)
    try {
      await actions.tap(selectors.getById(`token_selector__${tokenName}`))
    } catch (e) {
      await actions.typeSlowly(this.searchBar, tokenName)
      await actions.tap(selectors.getById(`token_selector__${tokenName}`))
    }
  }

  async enterSendAmount(amount: string) {
    try {
      await actions.typeSlowly(this.amountToSendInput, amount)
    } catch (e) {
      await actions.tapNumberPad(amount)
    }
  }

  get insufficientSendBalance() {
    return selectors.getByText(txLoc.insufficientSendBalance)
  }

  async enterStakingAmount(amount: string) {
    try {
      await actions.type(this.amountToStakeInput, amount)
    } catch (e) {
      await actions.tapNumberPad(amount)
    }
  }

  async tapNext() {
    await actions.waitFor(this.nextBtn)
    await actions.tap(this.nextBtn)
  }

  async tapApprove() {
    await actions.waitFor(this.approveBtn, 40000)
    await actions.tap(this.approveBtn)
  }

  async tapRecentAccount(account: string) {
    await actions.tap(selectors.getById(`recent_contacts__${account}`))
  }

  async send(
    token: string | undefined,
    amount: string,
    account = txLoc.accountTwo
  ) {
    await this.tapSend()
    await this.dismissTransactionOnboarding()
    await this.typeSearchBar(account)
    await this.tapRecentAccount(account)
    if (token) {
      await this.goToSelectTokenList()
      await this.selectToken(token)
      console.log(`sending ${token} ${amount}....`)
    }
    await this.enterSendAmount(amount)
    const isInsufficientBalance = await this.checkInsufficientBalance()
    if (isInsufficientBalance) {
      await commonElsPage.dismissBottomSheet()
    } else {
      await this.tapNext()
      await this.tapApprove()
    }
  }

  async checkInsufficientBalance() {
    return await actions.getVisible(this.insufficientSendBalance)
  }

  async tapAddStakeCard() {
    await actions.longPress(this.addStakeCard, this.transactionOnboardingNext)
  }

  async tapClaimCard() {
    await actions.longPress(this.claimCard)
  }

  async tapClaimNow() {
    await actions.waitFor(this.claimNow, 40000)
    await actions.tap(this.claimNow)
  }

  async selectDuration(duration: string) {
    if (duration !== '1 Day') {
      await actions.tap(commonElsPage.listItem(txLoc.duration))
      await actions.tap(selectors.getBySomeText(duration))
    }
  }

  async tapConfirmStake() {
    await actions.tap(selectors.getById(txLoc.confirmStake))
  }

  async stake(amount = '1', duration = '1 Day') {
    await this.tapAddStakeCard()
    await this.dismissTransactionOnboarding()
    await this.enterStakingAmount(amount)
    await this.tapNext()
    await this.selectDuration(duration)
    await this.tapNext()
    await this.tapConfirmStake()
    await actions.waitForNotVisible(this.reviewStakeTitle)
  }

  async claim() {
    if (await actions.getVisible(this.claimCard)) {
      await this.tapClaimCard()
      await this.tapClaimNow()
    } else {
      await actions.isNotVisible(this.claimCard)
    }
  }

  async verifySuccessToast() {
    console.log('verifySuccessToast')
    // await actions.waitFor(this.transactionsuccess, timeout)
  }

  async tapSelectToken() {
    await actions.tap(this.selectTokenTitle)
  }

  async tapYouPay() {
    await actions.tap(this.swapText)
    await actions.click(this.youPay)
  }

  async tapYouReceive() {
    await actions.click(this.youReceive)
  }

  async adjustAmount(amount: string) {
    return (parseFloat(amount) * 10).toFixed(10).replace(/\.?0+$/, '')
  }

  async enterAmountAndAdjust(amount: string) {
    await this.enterSendAmount(amount)
    let tryCount = 5
    let newAmount = amount

    while (await actions.getVisible(this.errorMsg)) {
      newAmount = await this.adjustAmount(newAmount)
      await this.enterSendAmount(newAmount)
      tryCount--
      if ((await actions.getVisible(this.nextBtn)) || tryCount === 0) {
        break
      }
    }
  }

  async tapSwapVerticalIcon() {
    await actions.tap(this.swapText)
    await actions.click(this.swapVerticalIcon)
  }

  async swapViaTokenDetail(
    network: string,
    fromToken: string,
    toToken: string,
    amount = '0.000001'
  ) {
    await commonElsPage.filter(network)
    await portfolioPage.tapToken(fromToken)
    await this.tapSwap()
    await this.dismissTransactionOnboarding()
    await this.enterAmountAndAdjust(amount)
    // Select To Token
    if (toToken !== 'USDC') {
      await this.tapYouReceive()
      await this.selectToken(toToken, network)
    }
    await this.tapNext()
    // If `fromToken` is not AVAX AND network is C-Chain, we need to approve the spend limit
    if (fromToken !== 'AVAX' || network !== txLoc.solana) {
      try {
        await actions.waitFor(this.tokenSpendApproval, 30000)
        await this.tapApprove()
      } catch (e) {
        console.log('Spend limit approval is not needed')
      }
    }
    await actions.waitFor(this.approveTitle, 40000)
    await this.tapApprove()
  }

  async swap(
    from: string,
    to: string,
    amount = '0.000001',
    network = txLoc.cChain
  ) {
    // Go to swap form
    await this.tapSwap()
    await this.dismissTransactionOnboarding()

    // Enter input
    await this.enterAmountAndAdjust(amount)

    // select tokens
    if (from === 'USDC' && to === 'AVAX') {
      await this.tapSwapVerticalIcon()
    } else {
      // Select From Token
      if (from !== 'AVAX') {
        await this.tapYouPay()
        await this.selectToken(from, network)
      }

      // Select To Token
      if (to !== 'USDC') {
        await this.tapYouReceive()
        await this.selectToken(to, network)
      }
      console.log(`swapping ${from} to ${to}...`)
    }

    await this.tapNext()

    // If `from` is not AVAX, we need to approve the spend limit
    if (from !== 'AVAX') {
      try {
        await actions.waitFor(this.tokenSpendApproval, 30000)
        await this.tapApprove()
      } catch (e) {
        console.log('Spend limit approval is not needed')
      }
    }
    await actions.waitFor(this.approveTitle, 40000)
    await this.tapApprove()
  }

  async tapTrackBuyBtn(index = 1) {
    await actions.tap(selectors.getById(txLoc.trackBuyBtn + index))
    try {
      await actions.tap(this.trendingDetailSwapBtn)
    } catch (e) {
      console.log('Trending detail swap button not found')
    }
  }

  async swapOnTrack(index = 1, amount = '0.000001') {
    await this.tapTrackBuyBtn(index)
    await this.dismissTransactionOnboarding()
    await this.enterAmountAndAdjust(amount)
    await this.tapNext()
    await this.tapApprove()
    await this.verifySuccessToast()
  }

  async sendNft(nftName = 'ABC', account = txLoc.accountTwo) {
    await this.tapNftByName(nftName)
    await portfolioPage.swipeUpForNftDetails()
    await this.tapSend()
    await this.dismissTransactionOnboarding()
    await this.typeSearchBar(account)
    await this.tapRecentAccount(account)
    await this.tapApprove()
  }

  async tapNftByName(nftName = 'ABC') {
    const ele = selectors.getById(`collectible_name__${nftName}`)
    await actions.waitFor(ele, 40000)
    await actions.click(ele)
  }

  async verifyReceiveScreen(network: string, address: string) {
    await actions.waitFor(this.receiveCryptoTitle)
    await actions.isVisible(this.receiveCryptoSubtitle)
    await actions.isVisible(this.receiveQrCode)
    await actions.isVisible(this.selectReceiveNetwork)
    await actions.isVisible(selectors.getById(`copy_btn__${network}`))
    await actions.isVisible(selectors.getById(`receive_address__${address}`))
    await actions.isVisible(selectors.getById(`receive_network__${network}`))
    await actions.isVisible(selectors.getByText(network))
    if (network === txLoc.evmNetwork) {
      await actions.isVisible(this.evmSupportedAddressText)
    }
  }

  async selectNetwork(network: string) {
    await actions.tap(this.selectReceiveNetwork)
    await actions.tap(selectors.getById(`select_network__${network}`))
  }

  async buy(token: string) {
    const amounts = [100, 200, 500]
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)]
    await this.tapBuy()
    await this.tapNext()
    const tokenEle = selectors.getById(`list_item__${token}`)
    if (!(await actions.getVisible(tokenEle))) {
      await actions.tap(this.selectOtherTokenBtn)
      await actions.type(commonElsPage.searchBar, token)
      await actions.tap(selectors.getById(`token_selector__${token}`))
    } else {
      await actions.tap(selectors.getById(`list_item__${token}`))
    }
    await actions.tap(selectors.getById(`fiat_amount_button__${randomAmount}`))
    await actions.tap(this.nextBtn)
    await browserPage.tapClose()
    await commonElsPage.dismissBottomSheet()
  }

  async withdraw(token = 'AVAX') {
    await this.tapWithdraw()
    await this.tapNext()
    await actions.tap(selectors.getById(`list_item__${token}`))
    await actions.type(selectors.getById('fiat_amount_input'), '100')
    await actions.waitFor(this.errorMsg)
    await actions.isNotVisible(this.nextBtn)
    await actions.isVisible(this.nextBtnDisabled)
    await commonElsPage.dismissBottomSheet()
  }

  async verifyLocale(locale: string, currency: string) {
    await actions.waitFor(selectors.getById(`right_value__${locale}`), 20000)
    await actions.waitFor(selectors.getById(`right_value__${currency}`), 20000)
  }

  async setLocale(locale: string, currency: string) {
    await actions.tap(this.countrySelector)
    await actions.type(commonElsPage.searchBar, locale)
    await actions.tap(selectors.getById(`select_country__${locale}`))
    await actions.tap(this.currencySelector)
    await actions.type(commonElsPage.searchBar, currency)
    await actions.tap(selectors.getById(`currency__${currency}`))
    await this.verifyLocale(locale, currency)
  }
}

export default new TransactionsPage()
