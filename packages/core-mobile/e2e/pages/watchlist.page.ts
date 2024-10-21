import watchlist from '../locators/watchlist.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'

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
        by.id(`watchlist_item__${token.toLowerCase()}`),
        10000
      )
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
