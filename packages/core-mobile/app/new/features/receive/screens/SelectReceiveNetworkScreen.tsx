import { Network } from '@avalabs/core-chains-sdk'
import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { useRouter } from 'expo-router'
import {
  useReceiveActions,
  useReceiveSelectedNetwork
} from 'features/receive/store'
import React from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { LogoWithNetwork } from '../components/LogoWithNetwork'
import { HORIZONTAL_MARGIN } from '../consts'
import { isXPChain } from '../utils'

export const SelectReceiveNetworkScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { back } = useRouter()
  const { networks } = usePrimaryNetworks()

  const { setSelectedNetwork } = useReceiveActions()
  const selectedNetwork = useReceiveSelectedNetwork()

  const handleNetworkSelect = (network: Network): void => {
    setSelectedNetwork(network)
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
        <LogoWithNetwork
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
          {selectedNetwork.chainId === item.chainId && (
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
