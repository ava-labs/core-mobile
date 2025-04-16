import {
  FlatList,
  Icons,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { useRouter } from 'expo-router'
import { useReceiveStore } from 'features/receive/store'
import React, { ReactNode } from 'react'
import { NetworkWithCaip2ChainId } from 'store/network'

export const SelectNetworkScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { back } = useRouter()
  const { availableNetworks } = usePrimaryNetworks()

  const setSelectedNetwork = useReceiveStore(state => state.setSelectedNetwork)
  const selectedNetwork = useReceiveStore(state => state.selectedNetwork)

  const handleNetworkSelect = (network: NetworkWithCaip2ChainId): void => {
    setSelectedNetwork(network)
    back()
  }

  const renderItem = ({
    item,
    index
  }: {
    item: NetworkWithCaip2ChainId
    index: number
  }): ReactNode => {
    const isLastItem = index === availableNetworks.length - 1

    return (
      <Pressable
        onPress={() => handleNetworkSelect(item)}
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 16,
          height: 50,
          gap: 16
        }}>
        <TokenLogo symbol={item?.networkToken?.symbol} size={36} />
        <View
          style={{
            flex: 1,
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: isLastItem ? 0 : 1,
            borderBottomColor: theme.colors.$borderPrimary,
            paddingRight: 16
          }}>
          <View style={{ flex: 1 }}>
            <Text variant="buttonMedium">{item.chainName}</Text>
          </View>
          {selectedNetwork?.chainId === item.chainId && (
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
        style={{ marginBottom: 12, paddingLeft: 16, paddingRight: 64 }}>
        Select a network
      </Text>
      <FlatList
        data={availableNetworks}
        renderItem={renderItem}
        keyExtractor={(item: NetworkWithCaip2ChainId) =>
          item.chainId.toString()
        }
      />
    </View>
  )
}
