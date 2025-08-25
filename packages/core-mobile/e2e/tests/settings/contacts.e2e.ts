/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import sp from '../../pages/settings.page'
import cl from '../../locators/commonEls.loc'
import cp from '../../pages/commonEls.page'
import actions from '../../helpers/actions'

const networkAndAddress: Record<string, string> = {
  [cl.evm]: cl.myEvmAddress,
  [cl.xpChain]: cl.myXpAddress,
  [cl.bitcoin]: cl.myBtcAddress,
  [cl.solana]: cl.mySolanaAddress
}

const newAddress: Record<string, string> = {
  [cl.evm]: cl.myEvmAddress2
}

describe('Settings - Contacts', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify empty contacts', async () => {
    // Verify empty contacts
    await sp.goSettings()
    await sp.tapContacts()
    await sp.verifyEmptyContactsScreen()
  })

  it('Should add contact', async () => {
    // Add contact
    await sp.tapAddAddressButton()
    await sp.addContactAddress(networkAndAddress, 'Core Dev')
    await sp.verifyContact(cl.myEvmAddress, 'Core Dev')
  })

  it('Should edit contact', async () => {
    // Edit contact name & verify
    await sp.tapContactByName('Core Dev')
    await sp.editContactAddress(newAddress, 'Core QA')
    await sp.verifyContact(cl.myEvmAddress2, 'Core QA')
  })

  it('Should search contact', async () => {
    // Search by contact name
    await cp.typeSearchBar('Core QA')
    await sp.verifyContact(cl.myEvmAddress2, 'Core QA')

    // Search by unknown address
    await cp.typeSearchBar(cl.myEvmAddress)
    await sp.verifyEmptyContactsScreen()

    // Search by address
    await cp.typeSearchBar(cl.myEvmAddress2)
    await actions.dismissKeyboard()
    await sp.verifyContact(cl.myEvmAddress2, 'Core QA')
  })

  it('Should delete contact', async () => {
    // Delete contact
    await sp.tapContactByName('Core QA')
    await cp.tapDelete()
    await cp.tapDelete()
    await sp.verifyEmptyContactsScreen()
  })
})
