import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import bottomTabsLoc from '../locators/bottomTabs.loc'

class BottomsTabsPage {
  get watchlistIcon() {
    return selectors.getById(bottomTabsLoc.watchlistIcon)
  }

  get activityTab() {
    return selectors.getById(bottomTabsLoc.activityTab)
  }

  get watchlistTab() {
    return selectors.getById(bottomTabsLoc.watchlistTab)
  }

  get plusIcon() {
    return selectors.getById(bottomTabsLoc.plusButton)
  }

  get portfolioTab() {
    return selectors.getById(bottomTabsLoc.portfolioTab)
  }

  get trackTab() {
    return selectors.getById(bottomTabsLoc.trackTab)
  }

  get stakeTab() {
    return selectors.getById(bottomTabsLoc.stakeTab)
  }

  get browserTab() {
    return selectors.getById(bottomTabsLoc.browserTab)
  }

  get activityTabTitle() {
    return selectors.getByText(bottomTabsLoc.activityTab)
  }

  async tapBrowserTab() {
    await actions.tap(this.browserTab)
  }

  async tapActivityTab() {
    await actions.tap(this.activityTab)
  }

  async tapPortfolioTab() {
    await actions.tap(this.portfolioTab)
  }

  async tapTrackTab() {
    await actions.tap(this.trackTab)
  }

  async tapStakeTab() {
    await actions.tap(this.stakeTab)
  }

  async tapWatchlistTab() {
    await actions.tap(this.watchlistTab)
  }
}

export default new BottomsTabsPage()
