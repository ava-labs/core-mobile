import Actions from '../../helpers/actions'
import ActivityTabPage from '../../pages/activityTab.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import activityTabPage from '../../pages/activityTab.page'
import accountManagePage from '../../pages/accountManage.page'

describe('Filter transactions on Activity List', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await accountManagePage.switchToFirstAccount()
  })

  it('should filter Contract Call and Swap on Activity List', async () => {
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapContractCallFilterOption()
    await ActivityTabPage.verifySelectedFilter('Contract Call')
    const row = await ActivityTabPage.getLatestActivityRow()
    try {
      await ActivityTabPage.verifyActivityRow(row, 'Contract Call')
    } catch (error) {
      await ActivityTabPage.verifyActivityRow(row, 'Swap')
    }
  })

  it('should filter Bridge on Activity List', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapBridgeFilterOption()
    await ActivityTabPage.verifySelectedFilter('Bridge')
    try {
      const row = await ActivityTabPage.getLatestActivityRow()
      await ActivityTabPage.verifyActivityRow(row, 'Bridge')
    } catch (error) {
      await Actions.waitForElement(activityTabPage.noRecentActivity)
    }
  })

  it('should filter Outgoing on Activity List', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapOutgingFilterOption()
    await ActivityTabPage.verifySelectedFilter('Outgoing')
    const row = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(row, 'Send')
  })

  it('should filter Incoming on Activity List', async () => {
    await accountManagePage.createNthAccountAndSwitchToNth(2)
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapIncomingFilterOption()
    await ActivityTabPage.verifySelectedFilter('Incoming')
    const row = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(row, 'Receive')
  })
})
