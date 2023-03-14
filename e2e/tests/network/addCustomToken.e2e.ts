/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { device } from 'detox'
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import ManageTokensPage from '../../pages/manageTokens.page'

describe('Change Network', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should add custom network', async () => {
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapManageTokens()
    await ManageTokensPage.tapAddcustomToken()
    await ManageTokensPage.inputCustomToken()
    await ManageTokensPage.tapAddButton()
    await ManageTokensPage.tapAddcustomToken()
    await ManageTokensPage.inputCustomToken()

    await Assert.isVisible(ManageTokensPage.addedMessage)
  })
})
