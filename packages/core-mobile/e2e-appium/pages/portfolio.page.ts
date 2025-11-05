import assert from 'assert'
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import commonEls from '../locators/commonEls.loc'
import portfolio from '../locators/portfolio.loc'
import bottomTabsPage from './bottomTabs.page'
import commonElsPage from './commonEls.page'

class PortfolioPage {
  get avaxNetwork() {
    return selectors.getByText(portfolio.avaxNetwork)
  }

  get avaxPNetwork() {
    return selectors.getByText(portfolio.avaxPNetwork)
  }

  get avaxXNetwork() {
    return selectors.getByText(portfolio.avaxXNetwork)
  }

  get arbitrumNetwork() {
    return selectors.getByText(portfolio.arbitrumNetwork)
  }

  get addAssetsButton() {
    return selectors.getByText(portfolio.addAssetsButton)
  }

  get addAssetsMessage() {
    return selectors.getByText(portfolio.addAssetsMessage)
  }

  get avaxFujiToken() {
    return selectors.getByText(portfolio.avaxFujiToken)
  }

  get btcTokenItem() {
    return selectors.getByText(portfolio.btcTokenItem)
  }

  get colectiblesTab() {
    return selectors.getByText(portfolio.collectiblesTab)
  }

  get collectiblesTab() {
    return selectors.getByText(portfolio.collectiblesTab)
  }

  get defiTab() {
    return selectors.getByText(portfolio.defiTab)
  }

  get activityTab() {
    return selectors.getByText(portfolio.activityTab)
  }

  get tokensTab() {
    return selectors.getByText(portfolio.tokensTab)
  }

  get btcNetwork() {
    return selectors.getByText(portfolio.btcNetwork)
  }

  get ethNetwork() {
    return selectors.getByText(portfolio.ethNetwork)
  }

  get ethSepoliaNetwork() {
    return selectors.getByText(portfolio.ethSepoliaNetwork)
  }

  get assetsTab() {
    return selectors.getByText(portfolio.assetsTab)
  }

  get viewAllBtn() {
    return selectors.getByText(portfolio.viewAll)
  }

  get favoritesHeader() {
    return selectors.getByText(portfolio.favoritesHeader)
  }

  get manageNetworks() {
    return selectors.getByText(portfolio.manageNetworks)
  }

  get manageTokens() {
    return selectors.getByText(portfolio.manageTokens)
  }

  get networksHeader() {
    return selectors.getByText(portfolio.networksHeader)
  }

  get noAssetsHeader() {
    return selectors.getByText(portfolio.noAssetsHeader)
  }

  get networksDropdownBTC() {
    return selectors.getById(portfolio.networksDropdownBTC)
  }

  get networksDropdownBTCTestNet() {
    return selectors.getById(portfolio.networksDropdownBTCTestNet)
  }

  get networksDropdownETH() {
    return selectors.getById(portfolio.networksDropdownETH)
  }

  get networksDropdownAVAX() {
    return selectors.getById(portfolio.networksDropdownAVAX)
  }

  get networksDropdownPChain() {
    return selectors.getById(portfolio.networksDropdownPChain)
  }

  get networksDropdownXChain() {
    return selectors.getById(portfolio.networksDropdownXChain)
  }

  get networksDropdownManage() {
    return selectors.getById(portfolio.networksDropdownManage)
  }

  get networksDropdown() {
    return selectors.getById(portfolio.networksDropdown)
  }

  get polygonNetwork() {
    return selectors.getByText(portfolio.polygonNetwork)
  }

  get sendPendingToast() {
    return selectors.getById(portfolio.sendPendingToast)
  }

  get sendSuccessToast() {
    return selectors.getById(portfolio.sendSuccessToast)
  }

  get benqi() {
    return selectors.getByText(portfolio.benqi)
  }

  get activeNetworkBalance() {
    return selectors.getById(portfolio.activeNetworkBalance)
  }

  get tokensTabListView() {
    return selectors.getById(portfolio.tokensTabListView)
  }

  get portfolioTokenList() {
    return selectors.getById(portfolio.portfolioTokenList)
  }

  get testnetModeIsOn() {
    return selectors.getByText(portfolio.testnetModeIsOn)
  }

