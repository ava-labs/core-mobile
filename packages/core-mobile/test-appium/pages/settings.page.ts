import { actions } from '../helpers/actions'
import settings from '../locators/settings.loc'
import { selectors } from '../helpers/selectors'

class Settings {
  get addWalletBtn() {
    return selectors.getById(settings.addWalletBtn)
  }

  get createNewAccountBtn() {
    return selectors.getById(settings.createNewAccountBtn)
  }

  get manageAccountsTitle() {
    return selectors.getByText(settings.manageAccountsTitle)
  }

  get manageAccountsBtn() {
    return selectors.getById(settings.manageAccountsBtn)
  }

  get settingsBtn() {
    return selectors.getById(settings.settingsBtn)
  }

  get accountList() {
    return selectors.getById(settings.accountList)
  }

  get settingsScrollView() {
    return selectors.getById(settings.settingsScrollView)
  }

  async selectAccount(name: string) {
    await actions.tap(selectors.getById(`manage_accounts_list__${name}`))
  }

  async tapAddWalletBtn() {
    await actions.tap(this.addWalletBtn)
  }

  async addAccount(accountNum = 2) {
    const ele = selectors.getById(`manage_accounts_list__Account ${accountNum}`)
    while (!(await actions.isVisibleTrueOrFalse(ele))) {
      await this.tapAddWalletBtn()
      await actions.tap(this.createNewAccountBtn)
      await actions.tap(this.manageAccountsTitle)
    }
  }

  async tapManageAccountsBtn() {
    await actions.waitFor(this.settingsScrollView, 10000)
    while (!(await actions.isVisibleTrueOrFalse(this.manageAccountsBtn))) {
      await actions.swipe('left', 0.5, this.accountList)
    }
    await actions.tap(this.manageAccountsBtn)
  }

  async goSettings() {
    await actions.click(this.settingsBtn)
  }
  async createNthAccount(account = 2, activeAccount = settings.account) {
    await this.goSettings()
    await this.tapManageAccountsBtn()
    await this.addAccount(account)
    await this.selectAccount(activeAccount)
  }
}

export default new Settings()
