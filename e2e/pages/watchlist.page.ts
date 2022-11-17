import watchlist from '../locators/watchlist.loc'
import Action from '../helpers/actions'

class WatchListPage {
  get recoverWalletBtn() {
    return by.id(watchlist.recoverWalletBtn)
  }

  get existingWalletBtn() {
    return by.text(watchlist.recoverWalletBtn)
  }

  get walletSVG() {
    return by.id(watchlist.walletSVG)
  }

  get newWalletBtn() {
    return by.text(watchlist.newWalletBtn)
  }

  get newWalletIcon() {
    return by.id(watchlist.newWalletIcon)
  }

  async tapWalletSVG() {
    await Action.tapElementAtIndex(this.walletSVG, 1)
  }

  async tapExistingWalletBtn() {
    await Action.tap(this.existingWalletBtn)
  }

  async tapRecoverWalletBtn() {
    await Action.tap(this.recoverWalletBtn)
  }

  async tapNewWalletBtn() {
    await Action.tapElementAtIndex(this.newWalletBtn, 1)
  }

  async tapNewWalletIcon() {
    await Action.tap(this.newWalletIcon)
  }
}

export default new WatchListPage()
