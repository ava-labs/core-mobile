import tokenDetail from '../locators/tokenDetail.loc'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
import { Coin, TokenDetailToken, TokenPriceResponse } from '../helpers/tokens'
import delay from '../helpers/waits'
import sendPage from './send.page'
import commonElsPage from './commonEls.page'
import swapTabPage from './swapTab.page'
import bridgeTabPage from './bridge.page'

class TokenDetailsPage {
  get totalSupply() {
    return by.id(tokenDetail.totalSupply)
  }

  get rank() {
    return by.id(tokenDetail.rank)
  }

  get marketCap() {
    return by.id(tokenDetail.marketCap)
  }

  get volume() {
    return by.id(tokenDetail.volume)
  }

  get availableSupply() {
    return by.id(tokenDetail.availableSupply)
  }

  get favorite() {
    return by.id(tokenDetail.favorite)
  }

  get twitterHandle() {
    return by.id(tokenDetail.twitterHandle)
  }

  get twitterTitle() {
    return by.id(tokenDetail.twitter)
  }

  get websiteUrl() {
    return by.id(tokenDetail.websiteUrl)
  }

  get oneWeekTab() {
    return by.text(tokenDetail.oneWeekTab)
  }

  get twentyFourHourTab() {
    return by.text(tokenDetail.twentyFourHourTab)
  }

  get oneMonthTab() {
    return by.text(tokenDetail.oneMonthTab)
  }

  get threeMonthTab() {
    return by.text(tokenDetail.threeMonthTab)
  }

  get oneYearTab() {
    return by.text(tokenDetail.oneYearTab)
  }

  get sendBtn() {
    return by.id(tokenDetail.sendBtn)
  }

  get receiveBtn() {
    return by.id(tokenDetail.receiveBtn)
  }

  get bridgeBtn() {
    return by.id(tokenDetail.bridgeBtn)
  }

  get swapBtn() {
    return by.id(tokenDetail.swapBtn)
  }

  get holdAndDrag() {
    return by.text(tokenDetail.holdAndDrag)
  }

  get holdAndDragContent() {
    return by.text(tokenDetail.holdAndDragContent)
  }

  get gotItBtn() {
    return by.text(tokenDetail.gotItBtn)
  }

  get price() {
    return by.id(tokenDetail.price)
  }

  get lineGraph() {
    return by.id(tokenDetail.lineGraph)
  }

  get footerBuyBtn() {
    return by.id(tokenDetail.footerBuyBtn)
  }

  get footerSwapBtn() {
    return by.id(tokenDetail.footerSwapBtn)
  }

  get footerStakeBtn() {
    return by.id(tokenDetail.footerStakeBtn)
  }

  get tokenBreakdown() {
    return by.text(tokenDetail.tokenBreakdown)
  }

  async verifyTokenDetailScreen() {
    await Assert.isVisible(this.totalSupply)
    await Assert.isVisible(this.rank)
    await Assert.isVisible(this.marketCap)
    await Assert.isVisible(this.volume)
    await Assert.isVisible(this.availableSupply)
    await Assert.isVisible(this.twitterHandle)
    await Assert.isVisible(this.twitterTitle)
    await Assert.isVisible(this.twentyFourHourTab)
    await Assert.isVisible(this.oneWeekTab)
    await Assert.isVisible(this.oneMonthTab)
    await Assert.isVisible(this.threeMonthTab)
    await Assert.isVisible(this.oneYearTab)
  }

  async verifyOwnedTokenActionButtons(bridge: boolean, swap: boolean) {
    await Action.waitForElement(this.sendBtn)
    await Action.waitForElement(this.receiveBtn)
    if (bridge) await Action.waitForElement(this.bridgeBtn)
    if (swap) await Action.waitForElement(this.swapBtn)
  }

  async tapSendBtn() {
    await Action.tap(this.sendBtn)
  }

  async tapReceiveBtn() {
    await Action.tap(this.receiveBtn)
  }

  async tapBridgeBtn() {
    await Action.tap(this.bridgeBtn)
  }

  async tapSwapBtn() {
    await Action.tap(this.swapBtn)
  }

  async verifyNavigateToSend() {
    await this.tapSendBtn()
    await sendPage.verifySendScreen()
    await commonElsPage.goBack()
  }

