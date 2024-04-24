import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { Avalanche } from '@avalabs/wallets-sdk'
import { Share, ShareContent, ShareOptions } from 'react-native'
import Logger from 'utils/Logger'
import { NameAndAddresses } from 'screens/drawer/addressBook/types'

export function getContactValidationError({
  name,
  cChainAddress,
  pChainAddress,
  btcAddress
}: NameAndAddresses): string | undefined {
  if (!name) {
    return 'Name required'
  }
  if (!cChainAddress && !btcAddress && !pChainAddress) {
    return 'Address required'
  }
  if (cChainAddress && !isAddress(cChainAddress)) {
    return 'Not valid EVM address'
  }
  if (pChainAddress && !Avalanche.isBech32Address(pChainAddress, true)) {
    return 'Not valid P-chain address, must start with P-'
  }
  if (btcAddress && !isBech32Address(btcAddress)) {
    return 'Invalid BTC address'
  }
  return undefined
}

export function shareContact({
  name,
  cChainAddress,
  pChainAddress,
  btcAddress
}: NameAndAddresses): void {
  Share.share(
    {
      title: 'Share contact',
      message: getFormattedShareText({
        name,
        cChainAddress,
        btcAddress,
        pChainAddress
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
  pChainAddress,
  btcAddress
}: NameAndAddresses): string {
  return `Contact name: ${name} ${
    cChainAddress ? '\nC-Chain: ' + cChainAddress : ''
  } ${btcAddress ? '\nBTC: ' + btcAddress : ''} ${
    pChainAddress ? '\nP-Chain: ' + pChainAddress : ''
  }`
}
