import accountManagePage from '../pages/accountManage.page'
import bottomTabsPage from '../pages/bottomTabs.page'
import advancedPage from '../pages/burgerMenu/advanced.page'

export const cleanup = async () => {
  await bottomTabsPage.tapPortfolioTab()
  await advancedPage.switchToMainnet()
  await accountManagePage.switchToFirstAccount()
}
