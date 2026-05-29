import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { Chip, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import React from 'react'
import { ScrollView } from 'react-native'

const getNetworkDisplayName = (network: Network): string => {
  switch (network.chainId) {
    case ChainId.AVALANCHE_MAINNET_ID:
      return 'Avalanche (C-Chain)'
    case ChainId.AVALANCHE_TESTNET_ID:
      return 'Avalanche (C-Chain Testnet)'
    case ChainId.SOLANA_MAINNET_ID:
      return 'Solana'
    default:
      return network.chainName
  }
}

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
            testID={`network_selector__${network.chainName}`}>
            <Chip
              size="large"
              isSelected={isSelected}
              onPress={() => onSelectNetwork(network)}
              renderLeft={() => (
                <View sx={{ marginTop: 4, marginLeft: 4, marginBottom: 4 }}>
                  <NetworkLogoWithChain
                    network={network}
                    networkSize={19}
                    showChainLogo={false}
                    outerBorderColor={theme.colors.$surfaceSecondary}
                  />
                </View>
              )}
              style={{
                paddingLeft: 0,
                paddingRight: 10,
                gap: 5
              }}>
              {getNetworkDisplayName(network)}
            </Chip>
          </View>
        )
      })}
    </ScrollView>
  )
}
