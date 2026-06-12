import { Network } from '@avalabs/core-chains-sdk'
import { Chip, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { getNetworkDisplayName } from 'common/utils/getNetworkDisplayName'
import React from 'react'
import { ScrollView } from 'react-native'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'

export const NetworkFilterChips = ({
  networks,
  selectedNetwork,
  onSelectNetwork
}: {
  networks: Network[] | undefined
  selectedNetwork: Network | undefined
  onSelectNetwork: (network: Network) => void
}): JSX.Element | null => {
  const { theme } = useTheme()

  if (!networks || networks.length <= 1) return null

  return (
    <ScrollView
      testID="network_selector_scroll"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}>
      {networks.map(network => {
        const isSelected = network.chainId === selectedNetwork?.chainId
        return (
          // Wrap in View to host the testID — Chip's ChipProps doesn't declare
          // testID even though TouchableOpacity would accept it via ...rest.
          <View
            key={network.chainId}
            testID={
              isSelected
                ? `selected_network_selector__${network.chainName}`
                : `network_selector__${network.chainName}`
            }>
            <Chip
              size="large"
              isSelected={isSelected}
              onPress={() => onSelectNetwork(network)}
              renderLeft={() => {
                // P/X chains get a single-letter badge so users can tell them
                // apart at a glance — `showChainLogo` triggers the existing
                // isPChain/isXChain branches in NetworkLogoWithChain that
                // render AVAX_P or AVAX_X (not the combined AVAX_XP).
                const showChainLogo =
                  isPChain(network.chainId) || isXChain(network.chainId)
                return (
                  <NetworkLogoWithChain
                    network={network}
                    networkSize={19}
                    showChainLogo={showChainLogo}
                    chainLogoSize={12}
                    outerBorderColor={theme.colors.$surfacePrimary}
                    chainLogoStyle={{
                      width: 14,
                      height: 14,
                      borderWidth: 1
                    }}
                  />
                )
              }}
              style={{
                minHeight: 36,
                paddingLeft: 8,
                paddingRight: 14,
                gap: 8
              }}>
              {getNetworkDisplayName(network)}
            </Chip>
          </View>
        )
      })}
    </ScrollView>
  )
}
