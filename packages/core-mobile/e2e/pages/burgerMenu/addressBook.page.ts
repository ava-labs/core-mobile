import addressBookLoc from '../../locators/burgerMenu/addressBook.loc'
import Actions from '../../helpers/actions'

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
    return by.id(addressBookLoc.deleteContact)
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

  get contactNameText() {
    return by.text(addressBookLoc.contactName)
  }

  get saveButton() {
    return by.id(addressBookLoc.saveButton)
  }

  get newContactTitle() {
    return by.text(addressBookLoc.newContact)
  }

  get nameField() {
    return by.id(addressBookLoc.nameField)
  }

  get addressField() {
    return by.id(addressBookLoc.addressField)
  }

  get btcAddressField() {
    return by.id(addressBookLoc.btcAddressField)
  }

  get pChainAddressField() {
    return by.id(addressBookLoc.pChainAddressField)
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
    await Actions.tapElementAtIndex(this.contactNameText, 0)
  }

  async tapDeleteContact() {
    await Actions.tap(this.deleteContact)
  }

  async inputContactName() {
    await Actions.setInputText(this.nameField, addressBookLoc.contactName)
    await Actions.tap(this.nameText)
  }

  async inputNewContactName() {
    await Actions.setInputText(this.nameField, addressBookLoc.newContactName, 0)
    await Actions.tap(this.nameText)
  }

  async inputAvaxAddress() {
    await Actions.setInputText(
      this.addressField,
      addressBookLoc.contactAvaxAddress
    )
    await Actions.tap(this.nameText)
  }

  async inputBtcAddress() {
    await Actions.setInputText(
      this.btcAddressField,
      addressBookLoc.contactBtcAddress
    )
    await this.tapSave()
  }

  async tapSave() {
    await Actions.tapElementAtIndex(this.saveButton, 0)
  }
}

export default new AddressBook()
