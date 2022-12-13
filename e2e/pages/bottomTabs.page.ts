import bottomTabsLoc from '../locators/bottomTabs.loc'

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
}

export default new BottomsTabsPage()
