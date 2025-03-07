import assert from 'assert'
import watchlist from '../locators/watchlist.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'
import { Coin } from '../helpers/tokens'
import commonElsPage from './commonEls.page'

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
    await Action.waitForElementNoSync(
      by.id(`watchlist_item__${tokenSymbol}`),
      5000
    )
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
      await Action.waitForElementNoSync(
        by.id(`watchlist_item__${token.toLowerCase()}`),
        10000
      )
    }
  }

  async verifyTrendingTokens() {
    for (let i = 1; i <= 20; i++) {
      await Action.waitForElement(by.id(`trending_token_index__${i}`))
      if (i % 3 === 0) {
        await Action.swipeUp(
          by.id(`trending_token_index__${i}`),
          'slow',
          0.3,
          0
        )
      }
    }
  }

  async verifyTrendingTokenNavigation() {
    let tokenName = await Action.getElementText(
      by.id('trending_token_index__1'),
      0
    )
    const tokenValue = await Action.getElementText(
      by.id('trending_token_value__1'),
      0
    )
    tokenName = tokenName?.split('. ')[1]
    await Action.tap(by.id('trending_token_index__1'))
    if (tokenName && tokenValue) {
      console.log(`testing ${tokenName} & ${tokenValue}...`)
      await Action.waitForElement(by.text(tokenName))
      await Action.waitForElement(by.text(tokenValue))
    }
    await commonElsPage.goBack()
  }

  async searchToken(tokenSymbol: string) {
    await Action.setInputText(this.searchBar, tokenSymbol)
  }

  async clearSearchBar() {
    await Action.tap(this.searchBar)
    await Action.tap(by.text('Cancel'))
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
    await Action.waitForElementNoSync(by.id(`drag_handle_svg__${token}`))
    await Action.drag(by.id(`drag_handle_svg__${token}`), random)
    await delay(1000)
  }

  async verifyWatchlistDropdownItems(option: string) {
    await Action.waitForElementNoSync(by.id(`checked__${option}`))
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
    await Action.waitForElementNoSync(by.id(`dropdown_item__${option}`))
    await Action.tapElementAtIndex(
      by.id(`dropdown_item__${option}`),
      platformIndex
    )
  }
}

export default new WatchListPage()
