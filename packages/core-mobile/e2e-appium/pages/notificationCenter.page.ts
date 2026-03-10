import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import ncLoc from '../locators/notificationCenter.loc'

class NotificationCenterPage {
  get notificationIcon() {
    return selectors.getById(ncLoc.notificationIcon)
  }

  get emptyStateTitle() {
    return selectors.getByText(ncLoc.emptyStateTitle)
  }

  get emptyStateSubtitle() {
    return selectors.getByText(ncLoc.emptyStateSubtitle)
  }

  get clearAllButton() {
    return selectors.getByText(ncLoc.clearAllButton)
  }

  get tabAll() {
    return selectors.getByText(ncLoc.tabAll)
  }

  get tabTransactions() {
    return selectors.getByText(ncLoc.tabTransactions)
  }

  get tabPriceUpdates() {
    return selectors.getByText(ncLoc.tabPriceUpdates)
  }

  get balanceNotiTitle() {
    return selectors.getBySomeText(ncLoc.balanceNotiTitle)
  }

  async tapNotificationIcon() {
    await actions.delay(1500)
    await actions.click(this.notificationIcon)
  }

  async verifyEmptyState() {
    await actions.waitFor(this.emptyStateTitle, 10000)
    await actions.isVisible(this.emptyStateSubtitle)
  }

  async tapTab(tab: 'All' | 'Transactions' | 'Price updates') {
    const tabSelector =
      tab === 'All'
        ? this.tabAll
        : tab === 'Transactions'
        ? this.tabTransactions
        : this.tabPriceUpdates
    await actions.tap(tabSelector)
  }

  async tapClearAll() {
    await actions.tap(this.clearAllButton)
  }

  async verifyBalanceNotification() {
    await actions.waitFor(this.balanceNotiTitle, 10000)
  }
}

export default new NotificationCenterPage()
