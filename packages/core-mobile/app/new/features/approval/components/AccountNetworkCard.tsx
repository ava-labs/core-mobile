import { Separator, View } from '@avalabs/k2-alpine'
import { getNetworkSymbol } from 'consts/chainIdsWithIncorrectSymbol'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { Account } from './Account'
import { Network } from './Network'

type NetworkData = {
  logoUri?: string
  name: string
  chainId?: number
}

/**
 * Shared account + network summary card used across every batch-approval
 * screen (overview, each transaction step, and the final confirm). Previously
 * this markup was duplicated inline in BatchApprovalScreen and BatchTxStep;
 * consolidating it keeps the three surfaces visually identical and derives the
 * L2 symbol in one place. Renders nothing when neither field is present.
 */
export const AccountNetworkCard = ({
  account,
  network,
  style
}: {
  account?: string
  network?: NetworkData
  style?: StyleProp<ViewStyle>
}): JSX.Element | null => {
  if (!account && !network) return null

  const chainId = network?.chainId
  const symbol = getNetworkSymbol(chainId)

  return (
    <View
      style={style}
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12
      }}>
      {account && <Account address={account} />}
      {account && network && <Separator sx={{ marginHorizontal: 16 }} />}
      {network && (
        <Network
          logoUri={network.logoUri}
          symbol={symbol}
          name={network.name}
          chainId={chainId}
        />
      )}
    </View>
  )
}
