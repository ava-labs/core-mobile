import { Network } from '@avalabs/core-chains-sdk'
import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'
import { HORIZONTAL_MARGIN } from 'common/consts'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'

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
            <Text variant="buttonMedium">{item.chainName}</Text>
          </View>
          {selected?.chainId === item.chainId && (
            <Icons.Navigation.Check color={theme.colors.$textPrimary} />
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        marginTop: 12
      }}>
      <Text
        variant="heading2"
        style={{
          marginBottom: 12,
          paddingLeft: HORIZONTAL_MARGIN
        }}>
        Select a network
      </Text>

      <FlatList
        data={networks}
        renderItem={renderItem}
        keyExtractor={item => item?.chainId?.toString()}
      />
    </View>
  )
}