  get sendButton() {
    return selectors.getById(portfolio.sendButton)
  }

  get swapButton() {
    return selectors.getById(portfolio.swapButton)
  }

  get buyButton() {
    return selectors.getById(portfolio.buyButton)
  }

  get bridgeButton() {
    return selectors.getById(portfolio.bridgeButton)
  }

  get sort() {
    return selectors.getById(portfolio.sort)
  }

  get view() {
    return selectors.getById(portfolio.view)
  }

  get defiDetailTitle() {
    return selectors.getById(portfolio.defiDetailTitle)
  }

  get defiDetailPrice() {
    return selectors.getById(portfolio.defiDetailPrice)
  }

  get defiEmptyScreenTitle() {
    return selectors.getByText(portfolio.defiEmptyScreenTitle)
  }

  get defiEmptyScreenDescription() {
    return selectors.getByText(portfolio.defiEmptyScreenDescription)
  }

  get defiEmptyScreenExploreBtn() {
    return selectors.getByText(portfolio.defiEmptyScreenExploreBtn)
  }

  get defiDetailBrowserBtn() {
    return selectors.getById(portfolio.defiDetailBrowserBtn)
  }

  async verifyPorfolioScreen() {
    await actions.isVisible(this.viewAllBtn)
    await actions.isVisible(this.favoritesHeader)
    await actions.isVisible(this.networksHeader)
    await actions.isVisible(this.assetsTab)
    await actions.isVisible(this.colectiblesTab)
  }

  // async verifySubTab(tab: string) {
  //   if (tab === 'Assets') {
  //     await actions.isVisible(this.favoritesHeader)
  //     await actions.isVisible(this.networksHeader)
  //     await actions.isVisible(collectiblesPage.gridItem, false)
  //   } else if (tab === 'Collectibles') {
  //     await actions.isVisible(collectiblesPage.gridItem)
  //     await actions.isVisible(collectiblesPage.listSvg)
  //     await actions.isVisible(this.networksHeader, false)
  //   } else {
  //     await actions.isVisible(this.benqi)
  //     await actions.isVisible(this.networksHeader, false)
  //     await actions.isVisible(collectiblesPage.gridItem, false)
  //   }
  // }

  async verifySubTabs(all = true) {
    await actions.isVisible(this.assetsTab)
    await actions.isVisible(this.defiTab)
    if (all) {
      await actions.isVisible(this.collectiblesTab)
    } else {
      await actions.isNotVisible(this.collectiblesTab)
    }
  }

  async tapTokensTab() {
    await actions.tap(this.tokensTab)
  }

  async tapArbitrumNetwork() {
    await actions.tap(this.arbitrumNetwork)
  }

  async tapAvaxNetwork() {
    await actions.tap(this.avaxNetwork)
  }

  async tapBtcFavoriteToken() {
    await actions.tap(this.btcTokenItem)
  }

  async tapFavoriteToken(token: string) {
    await actions.tap(
      selectors.getById(`watchlist_carousel__${token.toLowerCase()}`)
    )
  }

  async tapAssetsTab() {
    await actions.tap(this.assetsTab)
  }

  async tapCollectiblesTab() {
    await actions.click(this.collectiblesTab)
  }

  async tapDefiTab() {
    await actions.click(this.defiTab)
  }

  async tapEthNetwork() {
    await actions.tap(this.ethNetwork)
  }

  async tapEthSepoliaNetwork() {
    await actions.tap(this.ethSepoliaNetwork)
  }

  async tapManageTokens() {
    await actions.tap(this.manageTokens)
  }

  async tapNetworksDropdown() {
    await actions.tap(this.networksDropdown)
  }

  async tapNetworksDropdownBTC() {
    try {
      await actions.tap(this.networksDropdownBTC)
    } catch (error) {
      console.log(error)
      await actions.tap(this.manageNetworks)
    }
  }

  async tapNetworksDropdownBTCTestNet() {
    await actions.tap(this.networksDropdownBTCTestNet)
  }

  async tapNetworksDropdownETH() {
    await actions.tap(this.networksDropdownETH)
  }

