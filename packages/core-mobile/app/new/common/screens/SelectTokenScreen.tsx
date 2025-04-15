import {
  FlatList,
  Icons,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRoute } from '@react-navigation/native'
import { TokenLogo } from 'common/components/TokenLogo'
import React, { ReactNode, useMemo } from 'react'
import { NetworkWithCaip2ChainId } from 'store/network'

type SelectTokenScreenParams = {
  networks: string // This is a JSON string that needs to be parsed
  selectedNetworkId: string
  onChange: (networkId: string) => void
}

export const SelectTokenScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const route = useRoute()

  const { networks, selectedNetworkId, onChange } =
    route.params as SelectTokenScreenParams

  const parsedNetworks = useMemo(
    () => Object.values(JSON.parse(networks) as NetworkWithCaip2ChainId[]),
    [networks]
  )

  const selectedNetwork = useMemo(
    () =>
      parsedNetworks.find(
        network => network.chainId === Number(selectedNetworkId)
      ) as NetworkWithCaip2ChainId,
    [parsedNetworks, selectedNetworkId]
  )

  const handleNetworkSelect = (network: NetworkWithCaip2ChainId): void => {
    onChange(network.chainId.toString())
  }

  const renderItem = ({
    item,
    index
  }: {
    item: NetworkWithCaip2ChainId
    index: number
  }): ReactNode => {
    const isLastItem = index === parsedNetworks.length - 1
    return (
      <Pressable
        onPress={() => handleNetworkSelect(item)}
        sx={{
          backgroundColor:
            selectedNetwork?.chainId === item.chainId
              ? '$surfaceSecondary'
              : 'transparent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 16,
          height: 50,
          gap: 16
        }}>
        <TokenLogo symbol={item.networkToken?.symbol} size={36} />
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
        marginTop: 13
      }}>
      <Text
        variant="heading2"
        style={{ marginBottom: 12, paddingLeft: 16, paddingRight: 64 }}>
        Select a token
      </Text>
      <FlatList
        data={parsedNetworks}
        renderItem={renderItem}
        keyExtractor={(item: NetworkWithCaip2ChainId) =>
          item.chainId.toString()
        }
      />
    </View>
  )
}
