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

  async tapWalletSVG() {
    await Action.tap(this.walletSVG)
  }

  async tapExistingWalletBtn() {
    await Action.tap(this.existingWalletBtn)
  }

  async tapRecoverWalletBtn() {
    await Action.tap(this.recoverWalletBtn)
  }
}

export default new WatchListPage()
