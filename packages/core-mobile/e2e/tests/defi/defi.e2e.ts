import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import AccountManagePage from '../../pages/accountManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import DefiPage from '../../pages/defi.page'

describe('Defi Tab', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Defi Items', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await AccountManagePage.tapCarrotSVG()
    await AccountManagePage.tapFirstAccount()
    await PortfolioPage.tapDefiTab()
    await DefiPage.verifyDefiListItems()
  })

  it('Should verify Defi Protocol Items', async () => {
    await DefiPage.tapDefiProtocol()
    await DefiPage.verifyDefiProtocolItems()
    await DefiPage.tapHeaderBack()
  })

  it('Should verify empty screen Defi Items', async () => {
    if (!process.env.SEEDLESS_TEST || process.env.SEEDLESS_TEST === 'false') {
      await AccountManagePage.createAccount(2)
    } else {
      try {
        await AccountManagePage.tapCarrotSVG()
        await AccountManagePage.tap2ndAccountMenu()
      } catch {
        await AccountManagePage.tapCarrotSVG()
        await AccountManagePage.createAccount(2)
      }
    }
    await DefiPage.verifyEmptyScreenItems()
  })
})
