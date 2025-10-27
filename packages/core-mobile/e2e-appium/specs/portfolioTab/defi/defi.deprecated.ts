import commonElsPage from '../../../pages/commonEls.page'
import portfolio from '../../../pages/portfolio.page'
import warmup from '../../../helpers/warmup'

describe('Portfolio', () => {
  it('Defi - Should verify Defi list', async () => {
    await warmup()
    await portfolio.tapDefiTab()
    await portfolio.verifyDefiList()
  })

  it('Defi - Should verify Defi browser screen', async () => {
    await portfolio.tapDefiBrowserButton('BENQI')
    await portfolio.verifyDefiBrowserScreen('BENQI')
    await portfolio.tapPortfolioTab()
  })

  it('Defi - Should verify Defi detail', async () => {
    await portfolio.tapDefiBox()
    await portfolio.verifyDefiDetails()
    await commonElsPage.goBack()
  })

  it('Defi -Should verify empty defi screen', async () => {
    await AccountManagePage.createNthAccountAndSwitchToNth(3)
    await DefiPage.verifyEmptyScreenItems()
  })
})
