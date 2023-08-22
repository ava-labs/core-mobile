import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { Share, ShareContent, ShareOptions } from 'react-native'

export function getContactValidationError(
  name?: string,
  address?: string,
  addressBtc?: string
) {
  if (!name) {
    return 'Name required'
  }
  if (!address && !addressBtc) {
    return 'Address required'
  }
  if (address && !isAddress(address)) {
    return 'Not valid EVM address'
  }
  if (addressBtc && !isBech32Address(addressBtc)) {
    return 'invalid BTC address'
  }
  return undefined
}

export function shareContact(
  contactName: string,
  cChainAddress?: string,
  btcAddress?: string
) {
  Share.share(
    {
      title: 'Share contact',
      message: getFormattedShareText(contactName, cChainAddress, btcAddress)
    } as ShareContent,
    {
      subject: 'subject',
      dialogTitle: 'dialogTitle'
    } as ShareOptions
  )
}

function getFormattedShareText(
  contactName: string,
  cChainAddress?: string,
  btcAddress?: string
) {
  return `Contact name: ${contactName} ${
    cChainAddress ? '\nC-Chain: ' + cChainAddress : ''
  } ${btcAddress ? '\nBTC: ' + btcAddress : ''}`
}
