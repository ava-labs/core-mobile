import { DappRpcRequest } from 'store/rpc/handlers/types'
import Logger from 'utils/Logger'
import { Contact } from 'Repo'
import { Account } from 'store/account'
import { ContactCollection } from 'store/addressBook'
import { CoreWebAccount } from './types'

export const hasValidPayload = (
  event: DappRpcRequest<string, unknown> | undefined
) => {
  if (event && 'payload' in event) {
    return true
  }

  Logger.error('dapp event without payload')
  return false
}

export const mapAccountToCoreWebAccount = (
  account: Account,
  activeIndex: number
): CoreWebAccount => ({
  index: account.index,
  name: account.title,
  addressC: account.address,
  addressBTC: account.addressBtc,
  active: account.index === activeIndex
})

export const mapContactToSharedContact = (contact: Contact): SharedContact => ({
  id: contact.id,
  name: contact.title,
  address: contact.address,
  addressBTC: contact.addressBtc
})

export const isContactExisted = (
  existingContacts: ContactCollection,
  contactId: string
) => {
  return Object.values(existingContacts).some(existingContact => {
    return existingContact.id === contactId
  })
}
