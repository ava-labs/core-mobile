/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu.page'
import { warmup } from '../../helpers/warmup'

describe('Address Book', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify empty contacts', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAddressBook()
    await Assert.isVisible(BurgerMenuPage.emptyContacts)
    await Assert.isVisible(BurgerMenuPage.emptyContactsText)
    await Assert.isVisible(BurgerMenuPage.addAddressButton)
  })

  it('Should add contact', async () => {
    await BurgerMenuPage.tapAddAddressButton()
    await BurgerMenuPage.inputContactName()
    await BurgerMenuPage.inputAvaxAddress()
    await BurgerMenuPage.inputBtcAddress()
    await BurgerMenuPage.tapSave()
    await Assert.isVisible(BurgerMenuPage.contactName)
    await Assert.isNotVisible(BurgerMenuPage.emptyContacts)
    await Assert.isNotVisible(BurgerMenuPage.emptyContactsText)
  })

  it('Should renamed contact', async () => {
    await BurgerMenuPage.tapContactName()
    await BurgerMenuPage.tapEdit()
    await BurgerMenuPage.inputNewContactName()
    await BurgerMenuPage.tapSave()
    await Assert.isVisible(BurgerMenuPage.newContactName)
    await Assert.isNotVisible(BurgerMenuPage.contactName)
  })

  it('Should delete contact', async () => {
    await BurgerMenuPage.tapEdit()
    await BurgerMenuPage.tapDeleteContact()
    await BurgerMenuPage.tapDelete()
    await Assert.isNotVisible(BurgerMenuPage.newContactName)
    await Assert.isVisible(BurgerMenuPage.emptyContacts)
    await Assert.isVisible(BurgerMenuPage.emptyContactsText)
  })
})
