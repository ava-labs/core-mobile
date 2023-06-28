/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import AddressBookPage from '../../pages/burgerMenu/addressBook.page'

describe('Address Book', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify empty contacts', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAddressBook()
    await Assert.isVisible(AddressBookPage.emptyContacts)
    await Assert.isVisible(AddressBookPage.emptyContactsText)
    await Assert.isVisible(AddressBookPage.addAddressButton)
  })

  it('Should add contact', async () => {
    await AddressBookPage.tapAddAddressButton()
    await AddressBookPage.inputContactName()
    await AddressBookPage.inputAvaxAddress()
    await AddressBookPage.inputBtcAddress()
    await AddressBookPage.tapSave()
    await Assert.isVisible(AddressBookPage.contactName)
    await Assert.isNotVisible(AddressBookPage.emptyContacts)
    await Assert.isNotVisible(AddressBookPage.emptyContactsText)
  })

  it('Should renamed contact', async () => {
    await AddressBookPage.tapContactName()
    await AddressBookPage.tapEdit()
    await AddressBookPage.inputNewContactName()
    await AddressBookPage.tapSave()
    await Assert.isVisible(AddressBookPage.newContactName)
    await Assert.isNotVisible(AddressBookPage.contactName)
  })

  it('Should delete contact', async () => {
    await AddressBookPage.tapEdit()
    await AddressBookPage.tapDeleteContact()
    await AddressBookPage.tapDelete()
    await Assert.isNotVisible(AddressBookPage.newContactName)
    await Assert.isVisible(AddressBookPage.emptyContacts)
    await Assert.isVisible(AddressBookPage.emptyContactsText)
  })
})
