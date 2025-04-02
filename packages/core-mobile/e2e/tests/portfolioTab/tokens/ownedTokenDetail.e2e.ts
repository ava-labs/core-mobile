/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import PortfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import tokenDetailPage from '../../../pages/tokenDetail.page'
import commonElsPage from '../../../pages/commonEls.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import networksManagePage from '../../../pages/networksManage.page'

describe('Owned Token Detail', () => {
  beforeAll(async () => {
    await warmup()
  })

  const tokens: Record<string, [boolean, boolean]> = {
    Avalanche: [false, true], // { tokenName: [bridgeButtonToShow, swapButtonToShow]}
    Bitcoin: [true, true],
    TetherToken: [false, true]
  }

  Object.entries(tokens).forEach(
    ([token, [bridgeBtnToShow, swapBtnToShow]]) => {
      test(`should verify Owend ${token} Detail on C-Chain`, async () => {
        await PortfolioPage.tapActiveNetwork()
        await PortfolioPage.tapToken(token)
        await tokenDetailPage.verifyOwnedTokenActionButtons(
          bridgeBtnToShow,
          swapBtnToShow
        )
        await tokenDetailPage.verifyNavigateToSend()
        await tokenDetailPage.verifyNavigateToReceive()
        await tokenDetailPage.verifyNavigateToBridge(bridgeBtnToShow)
        await tokenDetailPage.verifyNavigateToSwap(swapBtnToShow)
        await commonElsPage.goBack()
        await bottomTabsPage.tapPortfolioTab()
      })
    }
  )

  it('should verify owned token detail on Ethereum network', async () => {
    await networksManagePage.switchNetwork('Ethereum')
    await PortfolioPage.tapActiveNetwork('Ethereum')
    await PortfolioPage.tapToken('ETH')
    await tokenDetailPage.verifyOwnedTokenActionButtons(true, false)
    await tokenDetailPage.verifyNavigateToSend()
    await tokenDetailPage.verifyNavigateToReceive()
    await tokenDetailPage.verifyNavigateToBridge(true)
    await tokenDetailPage.verifyNavigateToSwap(false)
    await commonElsPage.goBack()
    await bottomTabsPage.tapPortfolioTab()
  })

  it('should verify owned token detail on Bitcoin network', async () => {
    await networksManagePage.switchNetwork('Bitcoin')
    await PortfolioPage.tapActiveNetwork('Bitcoin')
    await PortfolioPage.tapToken('Bitcoin')
    await tokenDetailPage.verifyOwnedTokenActionButtons(true, false)
    await tokenDetailPage.verifyNavigateToSend()
    await tokenDetailPage.verifyNavigateToReceive()
    await tokenDetailPage.verifyNavigateToBridge(true)
    await tokenDetailPage.verifyNavigateToSwap(false)
    await commonElsPage.goBack()
    await bottomTabsPage.tapPortfolioTab()
  })
})
