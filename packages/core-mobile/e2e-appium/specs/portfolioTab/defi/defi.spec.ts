import portfolioPage from '../../../pages/portfolio.page'
import warmup from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'
import settingsPage from '../../../pages/settings.page'
import browserPage from '../../../pages/browser.page'
import portfolioLoc from '../../../locators/portfolio.loc'
import bottomTabsPage from '../../../pages/bottomTabs.page'

describe('Defi', () => {
  it('Should verify the defi detail', async () => {
    await warmup()
    await portfolioPage.tapDefiTab()

    const defiItemPrice = await portfolioPage.getDefiItemPrice()
    const defiItemTitle = await portfolioPage.getDefiItemTitle()

    await portfolioPage.tapDefiItem()
    await portfolioPage.verifyDefiItem(defiItemPrice, defiItemTitle)
    await commonElsPage.goBack()

    await commonElsPage.selectDropdown('view', 'List view')
    const defiListPrice = await portfolioPage.getDefiItemPrice(0, false)
    const defiListTitle = await portfolioPage.getDefiItemTitle(0, false)
    await portfolioPage.tapDefiItem(0, false)
    await portfolioPage.verifyDefiItem(defiListPrice, defiListTitle)
  })

  it('Should verify the defi browser', async () => {
    await portfolioPage.tapDefiDetailBrowserBtn()
    await browserPage.verifyUrl(portfolioLoc.aaveDefiUrl)
    await bottomTabsPage.tapPortfolioTab()

    await portfolioPage.tapDefiBrowserBtn(0, false)
    await browserPage.verifyUrl(portfolioLoc.aaveDefiUrl)
    await bottomTabsPage.tapPortfolioTab()

    await commonElsPage.selectDropdown('view', 'Grid view')
    await portfolioPage.tapDefiBrowserBtn()
    await browserPage.verifyUrl(portfolioLoc.aaveDefiUrl)
    await bottomTabsPage.tapPortfolioTab()
  })

  it('Should sort defi by name', async () => {
    // Ascending order
    // ascending order in grid view
    await portfolioPage.verifyDefiSort()
    // view as list
    await commonElsPage.selectDropdown('view', 'List view')
    // ascending order in list view
    await portfolioPage.verifyDefiSort(true, false)

    // Descending order
    // descending order in list view
    await commonElsPage.selectDropdown('sort', 'Name Z to A')
    await portfolioPage.verifyDefiSort(false, false)
    // view as grid
    await commonElsPage.selectDropdown('view', 'Grid view')
    // descending order in grid view
    await portfolioPage.verifyDefiSort(false, true)
  })

  it('Should verify the empty defi screen', async () => {
    await settingsPage.goSettings()
    await settingsPage.switchAccountByCarousel('Account 2')
    await portfolioPage.verifyEmptyDefiScreen()
  })
})
