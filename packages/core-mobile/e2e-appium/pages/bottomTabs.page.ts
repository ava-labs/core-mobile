import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import bottomTabsLoc from '../locators/bottomTabs.loc'
import commonElsPage from './commonEls.page'
import earnPage from './earn.page'

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

  get earnTab() {
    return selectors.getById(bottomTabsLoc.earnTab)
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
    await actions.longPress(this.activityTab)
  }

  async tapPortfolioTab() {
    await actions.longPress(this.portfolioTab)
  }

  async tapTrackTab() {
    await actions.longPress(this.trackTab)
  }

  async tapEarnTab() {
    await actions.longPress(this.earnTab)
    await commonElsPage.pullToRefresh(earnPage.earnSubtitle)
  }

  async tapStakeTab() {
    await actions.longPress(this.stakeTab)
  }
}

export default new BottomsTabsPage()
