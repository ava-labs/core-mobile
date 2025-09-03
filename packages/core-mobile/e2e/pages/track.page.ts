import assert from 'assert'
import watchlist from '../locators/watchlist.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'
import { Coin } from '../helpers/tokens'
import commonElsPage from './commonEls.page'
import swapTabPage from './swapTab.page'
import bottomTabsPage from './bottomTabs.page'

class WatchListPage {
  get allTab() {
    return by.text(watchlist.allTab)
  }

  get existingWalletBtn() {
    return by.text(watchlist.recoverWalletBtn)
  }

  get favoritesTab() {
    return by.text(watchlist.favoritesTab)
  }

  get trendingTab() {
    return by.text(watchlist.trendingTab)
  }

  get newWalletBtn() {
    return by.text(watchlist.newWalletBtn)
  }

  get newWalletIcon() {
    return by.id(watchlist.newWalletIcon)
  }

  get recoverWalletBtn() {
    return by.id(watchlist.recoverWalletBtn)
  }

  get walletSVG() {
    return by.id(watchlist.walletSVG)
  }

  get alreadyHaveAWalletBtn() {
    return by.text(watchlist.alreadyHaveAWalletBtn)
  }

  get watchListTokenBtc() {
    return by.id(`watchlist_item__btc`)
  }

  get enterWalletBtn() {
    return by.id(watchlist.enterWalletBtn)
  }

  get searchBar() {
    return by.id(watchlist.searchBar)
  }

  get trackBuyBtn() {
    return by.id(watchlist.trackBuyBtn)
  }

  get trackViewBtn() {
    return by.id(watchlist.trackViewBtn)
  }

  async tapTrackBuyBtn(index = 0) {
    await Action.tapElementAtIndex(this.trackBuyBtn, index)
  }

  async tapTrackViewBtn(index = 0) {
    await Action.tapElementAtIndex(this.trackViewBtn, index)
  }

  async tapAlreadyHaveAWalletBtn() {
    await Action.tap(this.alreadyHaveAWalletBtn)
  }

  async tapEnterWalletBtn() {
    await Action.tap(this.enterWalletBtn)
  }

  async tapAllTab() {
    await Action.tap(this.allTab)
  }

  async tapExistingWalletBtn() {
    await Action.tap(this.existingWalletBtn)
  }

  async tapFavoritesTab() {
    await Action.tap(this.favoritesTab)
  }

  async tapNewWalletBtn() {
    await Action.tapElementAtIndex(this.newWalletBtn, 1)
  }

  async tapNewWalletIcon() {
    await Action.tap(this.newWalletIcon)
  }

  async tapRecoverWalletBtn() {
    await Action.tap(this.recoverWalletBtn)
  }

  async tapWalletSVG() {
    await Action.tapElementAtIndex(this.walletSVG, 1)
  }

  async tapWatchListToken(tokenSymbol: string, index = 0) {
    await Action.waitForElement(by.id(`watchlist_item__${tokenSymbol}`))
    await Action.tapElementAtIndex(
      by.id(`watchlist_item__${tokenSymbol}`),
      index
    )
  }

  async verifyWatchlistElements() {
    await device.captureViewHierarchy()
    await Assert.isVisible(this.recoverWalletBtn)
  }

  async verifyFavorites(tokens: string[]) {
    for (const token of tokens) {
      await Action.waitForElement(by.id(`market_token__${token}`))
    }
  }

  async goToFavorites() {
    await bottomTabsPage.tapTrackTab()
    await this.tapFavoritesTab()
  }

  async tapToken(token: string) {
    await Action.tapElementAtIndex(by.id(`market_token__${token}`), 0)
  }

  async addFavoriteToken(token: string) {
    await commonElsPage.typeSearchBar(token)
    await Action.dismissKeyboard()
    await this.tapToken(token)
    await this.tapStarOutline()
    await commonElsPage.dismissBottomSheet()
    await commonElsPage.clearSearchBar()
  }

