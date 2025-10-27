import AccountManagePage from '../../../pages/accountManage.page'
import PortfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import DefiPage from '../../../pages/defi.page'
import commonElsPage from '../../../pages/commonEls.page'

describe('Defi Tab', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Defi Items', async () => {
    await PortfolioPage.tapDefiTab()
    await DefiPage.verifyDefiListItems()
  })

  it('Should verify Defi Protocol Items', async () => {
    await DefiPage.tapDefiProtocol()
    await DefiPage.verifyDefiProtocolItems()
    await commonElsPage.goBack()
  })

  it('Should verify empty screen Defi Items', async () => {
    await AccountManagePage.createNthAccountAndSwitchToNth(3)
    await DefiPage.verifyEmptyScreenItems()
  })
})
