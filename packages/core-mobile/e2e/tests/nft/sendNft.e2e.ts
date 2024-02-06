import AccountManagePage from '../../pages/accountManage.page'
import Actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import CollectiblesPage from '../../pages/collectibles.page'
import { warmup } from '../../helpers/warmup'
import { Platform } from '../../helpers/constants'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify NFT Details items', async () => {
    await AccountManagePage.tapCarrotSVG()
    await AccountManagePage.tapFirstAccount()
    await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapCollectiblesTab()
    await Actions.waitForElement(CollectiblesPage.gridItem, 5000)
    await CollectiblesPage.tapGridItem()
    await CollectiblesPage.verifyNftDetailsItems()
  })

  it('Should send NFT to second account', async () => {
    //Skipping test due to hidden FF on iOS
    if (Actions.platform() === Platform.iOS) {
      return
    }

    const nftTokenId = await CollectiblesPage.sendNft('second')
    await Actions.waitForElement(CollectiblesPage.sendSuccessfulToastMsg, 5000)
    await Actions.waitForElementNotVisible(
      CollectiblesPage.sendSuccessfulToastMsg,
      5000
    )

    await AccountManagePage.tapAccountMenu()
    await AccountManagePage.tapSecondAccount()
    await CollectiblesPage.refreshCollectiblesPage()
    await CollectiblesPage.tapGridItem()
    await CollectiblesPage.sendNft('first', nftTokenId)
  })
})
