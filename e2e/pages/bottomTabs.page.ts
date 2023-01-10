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

  get bridgeTab() {
    return by.id(bottomTabsLoc.bridgeTab)
  }

  get plusIcon() {
    return by.id(bottomTabsLoc.plusButton)
  }

  async tapActivityTab() {
    await Actions.tapElementAtIndex(this.activityTab, 1)
  }

  async tapPlusIcon() {
    await Actions.tapElementAtIndex(this.plusIcon, 1)
  }

  async verifyBottomTabs() {
    await Assert.isVisible(this.portfolioTab)
    await Assert.isVisible(this.activityTab)
    await Assert.isVisible(this.watchlistTtab)
    await Assert.isVisible(this.bridgeTab)
    await Assert.isVisible(this.watchlistIcon)
  }
}

export default new BottomsTabsPage()
