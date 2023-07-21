import Actions from '../helpers/actions'
import bottomTabsLoc from '../locators/bottomTabs.loc'
import Assert from '../helpers/assertions'

class BottomsTabsPage {
  get watchlistIcon() {
    return by.id(bottomTabsLoc.watchlistIcon)
  }

  get portfolioTab() {
    return by.id(bottomTabsLoc.portfolioTab)
  }

  get activityTab() {
    return by.id(bottomTabsLoc.activityTab)
  }

  get watchlistTtab() {
    return by.id(bottomTabsLoc.watchlistTab)
  }

  get plusIcon() {
    return by.id(bottomTabsLoc.plusButton)
  }

  get earnTab() {
    return by.text(bottomTabsLoc.earnTab)
  }

  async tapActivityTab() {
    await Actions.tapElementAtIndex(this.activityTab, 1)
  }

  async tapPlusIcon() {
    await Actions.tapElementAtIndex(this.plusIcon, 0)
  }

  async tapPortfolioTab() {
    await Actions.tapElementAtIndex(this.portfolioTab, 1)
  }

  async tapWatchlistTab() {
    await Actions.tapElementAtIndex(this.watchlistTtab, 1)
  }

  async verifyBottomTabs() {
    await Assert.isVisible(this.portfolioTab)
    await Assert.isVisible(this.plusIcon)
    // await Assert.isVisible(this.earnTab) Should be activated once Earn feature is developed and no longer on feature flag.
    await Assert.isVisible(this.watchlistTtab)
    await Assert.isVisible(this.watchlistIcon)
  }
}

export default new BottomsTabsPage()
