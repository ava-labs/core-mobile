import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import portfolio from '../locators/portfolio.loc'
import delay from '../helpers/waits'

class PortfolioPage {
  get colectiblesTab() {
    return by.text(portfolio.collectiblesTab)
  }

  get tokensTab() {
    return by.text(portfolio.tokensTab)
  }

  get viewAllBtn() {
    return by.text(portfolio.viewAll)
  }

  get favoritesHeader() {
    return by.text(portfolio.favoritesHeader)
  }

  get networksHeader() {
    return by.text(portfolio.networksHeader)
  }

  get networksDropdownBTC() {
    return by.id(portfolio.networksDropdownBTC)
  }

  get networksDropdownETH() {
    return by.id(portfolio.networksDropdownETH)
  }

  get networksDropdownAVAX() {
    return by.id(portfolio.networksDropdownAVAX)
  }

  get networksDropdownManage() {
    return by.id(portfolio.networksDropdownManage)
  }

  get watchlistIcon() {
    return by.id(portfolio.watchlistIcon)
  }

  get portfolioTab() {
    return by.id(portfolio.portfolioTab)
  }

  get activityTab() {
    return by.id(portfolio.activityTab)
  }

  get watchlistTtab() {
    return by.id(portfolio.watchlistTab)
  }

  get bridgeTab() {
    return by.id(portfolio.bridgeTab)
  }

  async verifyPorfolioScreen() {
    await Assert.isVisible(this.colectiblesTab)
    await Assert.isVisible(this.tokensTab)
    await Assert.isVisible(this.viewAllBtn)
    await Assert.isVisible(this.favoritesHeader)
    await Assert.isVisible(this.networksHeader)
    await Assert.isVisible(this.watchlistIcon)
    await Assert.isVisible(this.portfolioTab)
    await Assert.isVisible(this.activityTab)
    await Assert.isVisible(this.watchlistTtab)
    await Assert.isVisible(this.bridgeTab)
  }
}

export default new PortfolioPage()
