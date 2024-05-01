import addressBookLoc from '../../locators/burgerMenu/addressBook.loc'
import Actions from '../../helpers/actions'
import commonElsPage from '../commonEls.page'

class AddressBook {
  get addAddressButton() {
    return by.text(addressBookLoc.addAddressButton)
  }

  get nameText() {
    return by.text(addressBookLoc.nameText)
  }

  get edit() {
    return by.text(addressBookLoc.edit)
  }

  get deleteContact() {
    return by.text(addressBookLoc.deleteContact)
  }

  get emptyContacts() {
    return by.text(addressBookLoc.emptyContacts)
  }

  get emptyContactsText() {
    return by.text(addressBookLoc.emptyContactsText)
  }

  get delete() {
    return by.text(addressBookLoc.delete)
  }

  get contactName() {
    return by.text(addressBookLoc.contactName)
  }

  get newContactName() {
    return by.text(addressBookLoc.newContactName)
  }

  get saveButton() {
    return by.text(addressBookLoc.saveButton)
  }

  async tapDelete() {
    await Actions.tapElementAtIndex(this.delete, 0)
  }

  async tapEdit() {
    await Actions.tapElementAtIndex(this.edit, 0)
  }

  async tapAddAddressButton() {
    await Actions.tapElementAtIndex(this.addAddressButton, 0)
  }

  async tapContactName() {
    await Actions.tapElementAtIndex(this.contactName, 0)
  }

  async tapDeleteContact() {
    await Actions.tapElementAtIndex(this.deleteContact, 0)
  }

  async inputContactName() {
    await commonElsPage.enterTextInput(0, addressBookLoc.contactName)
    await Actions.tap(this.nameText)
  }

  async inputNewContactName() {
    await Actions.setInputText(
      commonElsPage.inputTextField,
      addressBookLoc.newContactName,
      0
    )
    await Actions.tap(this.nameText)
  }

  async inputAvaxAddress() {
    await Actions.setInputText(
      commonElsPage.inputTextField,
      addressBookLoc.contactAvaxAddress,
      1
    )
    await Actions.tap(this.nameText)
  }

  async inputBtcAddress() {
    await Actions.setInputText(
      commonElsPage.inputTextField,
      addressBookLoc.contactBtcAddress,
      2
    )
    await Actions.tap(this.nameText)
  }

  async tapSave() {
    try {
      await Actions.tapElementAtIndex(this.saveButton, 0)
    } catch (error) {
      await Actions.swipeUp(commonElsPage.inputTextField, 'slow', 0.0, 2)
      await Actions.tapElementAtIndex(this.saveButton, 0)
    }
  }
}

export default new AddressBook()
