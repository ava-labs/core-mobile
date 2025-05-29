import { Network } from '@avalabs/core-chains-sdk'
import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ListScreen } from 'common/components/ListScreen'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { HORIZONTAL_MARGIN } from 'common/consts'
import { useRouter } from 'expo-router'
import { SupportedReceiveEvmTokens } from 'features/receive/components/SupportedReceiveEvmTokens'
import React from 'react'
import { ListRenderItem } from 'react-native'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'

export const SelectNetworkScreen = ({
  networks,
  selected,
  onSelect
}: {
  networks: Network[]
  selected?: Network
  onSelect: (network: Network) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { back } = useRouter()

  const handleNetworkSelect = (network: Network): void => {
    onSelect(network)
    back()
  }

  const renderItem: ListRenderItem<Network> = ({ item, index }) => {
    const isLastItem = index === networks.length - 1

    const isAvalancheCChain = isAvalancheCChainId(item.chainId)

    const showChainLogo =
      isXPChain(item.chainId) ||
      isPChain(item.chainId) ||
      isXChain(item.chainId)

    return (
      <Pressable
        onPress={() => handleNetworkSelect(item)}
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: HORIZONTAL_MARGIN,
          height: 50,
          gap: HORIZONTAL_MARGIN
        }}>
        <NetworkLogoWithChain
          network={item}
          networkSize={36}
          outerBorderColor={theme.colors.$surfaceSecondary}
          showChainLogo={showChainLogo}
        />
        <View
          style={{
            flex: 1,
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: isLastItem ? 0 : 1,
            borderBottomColor: theme.colors.$borderPrimary,
            paddingRight: HORIZONTAL_MARGIN
          }}>
          <View style={{ flex: 1 }}>
            <Text
              testID={`select_network__${item.chainName}`}
              variant="buttonMedium">
              {item.chainName}
            </Text>
            {isAvalancheCChain && (
              <View
                sx={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8
                }}>
                <Text
                  variant="subtitle2"
                  style={{
                    color: theme.colors.$textSecondary
                  }}>
                  Also supporting
                </Text>
                <SupportedReceiveEvmTokens
                  iconSize={18}
                  style={{
                    justifyContent: 'flex-start'
                  }}
                />
              </View>
            )}
          </View>
          {selected?.chainId === item.chainId && (
            <Icons.Navigation.Check color={theme.colors.$textPrimary} />
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <ListScreen
      title="Select a network"
      data={networks}
      isModal
      // @ts-ignore TODO: ListScreen improvement
      renderItem={renderItem}
      keyExtractor={item => item?.chainId?.toString()}
    />
  )
}
