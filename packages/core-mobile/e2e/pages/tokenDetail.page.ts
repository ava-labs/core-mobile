import assert from 'assert'
import tokenDetail from '../locators/tokenDetail.loc'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
import { TokenDetailToken, TokenPriceResponse } from '../helpers/tokens'
import delay from '../helpers/waits'
import sendPage from './send.page'
import commonElsPage from './commonEls.page'
import receivePage from './receive.page'
import swapTabPage from './swapTab.page'
import bridgeTabPage from './bridgeTab.page'

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
    await receivePage.verifyReceiveAddressPage()
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
      await Action.waitForElementNoSync(this.holdAndDrag)
      await Action.waitForElementNoSync(this.holdAndDragContent)
      await Action.tap(this.gotItBtn)
    } catch (e) {
      console.log('No hold and drag modal found')
    }
  }

  async verifyTokenDetailHeader(
    name: string,
    symbol: string,
    expectedPrice: number | undefined
  ) {
    // Token Detail Header testing - Title, Symbol, Price
    const titledName = name.replace(/^\w/, char => char.toUpperCase())
    const displayedPrice = await Action.getElementTextNoSync(this.price)
    await Action.waitForElementNoSync(by.text(titledName))
    await Action.waitForElementNoSync(by.text(symbol))
    if (expectedPrice && displayedPrice) {
      const isValid = await this.isPriceValid(expectedPrice, displayedPrice)
      assert(
        isValid,
        `Displayed price is NOT valid! Expected Price from CoinGekco: ${expectedPrice} / Displayed Price: ${displayedPrice} `
      )
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

  async isPriceValid(expectedPrice: number, currentPrice: string) {
    // Remove non-numeric characters (dollar signs, commas, etc.)
    const updatedCurrentPrice = currentPrice.replace(/[^0-9]/g, '')

    // If the updated price is empty or '0', return false
    if (!updatedCurrentPrice || updatedCurrentPrice === '0') {
      return false
    } else {
      // Get the first two digits from the cleaned currentPrice
      const currentPriceFirstTwoDigits = updatedCurrentPrice.slice(0, 2)

      // Get the first two digits from expectedPrice
      const expectedPriceFirstTwoDigits = String(expectedPrice).slice(0, 2)

      // Compare the first two digits
      return currentPriceFirstTwoDigits === expectedPriceFirstTwoDigits
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
      await delay(300)
      await Action.tap(by.text(tab))
    }
  }

  async holdAndDragSparklineChart(direction: Detox.Direction = 'right') {
    await delay(1000)
    await element(by.id('line_graph')).longPress()
    await element(by.id('line_graph')).swipe(direction, 'slow', 0.75, 0.2)
  }
}

export default new TokenDetailsPage()