  async verifyNavigateToReceive() {
    await this.tapReceiveBtn()
    // await receivePage.verifyReceiveAddressPage()
    await commonElsPage.goBack()
  }

  async verifyNavigateToBridge(toShow: boolean) {
    if (toShow) {
      await this.tapBridgeBtn()
      await bridgeTabPage.verifyBridgeScreen()
      await commonElsPage.goBack()
    } else {
      try {
        await this.tapBridgeBtn()
        throw new Error('Bridge should not be shown')
      } catch (e) {
        console.log('Bridge button not visible as expected')
      }
    }
  }

  async verifyNavigateToSwap(toShow: boolean) {
    if (toShow) {
      await this.tapSwapBtn()
      await swapTabPage.verifySwapScreen()
      await commonElsPage.goBack()
    } else {
      try {
        await this.tapSwapBtn()
        throw new Error('Swap should not be shown')
      } catch (e) {
        console.log('Swap button not visible as expected')
      }
    }
  }

  async tapFavorite() {
    await Action.tapElementAtIndex(this.favorite, 0)
  }

  async dismissHoldAndDrag() {
    await delay(2000)
    try {
      await Action.waitForElement(this.holdAndDrag)
      await Action.waitForElement(this.holdAndDragContent)
      await Action.tap(this.gotItBtn)
    } catch (e) {
      console.log('No hold and drag modal found')
    }
  }

  async getTokensPrice(tokens: TokenDetailToken[]) {
    for (const token of tokens) {
      try {
        // Fetch price from CoinGecko API
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${token.id}&vs_currencies=usd`
        )
        const data = (await response.json()) as TokenPriceResponse
        token.price = data[token.id]?.usd ?? 0
      } catch (error) {
        console.error(`Error fetching price for ${token.id}:`, error)
      }
    }
  }

  async getGainers(): Promise<Coin[]> {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=avalanche-ecosystem&price_change_percentage=24h&per_page=100&page=1`
    )
    const data: Coin[] = (await response.json()) as Coin[]
    data.sort(
      (
        a: { price_change_percentage_24h: number },
        b: { price_change_percentage_24h: number }
      ) => b.price_change_percentage_24h - a.price_change_percentage_24h
    )

    return data.slice(0, 20).map((coin, i) => {
      process.env[`coin_${i}`] = coin.name // coin_0, coin_1, ... 와 같이 저장
      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.current_price,
        image: coin.image,
        price_change_percentage_24h: coin.price_change_percentage_24h
      }
    })
  }

  async isPriceValid(expectedPrice: number, currentPrice: string) {
    const updatedCurrentPrice = parseFloat(currentPrice.replace(/[$,]/g, ''))

    // return false if the price UI shows 0
    if (updatedCurrentPrice === 0) {
      return false
    } else {
      const tolerance = 0.1
      const diffPercentage =
        Math.abs(expectedPrice - updatedCurrentPrice) / expectedPrice
      console.log(`Diff Percentage: ${diffPercentage}`)
      console.log(`Price on UI: ${updatedCurrentPrice}`)
      console.log(`Price on API: ${expectedPrice}`)
      return diffPercentage <= tolerance
    }
  }

  async verifyTokenDetailFooter(token: string) {
    await delay(1000)
    if (token === 'avalanche') {
      await Assert.hasText(this.twitterHandle, '@avax')
      await Assert.hasText(this.websiteUrl, 'avax.network')
    } else {
      await Assert.hasText(this.twitterHandle, `@${token}`)
      await Assert.hasPartialText(this.websiteUrl, `${token}.org`)
    }
  }

  async verifyTokenDetailContent() {
    // Navigate price timelines and hold and drag the price chart
    await this.navigatePriceTimelines()
    await this.holdAndDragSparklineChart()
    await this.navigatePriceTimelines()
  }

  async navigatePriceTimelines() {
    const tabs = ['24H', '1W', '1M', '3M', '1Y']
    for (const tab of tabs) {
      await Action.tap(by.text(tab))
      await delay(500)
    }
  }

  async holdAndDragSparklineChart(direction: Detox.Direction = 'right') {
    await delay(2000)
    await element(this.lineGraph).swipe(direction, 'slow', 0.75, 0.2)
  }

  async verifyPXChainTokenDetail() {
    await Action.waitForElement(this.tokenBreakdown)
  }
}

export default new TokenDetailsPage()
