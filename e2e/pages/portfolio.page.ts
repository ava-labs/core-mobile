import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
import portfolio from '../locators/portfolio.loc'
import { Platform } from '../helpers/constants'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0
const platformIndex2 = Action.platform() === Platform.iOS ? 0 : 2
class PortfolioPage {
  get addToWatchlist() {
    return by.id(portfolio.addToWatchlist)
  }

  get avaxNetwork() {
    return by.text(portfolio.avaxNetwork)
  }

  get btcTokenItem() {
    return by.text(portfolio.btcTokenItem)
  }

  get colectiblesTab() {
    return by.text(portfolio.collectiblesTab)
  }

  get btcNetwork() {
    return by.text(portfolio.btcNetwork)
  }

  get ethNetwork() {
    return by.text(portfolio.ethNetwork)
  }

  get assetsTab() {
    return by.text(portfolio.assetsTab)
  }

  get viewAllBtn() {
    return by.text(portfolio.viewAll)
  }

  get favoritesHeader() {
    return by.text(portfolio.favoritesHeader)
  }

  get manageNetworks() {
    return by.text(portfolio.manageNetworks)
  }

  get networksHeader() {
    return by.text(portfolio.networksHeader)
  }

  get networksDropdownBTC() {
    return by.id(portfolio.networksDropdownBTC)
  }

  get networksDropdownETH() {
    return by.id(portfolio.networksDropdownETH)
  }

  get networksDropdownAVAX() {
    return by.id(portfolio.networksDropdownAVAX)
  }

  get networksDropdownManage() {
    return by.id(portfolio.networksDropdownManage)
  }

  get networksDropdown() {
    return by.id(portfolio.networksDropdown)
  }

  async verifyPorfolioScreen() {
    await Assert.isVisible(this.viewAllBtn)
    await Assert.isVisible(this.favoritesHeader)
    await Assert.isVisible(this.networksHeader)
    await Assert.isVisible(this.assetsTab)
    await Assert.isVisible(this.colectiblesTab)
  }

  async tapAddToWatchlist() {
    await Action.tapElementAtIndex(this.addToWatchlist, platformIndex2)
  }

  async tapBtcFavoriteToken() {
    await Action.tapElementAtIndex(this.btcTokenItem, 0)
  }

  async tapNetworksDropdown() {
    await Action.tapElementAtIndex(this.networksDropdown, 0)
  }

  async tapNetworksDropdownBTC() {
    await Action.tapElementAtIndex(this.networksDropdownBTC, platformIndex)
  }

  async tapNetworksDropdownETH() {
    await Action.tapElementAtIndex(this.networksDropdownETH, platformIndex)
  }

  async tapNetworksDropdownAVAX() {
    await Action.tapElementAtIndex(this.networksDropdownAVAX, 0)
  }

  async tapManageNetworks() {
    await Action.tapElementAtIndex(this.manageNetworks, platformIndex)
  }
}

export default new PortfolioPage()
