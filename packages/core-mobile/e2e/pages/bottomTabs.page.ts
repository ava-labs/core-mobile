import Actions from '../helpers/actions'
import bottomTabsLoc from '../locators/bottomTabs.loc'
import Assert from '../helpers/assertions'
import commonElsPage from './commonEls.page'

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
    return by.id(bottomTabsLoc.portfolioTab)
  }

  get trackTab() {
    return by.id(bottomTabsLoc.trackTab)
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
    await Actions.tapElementAtIndex(this.activityTab, 0)
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
    await Actions.tapElementAtIndex(this.trackTab, 0)
  }

  async tapStakeTab() {
    await Actions.tapElementAtIndex(this.stakeTab, 0)
  }

  async tapWatchlistTab() {
    await Actions.tapElementAtIndex(this.watchlistTtab, 1)
  }

  async verifyBottomTabs(gotItIsVisible = true) {
    await commonElsPage.tapGotIt(gotItIsVisible)
    await Actions.waitForElement(this.portfolioTab, 20000)
    await Assert.isVisible(this.trackTab)
    await Assert.isVisible(this.stakeTab)
    await Assert.isVisible(this.browserTab)
  }
}

export default new BottomsTabsPage()