  async tapNetworksDropdownAVAX(network = this.networksDropdownAVAX) {
    await actions.tap(network)
  }

  async tapManageNetworks() {
    await actions.tap(this.manageNetworks)
  }

  async verifyWatchListCarousel(tokens: string[]) {
    for (const token of tokens) {
      await actions.waitFor(
        selectors.getById(`watchlist_carousel__${token.toLowerCase()}`)
      )
      await actions.isVisible(
        selectors.getById(`watchlist_carousel__${token.toLowerCase()}`)
      )
    }
  }

  async tapActiveNetwork(network = 'Avalanche (C-Chain)') {
    await actions.waitFor(
      selectors.getById(portfolio.activeNetwork + network),
      60000
    )
    await actions.tap(selectors.getById(portfolio.activeNetwork + network))
  }

  async tapToken(token = 'avax') {
    await actions.tap(
      selectors.getById(`${portfolio.portfolioTokenItem}${token}`)
    )
  }

  async getFiatBalance() {
    const balance = await actions.getText(
      selectors.getById('token_header_fiat_balance')
    )
    const amount = balance.split(' ')[0] || '0'
    console.log(`Fiat balance: ${amount}`)
    return amount
  }

  async verifyOwnedTokenActionButtons(buttons: string[]) {
    for (const button of buttons) {
      if (button) {
        await actions.waitFor(selectors.getById(`action_button__${button}`))
      }
    }
  }

  async verifyActiveNetwork(network: string) {
    await actions.waitFor(
      selectors.getById(portfolio.activeNetwork + network),
      60000
    )
    await this.tapNetworksDropdown()
    await actions.waitFor(
      selectors.getById(portfolio.networkDropdownCheckMark + network)
    )
    await actions.tap(selectors.getByText(network))
  }

  async verifyNetworkRemoved(network: string) {
    await this.tapNetworksDropdown()
    await actions.isNotVisible(
      selectors.getById(portfolio.networksDropdownItem + network)
    )
    await this.tapNetworksDropdownAVAX()
  }

  async verifyAccountName(name: string) {
    await actions.isVisible(selectors.getByText(name))
  }

  async getTotalBalance() {
    // The total balance on Portfolio header
    return await actions.getText(selectors.getById('portfolio_balance__total'))
  }

  async getActiveNetworkBalance() {
    // Balance of the active network on Portfolio tab
    return await actions.getText(this.activeNetworkBalance)
  }

  //////// NEW GEN ////////
  async goToAssets() {
    await bottomTabsPage.tapPortfolioTab()
    await this.tapAssetsTab()
  }

  async verifyAssetRow(index: number, isListView = true) {
    const prefix = isListView ? 'list' : 'grid'
    await actions.waitFor(selectors.getById(`${prefix}_fiat_balance__${index}`))
    await actions.isVisible(
      selectors.getById(`${prefix}_token_balance__${index}`)
    )
  }

  async displayAssetsByNetwork(network: string) {
    if (network !== commonEls.bitcoin) {
      if (network === commonEls.pChain_2 || network === commonEls.xChain_2) {
        try {
          await actions.waitFor(selectors.getByText('No assets yet'))
          return
        } catch (e) {
          console.log('No assets yet message not found')
        }
      }
      await actions.waitFor(selectors.getById(`network_logo__${network}`))
    }

    const networksToHide = {
      [commonEls.cChain_2]: [
        commonEls.pChain_3,
        commonEls.xChain_3,
        commonEls.ethereum
      ],
      [commonEls.pChain_3]: [
        commonEls.cChain_2,
        commonEls.xChain_3,
        commonEls.ethereum
      ],
      [commonEls.xChain_3]: [
        commonEls.pChain_2,
        commonEls.cChain_2,
        commonEls.ethereum
      ],
      [commonEls.ethereum]: [
        commonEls.pChain_3,
        commonEls.xChain_3,
        commonEls.cChain_2
      ],
      default: [
        commonEls.pChain_3,
        commonEls.xChain_3,
        commonEls.ethereum,
        commonEls.cChain_2
      ]
    }

    for (const hiddenNetwork of networksToHide[network] ||
      networksToHide.default) {
      await actions.isNotVisible(
        selectors.getById(`network_logo__${hiddenNetwork}`)
      )
    }
  }

