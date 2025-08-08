import assert from 'assert'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
import portfolio from '../locators/portfolio.loc'
import { Platform } from '../helpers/constants'
import cl from '../locators/commonEls.loc'
import accountManageLoc from '../locators/accountManage.loc'
import networksManagePage from './networksManage.page'
import ActivityTabPage from './activityTab.page'
import collectiblesPage from './collectibles.page'
import accountManagePage from './accountManage.page'
import bottomTabsPage from './bottomTabs.page'
import commonElsPage from './commonEls.page'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0
class PortfolioPage {
  get avaxNetwork() {
    return by.text(portfolio.avaxNetwork)
  }

  get avaxPNetwork() {
    return by.text(portfolio.avaxPNetwork)
  }

  get avaxXNetwork() {
    return by.text(portfolio.avaxXNetwork)
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

  get tokensTab() {
    return by.text(portfolio.tokensTab)
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

  get networksDropdownBTCTestNet() {
    return by.id(portfolio.networksDropdownBTCTestNet)
  }

  get networksDropdownETH() {
    return by.id(portfolio.networksDropdownETH)
  }

  get networksDropdownAVAX() {
    return by.id(portfolio.networksDropdownAVAX)
  }

  get networksDropdownPChain() {
    return by.id(portfolio.networksDropdownPChain)
  }

  get networksDropdownXChain() {
    return by.id(portfolio.networksDropdownXChain)
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

  get benqi() {
    return by.text(portfolio.benqi)
  }

  get activeNetworkBalance() {
    return by.id(portfolio.activeNetworkBalance)
  }

  get tokensTabListView() {
    return by.id(portfolio.tokensTabListView)
  }

  get portfolioTokenList() {
    return by.id(portfolio.portfolioTokenList)
  }

  get testnetModeIsOn() {
    return by.text(portfolio.testnetModeIsOn)
  }

  get sendButton() {
    return by.id(portfolio.sendButton)
  }

  get swapButton() {
    return by.id(portfolio.swapButton)
  }

  get buyButton() {
    return by.id(portfolio.buyButton)
  }

  get bridgeButton() {
    return by.id(portfolio.bridgeButton)
  }

  get receiveButton() {
    return by.id(portfolio.receiveButton)
  }

  get sort() {
    return by.id(portfolio.sort)
  }

  get view() {
    return by.id(portfolio.view)
  }

  async verifyPorfolioScreen() {
    await Assert.isVisible(this.viewAllBtn)
    await Assert.isVisible(this.favoritesHeader)
    await Assert.isVisible(this.networksHeader)
    await Assert.isVisible(this.assetsTab)
    await Assert.isVisible(this.colectiblesTab)
  }

  async verifySubTab(tab: string) {
    if (tab === 'Assets') {
      await Assert.isVisible(this.favoritesHeader)
      await Assert.isVisible(this.networksHeader)
      await Assert.isNotVisible(collectiblesPage.gridItem)
    } else if (tab === 'Collectibles') {
      await Assert.isVisible(collectiblesPage.gridItem)
      await Assert.isVisible(collectiblesPage.listSvg)
      await Assert.isNotVisible(this.networksHeader)
    } else {
      await Assert.isVisible(this.benqi)
      await Assert.isNotVisible(this.networksHeader)
      await Assert.isNotVisible(collectiblesPage.gridItem)
    }
  }

  async verifySubTabs(all = true) {
    await Assert.isVisible(this.assetsTab)
    await Assert.isVisible(this.defiTab)
    if (all) {
      await Assert.isVisible(this.collectiblesTab)
    } else {
      await Assert.isNotVisible(this.collectiblesTab)
    }
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

  async tapTokensTab() {
    await Action.tapElementAtIndex(this.tokensTab, 0)
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

  async tapFavoriteToken(token: string) {
    await Action.tapElementAtIndex(
      by.id(`watchlist_carousel__${token.toLowerCase()}`),
      0
    )
  }

  async tapAssetsTab() {
    await Action.tapElementAtIndex(this.assetsTab, 0)
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
    await Action.tapElementAtIndex(this.networksDropdown, 0)
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

  async tapNetworksDropdownBTCTestNet() {
    await Action.tapElementAtIndex(
      this.networksDropdownBTCTestNet,
      platformIndex
    )
  }

  async tapNetworksDropdownETH() {
    await Action.tapElementAtIndex(this.networksDropdownETH, platformIndex)
  }

  async tapNetworksDropdownAVAX(network = this.networksDropdownAVAX) {
    if (Action.platform() === 'ios') {
      await Action.tapElementAtIndex(network, 1)
    } else {
      await Action.tapElementAtIndex(network, 0)
    }
  }

  async tapManageNetworks() {
    await Action.tapElementAtIndex(this.manageNetworks, platformIndex)
  }

  async tapPolygonNetwork() {
    await Action.waitForElement(by.id('active_network__Polygon Mainnet'), 60000)
    await Action.tapElementAtIndex(by.id('active_network__Polygon Mainnet'), 0)
  }

  async verifyWatchListCarousel(tokens: string[]) {
    for (const token of tokens) {
      await Action.waitForElement(
        by.id(`watchlist_carousel__${token.toLowerCase()}`)
      )
      await Assert.isVisible(
        by.id(`watchlist_carousel__${token.toLowerCase()}`)
      )
    }
  }

  async tapActiveNetwork(network = 'Avalanche (C-Chain)') {
    await Action.waitForElement(by.id(portfolio.activeNetwork + network), 60000)
    await Action.tap(by.id(portfolio.activeNetwork + network))
  }

  async tapToken(token = 'Avalanche') {
    await Action.waitAndTap(by.id(`${portfolio.portfolioTokenItem}${token}`))
  }

  async verifyActiveNetwork(network: string) {
    await Action.waitForElement(by.id(portfolio.activeNetwork + network), 60000)
    await this.tapNetworksDropdown()
    await Action.waitForElement(
      by.id(portfolio.networkDropdownCheckMark + network)
    )
    await Action.tapElementAtIndex(by.text(network), platformIndex)
  }

  async verifyInactiveNetworks(networks: string[]) {
    await Action.scrollToBottom(this.tokensTabListView)
    for (const network of networks) {
      await Action.waitForElement(by.id(portfolio.inactiveNetwork + network))
    }
    await Action.scrollToTop(this.tokensTabListView)
  }

  async verifyNetworkRemoved(network: string) {
    await this.tapNetworksDropdown()
    await Action.waitForElementNotVisible(
      by.id(portfolio.networksDropdownItem + network)
    )
    await this.tapNetworksDropdownAVAX()
  }

  async getAllAvailableTokens() {
    let output: string[] = []
    await this.tapAvaxNetwork()
    await this.tapTokensTab()
    output = await Action.getElementsTextByTestId('portfolio_list_item')
    console.log(output)
    console.log('nothing?')
    return output
  }

  async verifyAccountName(name: string) {
    await Assert.hasText(accountManagePage.accountDropdownTitle, name)
  }

  async getTotalBalance(): Promise<number> {
    // The total balance on Portfolio header
    const bal = await Action.getElementText(by.id('portfolio_balance__total'))
    return Action.getAmount(bal)
  }

  async getActiveNetworkBalance(): Promise<number> {
    // Balance of the active network on Portfolio tab
    const bal = await Action.getElementText(this.activeNetworkBalance)
    return Action.getAmount(bal)
  }

  async getNetworkTokensBalance(
    network = 'Avalanche (C-Chain)'
  ): Promise<number> {
    // The selected network tokens' balance (e.g. Avalanche (C-Chain) tokens' balance)
    await Action.waitForElement(this.portfolioTokenList)
    const bal = await Action.getElementText(
      by.id(`network_tokens_header_balance__${network}`)
    )
    return Action.getAmount(bal)
  }

  async getTokenBalance(token: string): Promise<number> {
    await Action.waitForElement(this.portfolioTokenList)
    await Action.scrollListUntil(
      by.id(`portfolio_list_item__${token}_balance`),
      this.portfolioTokenList,
      100
    )
    const bal = await Action.getElementText(
      by.id(`portfolio_list_item__${token}_balance`)
    )
    return Action.getAmount(bal)
  }

  //////// NEW GEN ////////
  async goToAssets() {
    await bottomTabsPage.tapPortfolioTab()
    await this.tapAssetsTab()
  }

  async verifyAssetRow(index: number, isListView = true) {
    const prefix = isListView ? 'list' : 'grid'
    await Action.waitForElement(by.id(`${prefix}_fiat_balance__${index}`))
    await Action.waitForElement(by.id(`${prefix}_token_balance__${index}`))
    await Action.waitForElement(by.id(`${prefix}_token_name__${index}`))
  }

  async displayAssetsByNetwork(network: string) {
    if (network !== cl.bitcoinNetwork) {
      if (network === cl.pChain_2 || network === cl.xChain_2) {
        try {
          await Action.waitForElement(by.text('No assets yet'))
          return
        } catch (e) {
          console.log('No assets yet message not found')
        }
      }
      await Action.waitForElement(by.id(`network_logo__${network}`))
    }

    const networksToHide = {
      [cl.cChain_2]: [cl.pChain_2, cl.xChain_2, cl.ethereum],
      [cl.pChain_2]: [cl.cChain_2, cl.xChain_2, cl.ethereum],
      [cl.xChain_2]: [cl.pChain_2, cl.cChain_2, cl.ethereum],
      [cl.ethereum]: [cl.pChain_2, cl.xChain_2, cl.cChain_2],
      default: [cl.pChain_2, cl.xChain_2, cl.ethereum, cl.cChain_2]
    }

    for (const hiddenNetwork of networksToHide[network] ||
      networksToHide.default) {
      await Action.waitForElementNotVisible(
        by.id(`network_logo__${hiddenNetwork}`)
      )
    }
  }

  async displayAssetsByAllNetwork() {
    await Action.waitForElement(by.id(`network_logo__${cl.cChain_2}`))
    await Action.waitForElement(by.id(`network_logo__${cl.ethereum}`))
  }

  async verifyFiatCurrency(currency = '$') {
    await Action.waitForElement(by.id('list_fiat_balance__0'))
    const fiatBal =
      (await Action.getElementText(by.id('list_fiat_balance__0'))) ?? ''
    console.log(`${fiatBal}`)
    assert(fiatBal.includes(currency), 'Fiat currency not found')
  }

  async tapSend() {
    await Action.waitAndTap(this.sendButton, 2000)
  }

  async tapSwap() {
    await Action.waitAndTap(this.swapButton, 2000)
  }

  async tapBuy() {
    await Action.waitAndTap(this.buyButton, 2000)
  }

  async tapBridge() {
    await Action.waitAndTap(this.bridgeButton, 2000)
  }

  async tapReceive() {
    await Action.waitAndTap(this.receiveButton, 2000)
  }

  async verifyActivityItem(
    from = accountManageLoc.accountOneAddress,
    to = accountManageLoc.accountTwoAddress
  ) {
    await Action.waitForElement(by.id(`tx__from_${from}_to_${to}`))
  }

  async selectView(viewType = 'List view') {
    await Action.tap(this.view)
    await commonElsPage.selectDropdownItem(viewType)
  }
}

export default new PortfolioPage()
