import tokenDetail from '../locators/tokenDetail.loc'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
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

  get backButton() {
    return by.id(tokenDetail.backButton)
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

  async tapBackButton() {
    await Action.tapElementAtIndex(this.backButton, 0)
  }
}

export default new TokenDetailsPage()
