import watchlist from '../locators/watchlist.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'

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

  async tapWatchListToken(tokenSymbol: string) {
    await element(by.id(`watchlist_item__${tokenSymbol}`)).tap()
  }

  async verifyWatchlistElements() {
    await device.captureViewHierarchy()
    await Assert.isVisible(this.recoverWalletBtn)
  }
}

export default new WatchListPage()
