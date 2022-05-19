import React from 'react'
import Avatar from 'components/Avatar'
import { AVAX_TOKEN } from '@avalabs/wallet-react-components'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { ChainId } from '@avalabs/chains-sdk'

export function getIcon(chainId: number, size = 16) {
  switch (chainId) {
    case ChainId.AVALANCHE_MAINNET_ID:
    case ChainId.AVALANCHE_TESTNET_ID:
      return <Avatar.Token token={AVAX_TOKEN} size={size} />
    case ChainId.BITCOIN:
      return <BitcoinSVG size={size} />
    default:
      return <SettingsCogSVG size={size} />
  }
}
