/* eslint-disable @typescript-eslint/no-explicit-any */
import Action from '../helpers/actions'
import accountManage from '../locators/accountManage.loc'
import { Platform } from '../helpers/constants'
import Assert from '../helpers/assertions'

class AccountManagePage {
  get account() {
    return by.text(accountManage.account)
  }

  get accountOne() {
    return by.text(accountManage.accountOne)
  }

  get accountDropdownTitle() {
    return by.id(accountManage.accountDropdownTitle)
  }

  get accountsDropdown() {
    return by.id(accountManage.accountsDropdown)
  }

  get editedAccount() {
    return by.text(accountManage.editedAccount)
  }

  get carrotSVG() {
    return by.id(accountManage.carrotSVG)
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

  get saveNewAccountName() {
    return by.text(accountManage.saveNewAccountName)
  }

  get secondAccount() {
    return by.text(accountManage.secondAccount)
  }

  get fourthAccount() {
    return by.text(accountManage.fourthaccount)
  }

  async tapAccountDropdownTitle(index = 0) {
    await Action.tapElementAtIndex(this.accountDropdownTitle, index)
  }

  async switchToReceivedAccount(accountNumber: string) {
    if (accountNumber === 'second') {
      await this.tapFirstAccount()
    } else {
      await this.tapSecondAccount()
    }
  }

  async tapFourthAccount() {
    try {
      await Assert.isVisible(this.fourthAccount)
      await Action.tapElementAtIndex(this.fourthAccount, 0)
    } catch (e) {
      console.log(e, ' fourth account does not exist, creating one...')
      await this.createAccount(4)
      await Action.tapElementAtIndex(this.fourthAccount, 0)
    }
  }

  async createSecondAccount() {
    await this.tapAccountDropdownTitle()
    await this.tapAddEditAccounts()
    await this.tapAddAccountButton()
    const result = await this.getSecondAvaxAddress()
    await this.tapFirstAccount()
    await this.tapDoneButton()
    return result
  }

  async switchToSecondAccount() {
    await this.tapAccountDropdownTitle()
    await this.tapSecondAccount()
  }

  async switchToFirstAccount() {
    await this.tapAccountDropdownTitle()
    await this.tapFirstAccount()
  }

  async createAccount(accountNumber: number) {
    await this.tapAddEditAccounts()
    for (let i = 0; i < accountNumber - 1; i++) {
      await this.tapAddAccountButton()
    }
    await this.tapDoneButton()
  }

  async getFirstAvaxAddress() {
    const result: any = await Action.getAttributes(this.avaxAddress, 0)
    if (Action.platform() === 'android') {
      return result.text.toLowerCase()
    } else {
      return result.elements[0].text.toLowerCase()
    }
  }

  async tapAccountsDropDown() {
    await Action.tap(this.accountsDropdown)
  }

  async getSecondAvaxAddress() {
    const result: any = await Action.getAttributes(this.avaxAddress, 2)
    return Action.platform() === Platform.Android
      ? result.text.toLowerCase()
      : result.elements[3].text.toLowerCase()
  }

  async setNewAccountName() {
    try {
      await Assert.isVisible(this.account)
      await Action.setInputText(this.account, 'AvaxWallet', 0)
      return 'AvaxWallet'
    } catch (e) {
      await Action.setInputText(this.editedAccount, 'testWallet1', 0)
      return 'testWallet1'
    }
  }

  async assertAccountName(walletName: string) {
    await Assert.isVisible(by.text(walletName))
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

  async tap2ndAccountMenu() {
    await Action.tapElementAtIndex(this.secondAccount, 0)
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

  async tapFirstAccount() {
    try {
      await Action.tapElementAtIndex(this.account, 0)
      console.log('Account name is testWallet1')
    } catch (e) {
      console.log('Account name is not testWallet1')
      try {
        await Action.tapElementAtIndex(this.editedAccount, 0)
      } catch (error) {
        await Action.tapElementAtIndex(this.accountOne, 0)
      }
    }
  }

  async tapSecondAccount() {
    await Action.waitForElement(this.secondAccount, 10000, 0)
    await Action.tapElementAtIndex(this.secondAccount, 0)
  }

  async tapSecondAccountMenu() {
    await Action.tapElementAtIndex(this.secondAccount, 0)
  }

  async tapCarrotSVG() {
    if (Action.platform() === 'android') {
      try {
        await this.tapFirstAccount()
      } catch (e) {
        await this.tap2ndAccountMenu()
      }
    } else {
      await Action.tapElementAtIndex(this.carrotSVG, 0)
    }
  }

  async checkAccountNameIsCorrect() {
    try {
      await Assert.isVisible(this.account)
    } catch (e) {
      try {
        await Assert.isVisible(this.editedAccount)
      } catch (error) {
        await this.tapAccountDropdownTitle()
        await this.tapFirstAccount()
      }
    }
  }
}

export default new AccountManagePage()
