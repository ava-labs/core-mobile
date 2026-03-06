import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import earnLoc from '../locators/earn.loc'
import txPage from './transactions.page'
import bottomTabsPage from './bottomTabs.page'

class EarnPage {
  get earnSubtitle() {
    return selectors.getByText(earnLoc.earnSubtitle)
  }

  get depositDetailsTitle() {
    return selectors.getByText(earnLoc.depositDetailsTitle)
  }

  get depositDetailLending() {
    return selectors.getByText(earnLoc.depositDetailLending)
  }

  get depositDetailSupplied() {
    return selectors.getByText(earnLoc.depositDetailSupplied)
  }

  get depositDetailCurrentApy() {
    return selectors.getByText(earnLoc.depositDetailCurrentApy)
  }

  get borrowOn() {
    return selectors.getByText(earnLoc.borrowOn)
  }

  get borrowDetailsTitle() {
    return selectors.getByText(earnLoc.borrowDetailsTitle)
  }

  get borrowDetailBorrowApy() {
    return selectors.getByText(earnLoc.borrowDetailBorrowApy)
  }

  get borrowDetailCollateralApy() {
    return selectors.getByText(earnLoc.borrowDetailCollateralApy)
  }

  get borrowDetailNetApy() {
    return selectors.getByText(earnLoc.borrowDetailNetApy)
  }

  get borrowDetailBorrowed() {
    return selectors.getByText(earnLoc.borrowDetailBorrowed)
  }

  get borrowDetailCollateral() {
    return selectors.getByText(earnLoc.borrowDetailCollateral)
  }

  get borrowDetailRepayBtn() {
    return selectors.getById(earnLoc.borrowDetailRepayBtn)
  }

  get borrowTab() {
    return selectors.getById(earnLoc.borrowTab)
  }

  get selectDepositsToUseAsCollateralTitle() {
    return selectors.getByText(earnLoc.selectDepositsToUseAsCollateralTitle)
  }

  selectDepositTokenBtn(tokenSymbol: string) {
    return selectors.getById(`depositOrBuy__${tokenSymbol}`)
  }

  selectBorrowTokenBtn(tokenSymbol: string) {
    return selectors.getById(`borrow_asset__${tokenSymbol}`)
  }

  pool(poolName: string) {
    return selectors.getById(`protocol_logo__${poolName}`)
  }

  withdrawBtn(pool: string, token: string) {
    return selectors.getById(`withdraw_btn__${pool}__${token}`)
  }

  repayBtn(pool: string, token: string) {
    return selectors.getById(`repay_btn__${pool}__${token}`)
  }

  depositCard(pool: string, token: string) {
    return selectors.getById(`deposit_card__${pool}__${token}`)
  }

  borrowCard(pool: string, token: string) {
    return selectors.getById(`borrow_card__${pool}__${token}`)
  }

  async selectDepositAsset(tokenSymbol: string) {
    await actions.tap(this.selectDepositTokenBtn(tokenSymbol))
  }

  async selectBorrowAsset(tokenSymbol: string) {
    await actions.tap(this.selectBorrowTokenBtn(tokenSymbol))
  }

  async selectPool(poolName = 'aave') {
    console.log(`Selecting pool: ${poolName}`)
    await actions.tap(this.pool(poolName))
  }

  async enterAmount(amount: string) {
    await actions.type(txPage.amountInput, amount)
  }

  async borrow(pool = 'aave', token = 'AVAX') {
    console.log(`Borrowing ${token} from ${pool}...`)
    await this.goBorrow()
    await txPage.tapAddCard()
    await txPage.dismissTransactionOnboarding()
    await actions.waitFor(this.selectDepositsToUseAsCollateralTitle)
    await txPage.tapNext()
    await this.selectBorrowAsset(token)
    await txPage.tapMax()
    await txPage.tapAddCard()
    await txPage.tapNext()
    await txPage.tapApprove()
    if (token === 'AVAX') {
      await txPage.tapApprove()
    }
    await txPage.verifySuccessToast()
  }

  async deposit(pool: string, token = 'AVAX', amount = '0.0001') {
    console.log(`Depositing ${amount} ${token} to ${pool ?? 'random pool'}...`)
    await bottomTabsPage.tapEarnTab()
    await actions.delay(1000)
    await txPage.tapAddCard()
    await txPage.dismissTransactionOnboarding()
    await this.selectDepositAsset(token)
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

  async tapWithdraw(pool: string, token: string) {
    await actions.click(this.withdrawBtn(pool, token))
  }

  async tapDepositCard(pool: string, token: string) {
    await bottomTabsPage.tapEarnTab()
    await actions.tap(this.depositCard(pool, token))
  }

  async verifyDepositDetail(token: string, pool: string) {
    const assetProtocolLabel = `${token} on ${pool}`
    await actions.waitFor(selectors.getByText(assetProtocolLabel))
    await actions.isVisible(this.depositDetailLending)
    await actions.isVisible(this.depositDetailSupplied)
    await actions.isVisible(this.depositDetailCurrentApy)
    await actions.isVisible(this.withdrawBtn(pool, token))
  }

  async goBorrow() {
    await bottomTabsPage.tapEarnTab()
    await actions.tap(this.borrowTab)
    await actions.waitFor(this.borrowOn)
  }

  async tapBorrowCard(pool = 'aave', token = 'AVAX') {
    await actions.tap(this.borrowCard(pool, token))
  }

  async verifyBorrowDetail() {
    await actions.waitFor(this.borrowDetailsTitle)
    await actions.isVisible(this.borrowDetailsTitle)
    await actions.isVisible(this.borrowDetailBorrowApy)
    await actions.isVisible(this.borrowDetailCollateralApy)
    await actions.isVisible(this.borrowDetailNetApy)
    await actions.isVisible(this.borrowDetailBorrowed)
    await actions.isVisible(this.borrowDetailRepayBtn)
    if (await actions.getVisible(this.borrowDetailCollateral)) {
      await actions.isVisible(this.borrowDetailCollateral)
    }
  }

  async tapRepay(pool: string, token: string) {
    await actions.tap(this.repayBtn(pool, token))
  }

  async repay(pool = 'aave', token = 'AVAX') {
    console.log(`Repay flow - tapping repay button (feature not complete yet)`)
    await this.tapRepay(pool, token)
    await txPage.tapMax()
    await txPage.tapAddCard()
    await txPage.tapNext()
    await txPage.tapApprove()
    await txPage.verifySuccessToast()
  }

  async withdraw(pool: string, token = 'AVAX', amount = 'max') {
    console.log(`Withdrawing ${amount}...`)
    await this.tapWithdraw(pool, token)
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
