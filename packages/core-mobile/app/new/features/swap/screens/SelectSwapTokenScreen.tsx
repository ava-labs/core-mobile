import React, { useMemo, useState } from 'react'
import {
  Icons,
  SCREEN_WIDTH,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { LocalTokenWithBalance } from 'store/balance'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useRouter } from 'expo-router'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import { useSelector } from 'react-redux'
import { selectIsSolanaSwapBlocked } from 'store/posthog'

export const SelectSwapTokenScreen = ({
  tokens,
  selectedToken,
  setSelectedToken,
  networkChainId
}: {
  tokens: LocalTokenWithBalance[]
  selectedToken: LocalTokenWithBalance | undefined
  setSelectedToken: (token: LocalTokenWithBalance) => void
  networkChainId?: number
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [searchText, setSearchText] = useState<string>('')
  const cChainNetwork = useCChainNetwork()
  const solanaNetwork = useSolanaNetwork()
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const networkFilters = useMemo(() => {
    if (isSolanaSwapBlocked) return undefined
    return [cChainNetwork, solanaNetwork].filter(network => !!network)
  }, [isSolanaSwapBlocked, cChainNetwork, solanaNetwork])

  const handleSelectToken = (token: LocalTokenWithBalance): void => {
    setSelectedToken(token)
    canGoBack() && back()
  }

  const searchResults = useMemo(() => {
    if (searchText.length === 0) {
      return tokens
    }
    return tokens.filter(
      token =>
        token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
        token.localId.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [tokens, searchText])

  const keyExtractor = (item: LocalTokenWithBalance): string => {
    return [item.networkChainId, item.localId].join('-')
  }

  const renderItem: ListRenderItem<LocalTokenWithBalance> = ({
    item,
    index
  }): React.JSX.Element => {
    const isSelected = selectedToken?.localId === item.localId
    const isLastItem = index === searchResults.length - 1
    return (
      <TouchableOpacity
        onPress={() => handleSelectToken(item)}
        sx={{
          marginTop: 10,
          paddingLeft: 16
        }}>
        <View
          sx={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 16
          }}>
          <View sx={{ flexDirection: 'row', gap: 10 }}>
            <LogoWithNetwork
              token={item}
              outerBorderColor={colors.$surfaceSecondary}
            />
            <View>
              <Text
                testID={`token_selector__${item.symbol}`}
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ width: SCREEN_WIDTH * 0.65 }}>
                {item.name}
              </Text>
              <Text variant="subtitle2">
                {item.balanceDisplayValue} {item.symbol}
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
      keyExtractor={keyExtractor}
      networks={networkFilters}
      networkChainId={networkChainId}
    />
  )
}