  async displayAssetsByAllNetwork() {
    await actions.waitFor(
      selectors.getById(`network_logo__${commonEls.cChain_2}`)
    )
    await actions.waitFor(
      selectors.getById(`network_logo__${commonEls.ethereum}`)
    )
  }

  async verifyFiatCurrency(currency = '$') {
    await actions.waitFor(selectors.getById('list_fiat_balance__0'))
    const fiatBal =
      (await actions.getText(selectors.getById('list_fiat_balance__0'))) ?? ''
    console.log(`${fiatBal}`)
    assert(fiatBal.includes(currency), 'Fiat currency not found')
  }

  async tapBuy() {
    await actions.tap(this.buyButton)
  }

  async tapBridge() {
    await actions.tap(this.bridgeButton)
  }

  async verifyActivityItem(
    from = commonEls.accountOneAddress,
    to = commonEls.accountTwoAddress
  ) {
    await actions.waitFor(selectors.getById(`tx__from_${from}_to_${to}`))
    console.log(`Verified the transaction activity: tx__from_${from}_to_${to}`)
  }

  async selectView(viewType = 'List view') {
    await actions.click(this.view)
    await commonElsPage.selectDropdownItem(viewType)
  }

  async verifyOwnedTokenDetail(token: string, buttons: string[]) {
    await this.tapToken(token)
    await this.verifyOwnedTokenActionButtons(buttons)
    const fiatBalance = await this.getFiatBalance()
    await commonElsPage.goBack(selectors.getByText(fiatBalance))
  }

  async verifyDefiSort(ascending = true, isGrid = true) {
    const prefix = isGrid ? portfolio.defiGridTitle : portfolio.defiListTitle
    const first = await actions.getText(selectors.getById(`${prefix}__0`))
    const second = await actions.getText(selectors.getById(`${prefix}__2`))
    console.log(`First: ${first}, Second: ${second}, Ascending: ${ascending}`)
    const compare = first.localeCompare(second)
    const isSorted = ascending ? compare <= 0 : compare >= 0
    assert.ok(isSorted, `Defi not sorted ${ascending ? 'A-Z' : 'Z-A'}`)
  }

  async tapDefiItem(index = 0, isGrid = true) {
    const prefix = isGrid ? portfolio.defiGridItem : portfolio.defiListItem
    await actions.waitFor(selectors.getById(`${prefix}__${index}`))
    await actions.tap(selectors.getById(`${prefix}__${index}`))
  }

  async tapDefiDetailBrowserBtn() {
    await actions.tap(this.defiDetailBrowserBtn)
  }

  async tapDefiBrowserBtn(index = 0, isGrid = true) {
    const prefix = isGrid
      ? portfolio.defiGridBrowserBtn
      : portfolio.defiListBrowserBtn
    await actions.tap(selectors.getById(`${prefix}__${index}`))
  }

  async getDefiItemPrice(index = 0, isGrid = true) {
    const prefix = isGrid ? portfolio.defiGridPrice : portfolio.defiListPrice
    return await actions.getText(selectors.getById(`${prefix}__${index}`))
  }

  async getDefiItemTitle(index = 0, isGrid = true) {
    const prefix = isGrid ? portfolio.defiGridTitle : portfolio.defiListTitle
    return await actions.getText(selectors.getById(`${prefix}__${index}`))
  }

  async verifyDefiItem(price: string, title: string) {
    await actions.waitFor(this.defiDetailPrice)
    await actions.isVisible(this.defiDetailTitle)
    const detailPrice = await actions.getText(this.defiDetailPrice)
    const detailTitle = await actions.getText(this.defiDetailTitle)
    assert.equal(detailPrice, price, `${detailPrice} not equal to ${price}`)
    assert.equal(detailTitle, title, `${detailTitle} not equal to ${title}`)
  }

  async verifyEmptyDefiScreen() {
    await actions.waitFor(this.defiEmptyScreenTitle)
    await actions.isVisible(this.defiEmptyScreenDescription)
    await actions.isVisible(this.defiEmptyScreenExploreBtn)
  }
}

export default new PortfolioPage()
