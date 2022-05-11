import React from 'react'
import Avatar from 'components/Avatar'
import { AVAX_TOKEN } from '@avalabs/wallet-react-components'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { MAINNET_NETWORK, FUJI_NETWORK, BITCOIN_NETWORK } from 'store/network'

export function getIcon(chainId: string, size = 16) {
  switch (chainId) {
    case MAINNET_NETWORK.chainId:
    case FUJI_NETWORK.chainId:
      return <Avatar.Token token={AVAX_TOKEN} size={size} />
    case BITCOIN_NETWORK.chainId:
      return <BitcoinSVG size={size} />
    default:
      return <SettingsCogSVG size={size} />
  }
}
