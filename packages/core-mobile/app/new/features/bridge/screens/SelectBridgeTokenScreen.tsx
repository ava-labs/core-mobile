import React, { useMemo, useState } from 'react'
import {
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import { AssetBalance } from 'screens/bridge/utils/types'
import { LogoWithNetwork } from 'common/components/LogoWithNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useBridgeSelectedAsset } from '../store/store'
import { useBridgeAssets } from '../hooks/useBridgeAssets'
import { useAssetBalances } from '../hooks/useAssetBalances'

export const SelectBridgeTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [searchText, setSearchText] = useState<string>('')
  const [selectedAsset, setSelectedAsset] = useBridgeSelectedAsset()
  const { sourceNetworkChainId: sourceNetworkChainIdParam } =
    useLocalSearchParams<{
      sourceNetworkChainId: string
    }>()
  const sourceNetworkChainId = Number(sourceNetworkChainIdParam)
  const handleSelectToken = (token: AssetBalance): void => {
    setSelectedAsset(token.asset)
    canGoBack() && back()
  }
  const { getNetwork } = useNetworks()
  const network = getNetwork(sourceNetworkChainId)

  const bridgeAssets = useBridgeAssets(sourceNetworkChainId)
  const { assetsWithBalances } = useAssetBalances(sourceNetworkChainId)
  const tokens = useMemo(
    () =>
      (assetsWithBalances ?? []).filter(asset =>
        bridgeAssets
          .map(bridgeAsset => bridgeAsset.symbol)
          .includes(asset.symbolOnNetwork ?? asset.asset.symbol)
      ),
    [assetsWithBalances, bridgeAssets]
  )

  const searchResults = useMemo(() => {
    if (searchText.length === 0) {
      return tokens
    }
    return tokens.filter(
      token =>
        token.asset.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [tokens, searchText])

  const renderItem: ListRenderItem<AssetBalance> = ({
    item,
    index
  }): React.JSX.Element => {
    const isSelected = selectedAsset?.symbol === item.symbol
    const isLastItem = index === searchResults.length - 1
    return (
      <TouchableOpacity
        onPress={() => handleSelectToken(item)}
        sx={{
          marginTop: 10
        }}>
        <View
          sx={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {network && (
              <LogoWithNetwork
                size={'medium'}
                token={item}
                network={network}
                outerBorderColor={colors.$surfaceSecondary}
              />
            )}
            <View>
              <Text variant="buttonMedium">{item.asset.name}</Text>
              <Text variant="subtitle2">
                {item.balance !== undefined
                  ? formatTokenAmount(
                      bigintToBig(item.balance, item.asset.decimals),
                      6
                    )
                  : UNKNOWN_AMOUNT}{' '}
                {item.symbol}
              </Text>
            </View>
          </View>
          {isSelected && (
            <Icons.Custom.CheckSmall color={colors.$textPrimary} />
          )}
        </View>
        {!isLastItem && (
          <Separator
            sx={{
              marginTop: 10,
              marginLeft: 46,
              width: '100%'
            }}
          />
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SelectTokenScreen
      onSearchText={setSearchText}
      searchText={searchText}
      tokens={searchResults}
      renderListItem={renderItem}
    />
  )
}
