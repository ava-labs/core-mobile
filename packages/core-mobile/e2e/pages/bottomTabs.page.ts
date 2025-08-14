import Actions from '../helpers/actions'
import bottomTabsLoc from '../locators/bottomTabs.loc'

class BottomsTabsPage {
  get watchlistIcon() {
    return by.id(bottomTabsLoc.watchlistIcon)
  }

  get activityTab() {
    return by
      .text(bottomTabsLoc.activityTab)
      .withAncestor(by.label(bottomTabsLoc.tabBar))
  }

  get watchlistTab() {
    return by
      .text(bottomTabsLoc.watchlistTab)
      .withAncestor(by.label(bottomTabsLoc.tabBar))
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

  get activityTabTitle() {
    return by.text(bottomTabsLoc.activityTab)
  }

  async tapBrowserTab() {
    await Actions.tap(this.browserTab)
  }

  async tapActivityTab() {
    await Actions.waitAndTap(this.activityTab)
    await Actions.waitAndTap(this.activityTab)
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
    await Actions.tap(this.portfolioTab)
  }

  async tapTrackTab() {
    await Actions.tap(this.trackTab)
  }

  async tapStakeTab() {
    await Actions.tap(this.stakeTab)
  }

  async tapWatchlistTab() {
    await Actions.tap(this.watchlistTab)
  }
}

export default new BottomsTabsPage()
