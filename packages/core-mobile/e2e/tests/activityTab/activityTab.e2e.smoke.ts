import Actions from '../../helpers/actions'
import ActivityTabPage from '../../pages/activityTab.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import accountManagePage from '../../pages/accountManage.page'

describe('Filter transactions on Activity List', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await accountManagePage.switchToFirstAccount()
  })

  it('should filter Contract Call on Activity List', async () => {
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapContractCallFilterOption()
    await ActivityTabPage.verifySelectedFilter('Contract Call')
    await Actions.waitForElement(by.text('Contract Call'), 5000, 1)
  })

  it('should filter Bridge on Activity List', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapBridgeFilterOption()
    await ActivityTabPage.verifySelectedFilter('Bridge')
    try {
      await Actions.waitForElement(ActivityTabPage.bridgeActivityListItem)
    } catch (error) {
      await Actions.waitForElement(ActivityTabPage.noRecentActivity)
    }
  })

  it('should filter Outgoing on Activity List', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapOutgingFilterOption()
    await ActivityTabPage.verifySelectedFilter('Outgoing')
    await ActivityTabPage.verifyExistingRow('Send')
  })

  it('should filter Incoming on Activity List', async () => {
    await accountManagePage.createNthAccountAndSwitchToNth(2)
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapIncomingFilterOption()
    await ActivityTabPage.verifySelectedFilter('Incoming')
    await ActivityTabPage.verifyExistingRow('Receive')
  })
})
