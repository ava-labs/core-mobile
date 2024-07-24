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

  get stakeTab() {
    return by.id(bottomTabsLoc.stakeTab)
  }

  get browserTab() {
    return by.id(bottomTabsLoc.browserTab)
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
    await Assert.isVisible(this.portfolioTab)
    await Assert.isVisible(this.plusIcon)
    // await Assert.isVisible(this.earnTab) Should be activated once Earn feature is developed and no longer on feature flag.
    await Assert.isVisible(this.watchlistTtab)
    await Assert.isVisible(this.watchlistIcon)
  }
}

export default new BottomsTabsPage()
