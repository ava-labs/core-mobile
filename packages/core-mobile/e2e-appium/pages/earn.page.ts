import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import earnLoc from '../locators/earn.loc'
import txPage from './transactions.page'
import commonElsPage from './commonEls.page'
import bottomTabsPage from './bottomTabs.page'

class EarnPage {
  get depositFormTitle() {
    return selectors.getByText(earnLoc.depositFormTitle)
  }

  get withdrawFormTitle() {
    return selectors.getByText(earnLoc.withdrawFormTitle)
  }

  get earnSubtitle() {
    return selectors.getByText(earnLoc.earnSubtitle)
  }

  withdrawBtn(marketName: string, token: string) {
    return selectors.getById(`withdraw_btn__${marketName}__${token}`)
  }

  selectTokenBtn(tokenSymbol: string) {
    return selectors.getById(`depositOrBuy__${tokenSymbol}`)
  }

  pool(poolName: string) {
    return selectors.getById(`protocol_logo__${poolName}`)
  }

  async selectAsset(tokenSymbol: string) {
    await actions.tap(this.selectTokenBtn(tokenSymbol))
  }

  async selectPool(poolName = 'aave') {
    console.log(`Selecting pool: ${poolName}`)
    await actions.tap(this.pool(poolName))
  }

  async enterAmount(amount: string) {
    await actions.type(txPage.amountInput, amount)
  }

  async deposit(token = 'AVAX', amount = '0.0001', pool?: string) {
    console.log(`Depositing ${amount} ${token} to ${pool ?? 'random pool'}...`)
    await bottomTabsPage.tapEarnTab()
    await actions.delay(1000)
    await txPage.tapAddCard()
    await txPage.dismissTransactionOnboarding()
    await this.selectAsset(token)
    await this.selectPool(pool)
    await this.enterAmount(amount)
    await txPage.tapAddCard()
    await txPage.tapNext()
    if (token !== 'AVAX') {
      await txPage.approveSpendLimitIfNeeded()
    }
    await txPage.tapApprove()
    await txPage.verifySuccessToast()
  }

  async tapWithdraw(marketName: string, token: string) {
    await actions.click(this.withdrawBtn(marketName, token))
  }

  async withdraw(amount = 'max', marketName = 'aave', token = 'AVAX') {
    console.log(`Withdrawing ${amount}...`)
    await bottomTabsPage.tapEarnTab()
    await actions.delay(1000)
    await this.tapWithdraw(marketName, token)
    if (amount.toLowerCase() === 'max') {
      await txPage.tapMax()
      await txPage.tapAddCard()
    } else {
      await this.enterAmount(amount)
    }
    await txPage.tapNext()
    await txPage.tapApprove()
    await txPage.verifySuccessToast()
  }
}

export default new EarnPage()
