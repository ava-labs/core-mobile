import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import browserLoc from '../locators/browser.loc'
import discoverLoc from '../locators/browserDiscover.loc'

class BrowserDiscoverPage {
  get discoverPage() {
    return selectors.getById(discoverLoc.discoverPage)
  }

  get ecosystemItem() {
    return selectors.getByIdContaining(discoverLoc.ecosystemItemPrefix)
  }

  get learnItem() {
    return selectors.getByIdContaining(discoverLoc.learnItemPrefix)
  }

  get moreMenu() {
    return selectors.getById(discoverLoc.moreMenu)
  }

  get backMenuItem() {
    return selectors.getByText(discoverLoc.backMenuItem)
  }

  get myWebview() {
    return selectors.getById(browserLoc.myWebview)
  }

  get searchBar() {
    return selectors.getById(browserLoc.searchBar)
  }

  async tapFirstEcosystemItem() {
    await actions.tap(this.ecosystemItem)
  }

  async scrollEcosystemCarousel() {
    await actions.dragAndDrop(this.ecosystemItem, [-250, 0])
    await actions.delay(500)
  }

  async tapOpenButton(index = 0) {
    await actions.tap(
      selectors.getByTextWithIndex(discoverLoc.openButton, index)
    )
  }

  async scrollDiscoverPage() {
    await actions.swipe('up', 0.5, this.discoverPage)
    await actions.delay(500)
  }

  async waitForLearnItems() {
    await actions.waitFor(this.learnItem, 20000)
  }

  async tapFirstLearnItem() {
    await actions.tap(this.learnItem)
  }

  async scrollLearnCarousel() {
    await actions.dragAndDrop(this.learnItem, [-250, 0])
    await actions.delay(500)
  }

  async goBackToDiscover() {
    await actions.tap(this.moreMenu)
    await actions.tap(this.backMenuItem)
    await actions.delay(1000)
  }

  async verifyWebviewLoaded() {
    await actions.waitFor(this.myWebview, 30000)
  }

  async verifyUrlLoaded() {
    await actions.waitFor(this.searchBar)
    const url = await actions.getText(this.searchBar)
    if (!url || url.length === 0) {
      throw new Error('Search bar should show a URL after navigation')
    }
    console.log('Loaded URL:', url)
  }
}

export default new BrowserDiscoverPage()
