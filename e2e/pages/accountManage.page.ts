/* eslint-disable @typescript-eslint/no-explicit-any */
import Action from '../helpers/actions'
import accountManage from '../locators/accountManage.loc'
import { Platform } from '../helpers/constants'

class AccountManagePage {
  get account() {
    return by.text(accountManage.account)
  }

  get addAccountButton() {
    return by.text(accountManage.addAccountButton)
  }

  get addEditAccount() {
    return by.text(accountManage.addEditAccounts)
  }

  get avaxAddress() {
    return by.id(accountManage.avaxAddress)
  }

  get doneButton() {
    return by.text(accountManage.doneButton)
  }

  get editAccount() {
    return by.text(accountManage.editAccount)
  }

  get newAccountName() {
    return by.text(accountManage.newAccountName)
  }

  get saveNewAccountName() {
    return by.text(accountManage.saveNewAccountName)
  }

  get secondAccount() {
    return by.text(accountManage.secondAccount)
  }

  async createSecondAccount() {
    await this.tapAccountMenu()
    await this.tapAddEditAccounts()
    await this.tapAddAccountButton()
    const result = await this.getSecondAvaxAddress()
    await this.tapAccountMenu()
    await this.tapDoneButton()
    return result
  }

  async getFirstAvaxAddress() {
    const result: any = await Action.getAttributes(this.avaxAddress, 0)
    return Action.platform() === Platform.Android
      ? result.text.toLowerCase()
      : result.elements[0].text.toLowerCase()
  }

  async getSecondAvaxAddress() {
    const result: any = await Action.getAttributes(this.avaxAddress, 2)
    return Action.platform() === Platform.Android
      ? result.text.toLowerCase()
      : result.elements[3].text.toLowerCase()
  }

  async setNewAccountName() {
    await Action.setInputText(this.account, accountManage.newAccountName, 0)
  }

  async tapAddAccountButton() {
    await Action.tapElementAtIndex(this.addAccountButton, 0)
  }

  async tapAddEditAccounts() {
    await Action.tapElementAtIndex(this.addEditAccount, 0)
  }

  async tapAccountMenu() {
    await Action.tapElementAtIndex(this.account, 0)
  }

  async tapDoneButton() {
    await Action.tapElementAtIndex(this.doneButton, 0)
  }

  async tapEditAccount() {
    await Action.tapElementAtIndex(this.editAccount, 0)
  }

  async tapSaveNewAccountName() {
    await Action.tapElementAtIndex(this.saveNewAccountName, 0)
  }

  async tapSecondAccount() {
    await Action.tapElementAtIndex(this.secondAccount, 0)
  }
}

export default new AccountManagePage()
