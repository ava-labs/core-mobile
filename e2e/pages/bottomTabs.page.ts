import bottomTabs from '../locators/bottomTabs.loc'
import actions from '../helpers/actions'

class BottomTabsPage {
  get activityTab() {
    return by.id(bottomTabs.activityTab)
  }

  async tapActivityTab() {
    await actions.tapElementAtIndex(this.activityTab, 1)
  }
}

export default new BottomTabsPage()
