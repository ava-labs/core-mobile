import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
import portfolio from '../locators/portfolio.loc'
import { Platform } from '../helpers/constants'
import networksManagePage from './networksManage.page'
import ActivityTabPage from './activityTab.page'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0
const platformIndex2 = Action.platform() === Platform.iOS ? 0 : 1
class PortfolioPage {
  get addToWatchlist() {
    return by.id(portfolio.addToWatchlist)
  }

  get avaxNetwork() {
    return by.text(portfolio.avaxNetwork)
  }

  get arbitrumNetwork() {
    return by.text(portfolio.arbitrumNetwork)
  }

  get addAssetsButton() {
    return by.text(portfolio.addAssetsButton)
  }

  get addAssetsMessage() {
    return by.text(portfolio.addAssetsMessage)
  }

  get avaxFujiToken() {
    return by.text(portfolio.avaxFujiToken)
  }

  get btcTokenItem() {
    return by.text(portfolio.btcTokenItem)
  }

  get colectiblesTab() {
    return by.text(portfolio.collectiblesTab)
  }

  get collectiblesTab() {
    return by.text(portfolio.collectiblesTab)
  }

  get defiTab() {
    return by.text(portfolio.defiTab)
  }

  get activityTab() {
    return by.text(portfolio.activityTab)
  }

  get btcNetwork() {
    return by.text(portfolio.btcNetwork)
  }

  get ethNetwork() {
    return by.text(portfolio.ethNetwork)
  }

  get ethSepoliaNetwork() {
    return by.text(portfolio.ethSepoliaNetwork)
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

  get manageTokens() {
    return by.text(portfolio.manageTokens)
  }

  get networksHeader() {
    return by.text(portfolio.networksHeader)
  }

  get noAssetsHeader() {
    return by.text(portfolio.noAssetsHeader)
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

  get polygonNetwork() {
    return by.text(portfolio.polygonNetwork)
  }

  get sendPendingToast() {
    return by.id(portfolio.sendPendingToast)
  }

  get sendSuccessToast() {
    return by.id(portfolio.sendSuccessToast)
  }

  async verifyPorfolioScreen() {
    await Assert.isVisible(this.viewAllBtn)
    await Assert.isVisible(this.favoritesHeader)
    await Assert.isVisible(this.networksHeader)
    await Assert.isVisible(this.assetsTab)
    await Assert.isVisible(this.colectiblesTab)
  }

  async goToActivityTab() {
    await this.tapAvaxNetwork()
    await this.tapActivityTab()
    await ActivityTabPage.refreshActivityPage()
  }

  async tapActivityTab() {
    await Action.waitForElementNotVisible(this.sendSuccessToast, 10000)
    await Action.tapElementAtIndex(this.activityTab, 0)
  }

  async tapAddToWatchlist() {
    await Action.tapElementAtIndex(this.addToWatchlist, platformIndex2)
  }

  async tapArbitrumNetwork() {
    await Action.tapElementAtIndex(this.arbitrumNetwork, 1)
  }

  async tapAvaxNetwork() {
    await Action.tapElementAtIndex(this.avaxNetwork, 1)
  }

  async tapBtcFavoriteToken() {
    await Action.tapElementAtIndex(this.btcTokenItem, 0)
  }

  async tapCollectiblesTab() {
    await Action.tapElementAtIndex(this.collectiblesTab, 0)
  }

  async tapDefiTab() {
    await Action.tapElementAtIndex(this.defiTab, 0)
  }

  async tapEthNetwork() {
    await Action.tapElementAtIndex(this.ethNetwork, 1)
  }

  async tapEthSepoliaNetwork() {
    await Action.tapElementAtIndex(this.ethSepoliaNetwork, 1)
  }

  async tapManageTokens() {
    await Action.tapElementAtIndex(this.manageTokens, 0)
  }

  async tapNetworksDropdown() {
    try {
      await Action.tapElementAtIndex(this.networksDropdown, 0)
    } catch (error) {
      console.log('Networks dropdown not found or is already tapped')
    }
  }

  async tapNetworksDropdownBTC() {
    try {
      await Action.tapElementAtIndex(this.networksDropdownBTC, platformIndex)
    } catch (error) {
      console.log(error)
      await Action.tapElementAtIndex(this.manageNetworks, 1)
      await Action.tapElementAtIndex(networksManagePage.networksTab, 1)
      await networksManagePage.tapBitcoin()
    }
  }

  async tapNetworksDropdownETH() {
    await Action.tapElementAtIndex(this.networksDropdownETH, platformIndex)
  }

  async tapNetworksDropdownAVAX() {
    if (Action.platform() === 'ios') {
      await Action.tapElementAtIndex(this.networksDropdownAVAX, 1)
    } else {
      await Action.tapElementAtIndex(this.networksDropdownAVAX, 0)
    }
  }

  async tapManageNetworks() {
    await Action.tapElementAtIndex(this.manageNetworks, platformIndex)
  }

  async tapPolygonNetwork() {
    await Action.tapElementAtIndex(this.polygonNetwork, 1)
  }
}

export default new PortfolioPage()
