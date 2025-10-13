/* eslint-disable max-params */
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import txLoc from '../locators/transactions.loc'

class TransactionsPage {
  get sendButton() {
    return selectors.getById(txLoc.sendButton)
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

  get nextBtn() {
    return selectors.getById(txLoc.nextBtn)
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
    return selectors.getByText(txLoc.tokenSpendApproval)
  }

  get errorMsg() {
    return selectors.getByText(txLoc.errorMsg)
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
    await actions.tap(this.sendButton)
  }

  async tapSwap() {
    await actions.tap(this.swapButton)
  }

  async goToSelectTokenList() {
    await actions.tap(this.sendSelectTokenListBtn)
    await actions.tap(this.selectTokenTitle)
  }

  async selectToken(
    tokenName: string,
    network: string | undefined = undefined
  ) {
    if (network) {
      await actions.tap(selectors.getById(`network_selector__${network}`))
    }
    await actions.type(this.searchBar, tokenName)
    await actions.tap(selectors.getById(`token_selector__${tokenName}`))
  }

  async enterSendAmount(amount: string) {
    try {
      await actions.type(this.amountToSendInput, amount)
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

  async send(
    token: string | undefined,
    amount: string,
    account = txLoc.accountTwo
  ) {
    await this.tapSend()
    await this.dismissTransactionOnboarding()
    await this.typeSearchBar(account)
    await actions.tap(selectors.getById(`recent_contacts__${account}`))
    if (token) {
      await this.goToSelectTokenList()
      await this.selectToken(token)
      console.log(`sending ${token} ${amount}....`)
    }
    await this.enterSendAmount(amount)
    await this.tapNext()
    await this.tapApprove()
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

  async swap(
    from: string,
    to: string,
    amount = '0.000001',
    network = txLoc.cChain
  ) {
    // Go to swap form
    await this.tapSwap()
    await this.dismissTransactionOnboarding()

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

    // Enter input
    await this.enterAmountAndAdjust(amount)
    await this.tapNext()

    // If `from` is not AVAX, we need to approve the spend limit
    if (from !== 'AVAX') {
      try {
        await actions.waitFor(this.tokenSpendApproval)
        await this.tapApprove()
      } catch (e) {
        console.log('Spend limit approval is not needed')
      }
    }
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
}

export default new TransactionsPage()
