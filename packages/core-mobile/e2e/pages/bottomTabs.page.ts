import Actions from '../helpers/actions'
import bottomTabsLoc from '../locators/bottomTabs.loc'
import Assert from '../helpers/assertions'

class BottomsTabsPage {
  get watchlistIcon() {
    return by.id(bottomTabsLoc.watchlistIcon)
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

  get portfolioTab() {
    return by
      .text(bottomTabsLoc.portfolioTab)
      .withAncestor(by.label(bottomTabsLoc.tabBar))
  }

  get trackTab() {
    return by
      .text(bottomTabsLoc.trackTab)
      .withAncestor(by.label(bottomTabsLoc.tabBar))
  }

  get stakeTab() {
    return by
      .text(bottomTabsLoc.stakeTab)
      .withAncestor(by.label(bottomTabsLoc.tabBar))
  }

  get browserTab() {
    return by
      .text(bottomTabsLoc.browserTab)
      .withAncestor(by.label(bottomTabsLoc.tabBar))
  }

  async tapBrowserTab() {
    await Actions.tapElementAtIndex(this.browserTab, 0)
  }

  async tapActivityTab() {
    await Actions.tapElementAtIndex(this.activityTab, 1)
  }

  async tapPlusIcon() {
    if (Actions.platform() === 'ios') {
      try {
        await Actions.tapElementAtIndex(this.plusIcon, 1)
      } catch {
        await Actions.tapElementAtIndex(this.plusIcon, 0)
      }
    } else {
      try {
        await Actions.tapElementAtIndex(this.plusIcon, 0)
      } catch {
        await Actions.tapElementAtIndex(this.plusIcon, 1)
      }
    }
  }

  async tapPortfolioTab() {
    await Actions.tapElementAtIndex(this.portfolioTab, 1)
  }

  async tapStakeTab() {
    await Actions.tapElementAtIndex(this.stakeTab, 0)
  }

  async tapWatchlistTab() {
    await Actions.tapElementAtIndex(this.watchlistTtab, 1)
  }

  async verifyBottomTabs() {
    await Actions.waitForElement(this.portfolioTab, 10000)
    await Assert.isVisible(this.trackTab)
    await Assert.isVisible(this.stakeTab)
    await Assert.isVisible(this.browserTab)
  }
}

export default new BottomsTabsPage()
