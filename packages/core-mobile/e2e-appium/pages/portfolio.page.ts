import assert from 'assert'
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import commonEls from '../locators/commonEls.loc'
import portfolio from '../locators/portfolio.loc'
import { Network } from '../helpers/networks'
import bottomTabsPage from './bottomTabs.page'
import commonElsPage from './commonEls.page'
import txPage from './transactions.page'

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

  get collectiblesHandler() {
    return selectors.getById(portfolio.collectiblesHandler)
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

  get hideBtn() {
    return selectors.getById(portfolio.hideBtn)
  }

  get resetFilterBtn() {
    return selectors.getById(portfolio.resetFilterBtn)
  }

  get noCollectiblesTitle() {
    return selectors.getByText(portfolio.noCollectiblesTitle)
  }

  get noCollectiblesDescription() {
    return selectors.getBySomeText(portfolio.noCollectiblesDescription)
  }

  get collectibleHero() {
    return selectors.getById(portfolio.collectibleHero)
  }

  get nftCreatedByTitle() {
    return selectors.getById(portfolio.nftCreatedByTitle)
  }

  get nftStandardTitle() {
    return selectors.getById(portfolio.nftStandardTitle)
  }

  get nftChainTitle() {
    return selectors.getById(portfolio.nftChainTitle)
  }

  get refreshBtn() {
    return selectors.getById(portfolio.refreshBtn)
  }

  get setAsMyAvatarBtn() {
    return selectors.getById(portfolio.setAsMyAvatarBtn)
  }

  get untitledDisplayed() {
    return selectors.getById(portfolio.untitledDisplayed)
  }

  get portfolioBalanceHeader() {
    return selectors.getById(portfolio.portfolioBalanceHeader)
  }

  get portfolioAccountName() {
    return selectors.getById(portfolio.portfolioAccountName)
  }

  get tokenHeaderFiatBalance() {
    return selectors.getById(portfolio.tokenHeaderFiatBalance)
  }

  tokenHeaderName(token: string) {
    return selectors.getById(`token_header_name__${token}`)
  }

  async verifyPorfolioScreen() {
    await actions.isVisible(this.viewAllBtn)
    await actions.isVisible(this.favoritesHeader)
    await actions.isVisible(this.networksHeader)
    await actions.isVisible(this.assetsTab)
    await actions.isVisible(this.colectiblesTab)
  }

  async swipeUpForNftDetails() {
    await actions.dragAndDrop(this.collectiblesHandler, [0, -1000])
  }

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

  async tapActivityTab() {
    await actions.tap(this.activityTab)
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
    await actions.click(this.networksDropdown)
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

  async tapToken(token = 'Avalanche') {
    // It taps on the name of the token on the portfolio asset (ex - Avalanche, Bitcoin, Wrapped Ether...)
    token = token.replace(/^Avalanche [PX]-Chain$/, 'Avalanche')
    await actions.tap(
      selectors.getById(`${portfolio.portfolioTokenItem}${token}`)
    )
  }

  async getFiatBalance() {
    const balance = await actions.getText(this.tokenHeaderFiatBalance)
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

  async verifyNetworksRemoved(networks: Network[]) {
    await this.tapAssetsTab()
    await this.tapFilterDropdown()
    for (const { name, haveToggle } of networks) {
      if (haveToggle) await actions.isNotVisible(selectors.getByText(name))
    }
    await this.tapFilterDropdown()
    await this.tapActivityTab()
    await this.tapNetworksDropdown()
    for (const { name, haveToggle } of networks) {
      if (haveToggle) await actions.isNotVisible(selectors.getByText(name))
    }
    await this.dismissNetworkDropdown()
  }

  async dismissNetworkDropdown(network = commonEls.cChain) {
    if (driver.isAndroid) {
      await actions.click(selectors.getBySomeText(network))
    }
  }

  async tapFilterDropdown() {
    await actions.click(commonElsPage.filterDropdown)
  }

  async verifyNetworksAdded(networks: Network[]) {
    await this.tapAssetsTab()
    await this.tapFilterDropdown()
    for (const { name, haveToggle } of networks) {
      if (haveToggle) await actions.isVisible(selectors.getByText(name))
    }
    await this.tapFilterDropdown()
    await this.tapActivityTab()
    await this.tapNetworksDropdown()
    for (const { name, haveToggle } of networks) {
      if (haveToggle) await actions.isVisible(selectors.getByText(name))
    }
    await this.dismissNetworkDropdown()
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

  async verifyCollectibleRow(isListView = false) {
    const viewType = isListView ? 'list' : 'grid'
    await actions.waitFor(selectors.getById(`nft_${viewType}_item__0`), 60000)
  }

  async verifyCollectiblesByNetwork(networkId: string | undefined = undefined) {
    if (networkId) {
      const shouldNotVisibleNetworkId =
        networkId === commonEls.cChainId
          ? commonEls.ethChainId
          : commonEls.cChainId
      await actions.isVisible(selectors.getById(`nft_by_network__${networkId}`))
      await actions.isNotVisible(
        selectors.getById(`nft_by_network__${shouldNotVisibleNetworkId}`)
      )
    } else {
      await actions.isVisible(
        selectors.getById(`nft_by_network__${commonEls.cChainId}`)
      )
      await actions.isVisible(
        selectors.getById(`nft_by_network__${commonEls.ethChainId}`)
      )
    }
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
    await actions.waitFor(this.tokenHeaderName(token))
    await this.verifyOwnedTokenActionButtons(buttons)
    const fiatBalance = await this.getFiatBalance()
    await commonElsPage.goBack(selectors.getByText(fiatBalance))
    await actions.waitFor(selectors.getByText(fiatBalance))
  }

  async toggleCollectible(goOff = true, prefix = 'The Free Mint') {
    const testID = goOff ? `${prefix}_displayed` : `${prefix}_blocked`
    await actions.longPress(selectors.getById(testID))
  }

  async verifyCollectibleDetail(isCChain = true, index = 0) {
    const network = isCChain ? commonEls.cChain_2 : commonEls.ethereum
    await actions.tap(selectors.getById(`${portfolio.nftListItem}${index}`))
    await actions.waitFor(this.collectibleHero)
    await this.swipeUpForNftDetails()
    // top actions buttons
    await actions.waitFor(this.hideBtn)
    await actions.isVisible(txPage.sendButton)
    // contents
    await actions.isVisible(this.nftCreatedByTitle)
    await actions.verifyText('ERC1155', this.nftStandardTitle)
    await actions.verifyText(network, this.nftChainTitle)
    // bottom buttons
    if (isCChain) {
      await actions.isVisible(this.refreshBtn)
    }
  }

  async verifyNftEmptyScreen(isEmpty = true) {
    if (isEmpty) {
      await actions.waitFor(this.noCollectiblesTitle)
      await actions.isVisible(this.noCollectiblesDescription)
    } else {
      await actions.isNotVisible(this.noCollectiblesTitle)
      await actions.isNotVisible(this.noCollectiblesDescription)
    }
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

  async verifyCollectiblesSort(ascending = true) {
    const prefix = portfolio.collectibleListTitle
    const first = await actions.getText(selectors.getById(`${prefix}__0`))
    const second = await actions.getText(selectors.getById(`${prefix}__1`))
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
    await actions.verifyText(price, this.defiDetailPrice)
    await actions.verifyText(title, this.defiDetailTitle)
  }

  async verifyEmptyDefiScreen() {
    await actions.waitFor(this.defiEmptyScreenTitle)
    await actions.isVisible(this.defiEmptyScreenDescription)
    await actions.isVisible(this.defiEmptyScreenExploreBtn)
  }

  async tapHide() {
    await actions.tap(this.hideBtn)
    await actions.delay(1000)
  }

  async tapResetFilterBtn() {
    await actions.tap(this.resetFilterBtn)
  }

  async verifyCollectibleHidden(nft = portfolio.managedNft) {
    await commonElsPage.typeSearchBar(nft)
    await this.toggleCollectible(true, nft)
    await commonElsPage.dismissBottomSheet()
    await actions.isNotVisible(selectors.getByText(nft))
  }

  async verifyCollectibleShown(nft = portfolio.managedNft) {
    await commonElsPage.typeSearchBar(nft)
    await this.toggleCollectible(false, nft)
    await commonElsPage.dismissBottomSheet()
    await actions.isVisible(selectors.getByText(nft))
  }

  async verifyUnreachableHidden() {
    await actions.isEnabled(this.untitledDisplayed, false)
    await commonElsPage.dismissBottomSheet()
    await actions.isNotVisible(selectors.getByText(portfolio.untitledNft))
  }

  async verifyBalanceHeader() {
    await actions.waitFor(commonElsPage.loadingSpinnerHidden)
    await actions.isVisible(this.portfolioBalanceHeader)
    await actions.isNotVisible(commonElsPage.loadingSpinnerVisible)
  }

  async verifyAssetsList(token = 'Avalanche') {
    const start = performance.now()
    await actions.waitFor(commonElsPage.loadingSpinnerHidden)
    await actions.isNotVisible(commonElsPage.inProgress)
    await actions.isVisible(this.portfolioTokenList)
    await actions.isVisible(
      selectors.getById(`${portfolio.portfolioTokenItem}${token}`)
    )
    return start
  }
}

export default new PortfolioPage()
