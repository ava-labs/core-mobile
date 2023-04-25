import Actions from '../helpers/actions'
import { Platform } from '../helpers/constants'
import burgerMenu from '../locators/bugerMenu.loc'

const platformIndex2 = Actions.platform() === Platform.iOS ? 2 : 0

class BurgerMenuPage {
  get advanced() {
    return by.text(burgerMenu.advanced)
  }

  get addressBook() {
    return by.text(burgerMenu.addressBook)
  }

  get addAddressButton() {
    return by.text(burgerMenu.AddAddressButton)
  }

  get changePin() {
    return by.text(burgerMenu.changePin)
  }

  get contactName() {
    return by.text(burgerMenu.contactName)
  }

  get copyPhraseButton() {
    return by.text(burgerMenu.copyPhraseButton)
  }

  get currency() {
    return by.text(burgerMenu.currency)
  }

  get backbutton() {
    return by.id(burgerMenu.backbutton)
  }

  get burgerMenuButton() {
    return by.id(burgerMenu.burgerbutton)
  }

  get delete() {
    return by.text(burgerMenu.delete)
  }

  get deleteContact() {
    return by.text(burgerMenu.deleteContact)
  }

  get edit() {
    return by.text(burgerMenu.edit)
  }

  get enterYourPinHeader() {
    return by.text(burgerMenu.enterYourPinHeader)
  }

  get emptyContacts() {
    return by.text(burgerMenu.emptyContacts)
  }

  get emptyContactsText() {
    return by.text(burgerMenu.emptyContactsText)
  }

  get euroCurrency() {
    return by.text(burgerMenu.euroCurrency)
  }

  get euroSign() {
    return by.text(burgerMenu.euroSign)
  }

  get firstMnemonicWord() {
    return by.text(burgerMenu.firstMnemonicWord)
  }

  get lastMnemonicWord() {
    return by.text(burgerMenu.lastMnemonicWord)
  }

  get recoveeryPhraseHeader() {
    return by.text(burgerMenu.recoveeryPhraseHeader)
  }

  get securityAndPrivacy() {
    return by.text(burgerMenu.securityAndPrivacy)
  }

  get setNewPinHeader() {
    return by.text(burgerMenu.setNewPinHeader)
  }

  get switchButton() {
    return by.id(burgerMenu.switchButton)
  }

  get inputTextField() {
    return by.id(burgerMenu.inputTextField)
  }

  get iWroteItDownButton() {
    return by.text(burgerMenu.iWroteItDownButton)
  }

  get saveButton() {
    return by.text(burgerMenu.saveButton)
  }

  get showRecoveryPhrase() {
    return by.text(burgerMenu.showRecoveryPhrase)
  }

  get nameText() {
    return by.text(burgerMenu.nameText)
  }

  get newContactName() {
    return by.text(burgerMenu.newContactName)
  }

  get usdCurrency() {
    return by.text(burgerMenu.usdCurrency)
  }

  get usdSign() {
    return by.text(burgerMenu.usdSign)
  }

  async tapAdvanced() {
    await Actions.tapElementAtIndex(this.advanced, 0)
  }

  async tapAddAddressButton() {
    await Actions.tapElementAtIndex(this.addAddressButton, 0)
  }

  async tapAddressBook() {
    await Actions.tapElementAtIndex(this.addressBook, 0)
  }

  async tapBurgerMenuButton() {
    await Actions.tapElementAtIndex(this.burgerMenuButton, 0)
  }

  async tapChangePin() {
    await Actions.tapElementAtIndex(this.changePin, 0)
  }

  async tapContactName() {
    await Actions.tapElementAtIndex(this.contactName, 0)
  }

  async tapCurrency() {
    await Actions.tapElementAtIndex(this.currency, 0)
  }

  async tapDelete() {
    await Actions.tapElementAtIndex(this.delete, 0)
  }

  async tapDeleteContact() {
    await Actions.tapElementAtIndex(this.deleteContact, 0)
  }

  async tapEuroCurrency() {
    await Actions.tapElementAtIndex(this.euroCurrency, 0)
  }

  async tapEdit() {
    await Actions.tapElementAtIndex(this.edit, 0)
  }

  async tapSave() {
    await Actions.tapElementAtIndex(this.saveButton, 0)
  }

  async tapSecurityAndPrivacy() {
    await Actions.tapElementAtIndex(this.securityAndPrivacy, 0)
  }

  async tapShowRecoveryPhrase() {
    await Actions.tapElementAtIndex(this.showRecoveryPhrase, 0)
  }

  async tapUSDCurrency() {
    await Actions.tapElementAtIndex(this.usdCurrency, 0)
  }

  async switchToTestnet() {
    await Actions.tapElementAtIndex(this.switchButton, 0)
  }

  async swipeLeft() {
    await Actions.swipeLeft(
      by.id(burgerMenu.carrotSvg),
      'slow',
      0.75,
      platformIndex2
    )
  }

  async inputContactName() {
    await Actions.setInputText(this.inputTextField, burgerMenu.contactName, 0)
    await Actions.tap(this.nameText)
  }

  async inputNewContactName() {
    await Actions.setInputText(
      this.inputTextField,
      burgerMenu.newContactName,
      0
    )
    await Actions.tap(this.nameText)
  }

  async inputAvaxAddress() {
    await Actions.setInputText(
      this.inputTextField,
      burgerMenu.contactAvaxAddress,
      1
    )
    await Actions.tap(this.nameText)
  }

  async inputBtcAddress() {
    await Actions.setInputText(
      this.inputTextField,
      burgerMenu.contactBtcAddress,
      2
    )
    await Actions.tap(this.nameText)
  }

  async tapIWroteItDownButton() {
    await Actions.tapElementAtIndex(this.iWroteItDownButton, 0)
  }

  async tapBackbutton() {
    await Actions.tapElementAtIndex(this.backbutton, 0)
  }
}

export default new BurgerMenuPage()
