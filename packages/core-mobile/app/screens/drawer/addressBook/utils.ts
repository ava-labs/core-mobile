import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { Avalanche } from '@avalabs/wallets-sdk'
import { Share, ShareContent, ShareOptions } from 'react-native'
import Logger from 'utils/Logger'
import { NameAndAddresses } from 'screens/drawer/addressBook/types'

export function getContactValidationError({
  name,
  cChainAddress,
  xpChainAddress,
  btcAddress
}: NameAndAddresses): string | undefined {
  if (!name) {
    return 'Name required'
  }
  if (!cChainAddress && !btcAddress && !xpChainAddress) {
    return 'Address required'
  }
  if (cChainAddress && !isAddress(cChainAddress)) {
    return 'Not valid EVM address'
  }
  if (xpChainAddress && !Avalanche.isBech32Address(xpChainAddress, true)) {
    return 'Not valid P-chain address, must start with P- '
  }
  if (btcAddress && !isBech32Address(btcAddress)) {
    return 'Invalid BTC address'
  }
  return undefined
}

export function shareContact({
  name,
  cChainAddress,
  xpChainAddress,
  btcAddress
}: NameAndAddresses): void {
  Share.share(
    {
      title: 'Share contact',
      message: getFormattedShareText({
        name,
        cChainAddress,
        btcAddress,
        xpChainAddress
      })
    } as ShareContent,
    {
      subject: 'subject',
      dialogTitle: 'dialogTitle'
    } as ShareOptions
  ).catch(Logger.error)
}

function getFormattedShareText({
  name,
  cChainAddress,
  xpChainAddress,
  btcAddress
}: NameAndAddresses): string {
  return `Contact name: ${name} ${
    cChainAddress ? '\nC-Chain: ' + cChainAddress : ''
  } ${btcAddress ? '\nBTC: ' + btcAddress : ''} ${
    xpChainAddress ? '\nP-Chain: ' + xpChainAddress : ''
  }`
}
