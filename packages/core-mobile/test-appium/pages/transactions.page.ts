import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import txLoc from '../locators/transactions.loc'

class TransactionsPage {
  get sendButton() {
    return selectors.getById(txLoc.sendButton)
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
    await actions.type(this.amountToSendInput, amount)
  }

  async tapNextButton() {
    await actions.waitFor(this.nextBtn)
    await actions.tap(this.nextBtn)
  }

  async tapApproveButton() {
    await actions.waitFor(this.approveBtn)
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
    await this.tapNextButton()
    await this.tapApproveButton()
  }

  async verifySuccessToast() {
    console.log('verifySuccessToast')
    // await actions.waitFor(this.transactionsuccess, timeout)
  }
}

export default new TransactionsPage()
