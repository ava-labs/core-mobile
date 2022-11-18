import { Contact as SharedContact } from '@avalabs/types'
import { getContactValidationError } from 'screens/drawer/addressBook/utils'
import Logger from 'utils/Logger'
import { DappEvent, DappSessionEvent } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isValidContact = (contact: any): contact is SharedContact => {
  return (
    getContactValidationError(
      contact?.name,
      contact?.address,
      contact?.addressBTC
    ) === undefined
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseContact = (params: any) => {
  const contact = params?.[0]

  if (isValidContact(contact)) {
    return contact
  }

  return undefined
}

export const hasValidPayload = (
  event: DappEvent | undefined
): event is Exclude<DappEvent, DappSessionEvent> => {
  if (event && 'payload' in event) {
    return true
  }

  Logger.error('dapp event without payload')
  return false
}
