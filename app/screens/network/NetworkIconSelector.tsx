import React from 'react'
import Avatar from 'components/Avatar'
import { AVAX_TOKEN } from '@avalabs/wallet-react-components'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import EthereumSvg from 'components/svg/Ethereum'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'

export function getIcon(network: string, size = 16) {
  if (network.startsWith('Avalanche')) {
    return <Avatar.Token token={AVAX_TOKEN} size={size} />
  } else if (network.startsWith('Bitcoin')) {
    return <BitcoinSVG size={size} />
  } else if (network.startsWith('Ethereum')) {
    return <EthereumSvg size={size} />
  } else {
    return <SettingsCogSVG size={size} />
  }
}
