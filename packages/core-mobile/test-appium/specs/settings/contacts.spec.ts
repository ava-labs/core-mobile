import settings from '../../pages/settings.page'
import cl from '../../locators/commonEls.loc'
import cp from '../../pages/commonEls.page'
import { actions } from '../../helpers/actions'
import warmup from '../../helpers/warmup'

const networkAndAddress: Record<string, string> = {
  [cl.evm]: cl.myEvmAddress,
  [cl.xpChain]: cl.myXpAddress,
  [cl.bitcoin]: cl.myBtcAddress,
  [cl.solana]: cl.mySolanaAddress
}

const newAddress: Record<string, string> = {
  [cl.evm]: cl.myEvmAddress2
}

describe('Settings', () => {
  it('Contacts - Should add contact', async () => {
    // Verify empty contacts
    await warmup()
    await settings.goSettings()
    await settings.tapContacts()
    await settings.verifyEmptyContacts()
    await settings.tapAddAddressButton()
    await settings.addContactAddress(networkAndAddress, 'Core Dev')
    await settings.verifyContact(cl.myEvmAddress, 'Core Dev')
  })

  it('Contacts - Should edit contact', async () => {
    // Edit contact name & verify
    await settings.tapContactByName('Core Dev')
    await settings.editContactAddress(newAddress, 'Core QA')
    await settings.verifyContact(cl.myEvmAddress2, 'Core QA')
  })

  it('Contacts - Should search contact', async () => {
    // Search by contact name
    await cp.typeSearchBar('Core QA')
    await settings.verifyContact(cl.myEvmAddress2, 'Core QA')

    // Search by unknown address
    await cp.typeSearchBar(cl.myEvmAddress)
    await settings.verifyEmptyContacts()

    // Search by address
    await cp.typeSearchBar(cl.myEvmAddress2)
    await actions.dismissKeyboard()
    await settings.verifyContact(cl.myEvmAddress2, 'Core QA')
  })

  it('Contacts - Should delete contact', async () => {
    // Delete contact
    await settings.tapContactByName('Core QA')
    await cp.tapDelete()
    await cp.tapDelete()
    await settings.verifyEmptyContacts()
  })
})
