import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'
import portfolioPage from '../../../pages/portfolio.page'

describe('Assets Tab View', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should display all assets by default list view', async () => {
    await portfolioPage.goToAssets()

    // dropdown visiblity
    await commonElsPage.visibleDropdown('Filter')
    await commonElsPage.visibleDropdown('Sort')
    await commonElsPage.visibleDropdown('View')

    // test top 3 assets
    await portfolioPage.verifyAssetRow(0)
    await portfolioPage.verifyAssetRow(1)
    await portfolioPage.verifyAssetRow(2)
  })

  it('should display all assets by grid view', async () => {
    await commonElsPage.selectDropdown('View', 'Grid view')

    // test top 3 assets
    await portfolioPage.verifyAssetRow(0, false)
    await portfolioPage.verifyAssetRow(1, false)
    await portfolioPage.verifyAssetRow(2, false)

    await commonElsPage.selectDropdown('View', 'List view')
  })
})
