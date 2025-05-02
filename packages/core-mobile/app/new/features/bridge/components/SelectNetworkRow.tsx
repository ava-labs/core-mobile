import React from 'react'
import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Network } from '@avalabs/core-chains-sdk'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'

export const SelectNetworkRow = ({
  title,
  network,
  onPress
}: {
  title: string
  network?: Network
  onPress?: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <TouchableOpacity
      sx={{ padding: 16 }}
      onPress={onPress}
      disabled={!onPress}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <Text sx={{ fontWeight: 500 }}>{title}</Text>
        <View sx={{ gap: 8, flexDirection: 'row', alignItems: 'center' }}>
          {network && (
            <NetworkLogoWithChain
              network={network}
              networkSize={24}
              outerBorderColor={colors.$surfaceSecondary}
              showChainLogo={false}
            />
          )}
          <Text sx={{ color: '$textSecondary' }}>{network?.chainName}</Text>
          {onPress && (
            <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
