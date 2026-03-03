import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import earnLoc from '../locators/earn.loc'
import txPage from './transactions.page'
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

  depositCard(marketName: string, token: string) {
    return selectors.getById(`deposit_card__${marketName}__${token}`)
  }

  borrowCard(marketId: string) {
    return selectors.getById(`borrow_card__${marketId}`)
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
    return selectors.getById('borrow_detail_repay_btn')
  }

  get borrowTab() {
    return selectors.getById(earnLoc.borrowTab)
  }

  get selectDepositsToUseAsCollateralTitle() {
    return selectors.getByText(earnLoc.selectDepositsToUseAsCollateralTitle)
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

  async selectBorrowPool(pool: string) {
    const protocolName = pool === 'aave' ? 'Aave' : 'Benqi'
    const borrowOnTrigger = selectors.getBySomeText('Borrow on')
    if (await actions.getVisible(borrowOnTrigger)) {
      await actions.tap(borrowOnTrigger)
      await actions.delay(500)
      await actions.tap(selectors.getByText(protocolName))
      await actions.delay(500)
    }
  }

  async borrow(token = 'AVAX', pool?: string) {
    const targetPool = pool ?? 'aave'
    console.log(`Borrowing ${token} from ${targetPool}...`)
    await this.goBorrow()
    await txPage.tapAddCard()
    await txPage.dismissTransactionOnboarding()
    await actions.waitFor(this.selectDepositsToUseAsCollateralTitle)
    await txPage.tapNext()
    await this.selectAsset(token)
    await txPage.tapMax()
    await txPage.tapAddCard()
    await txPage.tapNext()
    await txPage.tapApprove()
    await txPage.tapApprove()
    await txPage.verifySuccessToast()
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

  async tapDepositCard(token: string, pool: string) {
    const marketName = pool === 'aave' ? 'Aave' : 'Benqi'
    await bottomTabsPage.tapEarnTab()
    await actions.tap(this.depositCard(marketName, token))
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
    await actions.delay(1000)
  }

  async openBorrowDetail(marketId: string) {
    await this.goBorrow()
    await actions.tap(this.borrowCard(marketId))
    await actions.waitFor(this.borrowDetailsTitle)
  }

  async openFirstBorrowDetail(assetProtocolLabel = 'AVAX on Aave') {
    await this.goBorrow()
    const card = selectors.getByText(assetProtocolLabel)
    const visible = await actions.getVisible(card)
    if (visible) {
      await actions.tap(card)
      await actions.waitFor(this.borrowDetailsTitle)
      return true
    }
    return false
  }

  getBorrowCardLabel(token: string, pool: string) {
    const protocolName = pool === 'aave' ? 'Aave' : 'Benqi'
    return `${token} on ${protocolName}`
  }

  async tapBorrowCard(token: string, pool: string) {
    const label = this.getBorrowCardLabel(token, pool)
    await actions.tap(selectors.getByText(label))
    await actions.waitFor(this.borrowDetailsTitle)
  }

  async verifyBorrowDetail(_token: string, _pool: string) {
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

  async tapBorrowDetailRepay() {
    await actions.tap(this.borrowDetailRepayBtn)
  }

  async repay(pool: string) {
    console.log(`Repay flow - tapping repay button (feature not complete yet)`)
    await this.tapBorrowCard('AVAX', pool)
    await this.tapBorrowDetailRepay()
    console.log('Repay button tapped')
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