  async removeFavoriteToken(token: string) {
    await this.tapToken(token)
    await this.tapStarFilled()
    await commonElsPage.dismissBottomSheet()
  }

  async tapStarOutline() {
    await delay(1000)
    await Action.tap(this.starOutline)
  }

  async tapStarFilled() {
    await delay(1000)
    await Action.tap(this.starFilled)
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

  async verifyTrendingTokens() {
    let i = 1
    while (i < 10) {
      try {
        await Action.waitForElement(by.id(`trending_token_name__${i}`))
      } catch (e) {
        await Action.swipeUp(
          by.id(`trending_token_name__${i - 1}`),
          'slow',
          0.25,
          0
        )
      }
      i++
    }
  }

  get topTrendingTokenName() {
    return by.id(watchlist.topTrendingTokenName)
  }

  get topTrendingTokenSymbol() {
    return by.id(watchlist.topTrendingTokenSymbol)
  }

  get topTrendingTokenValue() {
    return by.id(watchlist.topTrendingTokenValue)
  }

  get topTrendingTokenBuyBtn() {
    return by.id(watchlist.topTrendingTokenBuyBtn)
  }

  get topTrendingTokenCrown() {
    return by.id(watchlist.topTrendingTokenCrown)
  }

  get starFilled() {
    return by.id(watchlist.starFilled)
  }

  get starOutline() {
    return by.id(watchlist.starOutline)
  }

  get tokenDetailSwapBtn() {
    return by.id(watchlist.tokenDetailSwapBtn)
  }

  async tapBuyViaTokenDetail(tokenIndex = 1) {
    await this.tapTrendingToken(tokenIndex)
    await Action.waitForElement(this.tokenDetailSwapBtn, 20000)
    await Action.tap(this.tokenDetailSwapBtn)
  }

  async tapBuyViaTrack(tokenIndex = 1) {
    await Action.tap(by.id(`trending_token_buy_btn__${tokenIndex}`))
  }

  async swap(onTrackTab = true, tokenIndex = 1) {
    const symbol =
      (await Action.getElementText(
        by.id(`trending_token_symbol__${tokenIndex}`)
      )) ?? ''
    if (onTrackTab) {
      await this.tapBuyViaTrack(tokenIndex)
    } else {
      await this.tapBuyViaTokenDetail(tokenIndex)
    }
    console.log(`Swapping AVAX to ${symbol}....`)
    await commonElsPage.dismissTransactionOnboarding()
    await Action.waitForElement(swapTabPage.selectTokenTitleId, 20000)
    await Assert.hasText(swapTabPage.selectTokenTitleId, symbol, 1)
    await swapTabPage.enterAmountAndAdjust('0.00001')
    await commonElsPage.tapNextButton()
    await commonElsPage.tapApproveButton()
  }

  async verifyTopTrendingToken() {
    await Action.waitForElement(this.topTrendingTokenName)
    await Assert.isVisible(this.topTrendingTokenValue)
    await Assert.isVisible(this.topTrendingTokenBuyBtn)
    await Assert.isVisible(this.topTrendingTokenCrown)
  }

  async verifyTokenRow(token: Coin, tolerance = 7) {
    console.log(`Testing ${token.name}...`)
    await Action.waitForElementNotVisible(by.id('fallback_logo'))
    await Action.waitForElement(by.id(`avatar__logo_avatar`))
    await Action.waitForElement(by.text(token.symbol.toUpperCase()))
    await this.verifyPriceChangePercentage(
      token.price_change_percentage_24h,
      token.symbol,
      tolerance
    )
    await this.verifyTokenPrice(token.current_price, tolerance)
  }

  async verifyTokenPrice(apiPrice: number, tolerance: number) {
    const perc =
      (await Action.getElementText(by.id(`watchlist_price`))) || '$0.00'
    const uiPrice = parseFloat(perc.replace('$', ''))
    const percNum = Action.isWithinTolerance(apiPrice, uiPrice, tolerance)
    assert(percNum, `The tolerance is not within 7%: ${apiPrice} ${uiPrice}`)
  }

  async verifyPriceChangePercentage(
    percentage: number,
    symbol: string,
    tolerance: number
  ) {
    const perc =
      (await Action.getElementText(
        by.id(`price_movement_change__${symbol}`)
      )) || '(0)%'
    const match = perc.match(/\(\s*(\d+\.\d+)\s*%\)/)
    const result = match && match[1] ? parseFloat(match[1]) : 0
    if (result) {
      const percNum = Action.isWithinTolerance(result, percentage, tolerance)
      assert(percNum, `The tolerance is not within 7%: ${match} ${percentage}`)
    }
  }

  async reorderToken(token: string) {
    const direction: Detox.Direction[] = ['up', 'down']
    const random = Action.shuffleArray(direction)[0]
    await Action.waitForElement(by.id(`drag_handle_svg__${token}`))
    await Action.drag(by.id(`drag_handle_svg__${token}`), random)
    await delay(1000)
  }

  async verifyWatchlistDropdownItems(option: string) {
    await Action.waitForElement(by.id(`checked__${option}`))
    await Assert.isVisible(by.id('dropdown_item__Market Cap'))
    await Assert.isVisible(by.id('dropdown_item__Price'))
    await Assert.isVisible(by.id('dropdown_item__Volume'))
    await Assert.isVisible(by.id('dropdown_item__Gainers'))
    await Assert.isVisible(by.id('dropdown_item__Losers'))
  }

  async tapSortBtn() {
    await Action.tap(by.id('watchlist_sort_svg'))
    await delay(1000)
  }

  async getTopTokenPriceFromList() {
    await delay(1000)
    return await Action.getElementText(by.id('watchlist_price'))
  }

  async getTokens(): Promise<Coin[]> {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=avalanche-ecosystem&order=market_cap_desc&price_change_percentage=24h&per_page=250&page=1`
    let attempts = 0
    while (attempts < 2) {
      try {
        const response = await fetch(url)
        if (!response.ok)
          throw new Error(`Failed with status: ${response.status}`)
        return (await response.json()) as Coin[]
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Attempt ${attempts + 1} failed: ${error.message}`)
        } else {
          console.error(`Attempt ${attempts + 1} failed: Unknown error`)
        }
        attempts++
      }
    }

    throw new Error('Failed to fetch tokens after retry.')
  }

  async getGainers(): Promise<Coin[]> {
    const data = await this.getTokens()

    data.sort(
      (
        a: { price_change_percentage_24h: number },
        b: { price_change_percentage_24h: number }
      ) => b.price_change_percentage_24h - a.price_change_percentage_24h
    )
    console.log(data.slice(0, 5))
    return data.slice(0, 5).map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price,
      image: coin.image,
      price_change_percentage_24h: coin.price_change_percentage_24h
    }))
  }

  async selectSortOption(option: string) {
    const platformIndex = Action.platform() === 'ios' ? 1 : 0
    await Action.waitForElement(by.id(`dropdown_item__${option}`))
    await Action.tapElementAtIndex(
      by.id(`dropdown_item__${option}`),
      platformIndex
    )
  }

  async tapTrendingToken(tokenIndex = 1) {
    await Action.tap(by.id(`trending_token_name__${tokenIndex}`))
  }

  async verifyTokenDetailHeader(
    name: string,
    symbol: string,
    expectedPrice: string
  ) {
    await Action.waitForElement(by.text(symbol), 20000)
    await Assert.isVisible(by.text(name))
    await Assert.isVisible(by.text(expectedPrice), 1)
  }

  async getTopToken() {
    await Action.waitForElement(this.topTrendingTokenCrown)
    const name =
      (await Action.getElementText(this.topTrendingTokenName))?.split(
        '. '
      )[1] ?? ''

    const symbol = await Action.getElementText(this.topTrendingTokenSymbol)
    const amount = await Action.getElementText(this.topTrendingTokenValue)
    return [name, symbol, amount]
  }
}

export default new WatchListPage()
