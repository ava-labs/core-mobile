import { expect as jestExpect } from 'expect'
import Actions from '../../helpers/actions'
import activityTabPage from '../../pages/activityTab.page'
import delay from '../../helpers/waits'
import BottomTabsPage from '../../pages/bottomTabs.page'
import TransactionDetailsPage from '../../pages/transactionDetails.page'
import { warmup } from '../../helpers/warmup'
import PlusMenuPage from '../../pages/plusMenu.page'
import SwapTabPage from '../../pages/swapTab.page'
import Assert from '../../helpers/assertions'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should swap AVAX to USDC', async () => {
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapSwapButton()
    await SwapTabPage.tapSelectTokenDropdown()
    await SwapTabPage.tapAvaxToken()
    await SwapTabPage.inputTokenAmmountAvax()
    await SwapTabPage.tapSelectTokenDropdown()
    await SwapTabPage.tapUsdcToken()
    await SwapTabPage.reviewOrderButton()
    await SwapTabPage.tapApproveButton()
    await Actions.waitForElement(SwapTabPage.linkSvg, 5000)
    await SwapTabPage.verifyToastMessageItems()
  })

  it('Should verify swap transaction in Activity', async () => {
    await SwapTabPage.tapLink()
    await delay(5000)
    await activityTabPage.refreshActivityPage()
    await Assert.isVisible(SwapTabPage.usdcToken)
    await SwapTabPage.tapUsdcToken()
    const isTransactionSuccessful =
      await TransactionDetailsPage.isDateTextOlderThan(300)
    jestExpect(isTransactionSuccessful).toBe(true)
  })
})
