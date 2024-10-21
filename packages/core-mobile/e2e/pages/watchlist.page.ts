import watchlist from '../locators/watchlist.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'
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

  get allWatchList() {
    return by.id(watchlist.allWatchList)
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
      await Action.waitForElementNoSync(
        by.id(`watchlist_item__${token.toLowerCase()}`)
      )
      await Assert.isVisible(by.id(`watchlist_item__${token.toLowerCase()}`))
    }
  }

  async setWatchListToken(tokenSymbol: string) {
    await Action.setInputText(this.searchBar, tokenSymbol)
  }

  async clearSearchBar() {
    await Action.tap(this.searchBar)
    await Action.tap(by.text('Cancel'))
  }

  async reorderToken(token: string) {
    const direction: Detox.Direction[] = ['up', 'down']
    const random = Action.shuffleArray(direction)[0]
    console.log('token', token)
    console.log('token', random)
    await Action.waitForElementNoSync(by.id(`drag_handle_svg__${token}`))
    await Action.drag(by.id(`drag_handle_svg__${token}`), random)
    await delay(1000)
  }

  async verifyWatchlistDropdownItems(option: string) {
    await Action.waitForElementNoSync(by.id('watchlist_dropdown'))
    await Assert.isVisible(by.id('watchlist_dropdown'))
    await Assert.isVisible(by.text('Market Cap'))
    await Assert.isVisible(by.text('Price'))
    await Assert.isVisible(by.text('Volume'))
    await Assert.isVisible(by.text('Gainers'))
    await Assert.isVisible(by.text('Losers'))
    await Assert.isVisible(by.text(`checked__${option}`))
  }

  async getTopTokenFromList() {
    const a = await Action.getElementTextNoSync(this.allWatchList)
    console.log(a)
  }

  async selectSortOption(option: string) {
    await Action.waitForElementNoSync(by.text(option))
    await Action.tap(by.text(option))
  }

  async verifySortOption(option: string) {
    await Action.waitForElementNoSync(by.text(`Sort by: ${option}`))
    await Action.waitForElementNoSync(
      by.id(`watchlist_selected_filter__${option}`)
    )
    await commonElsPage.tapCarrotSVG()
    await Action.waitForElementNoSync(by.text(`checked__${option}`))
    await commonElsPage.tapCarrotSVG()
  }
}

export default new WatchListPage()
