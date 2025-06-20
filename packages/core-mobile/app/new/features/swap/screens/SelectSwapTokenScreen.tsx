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
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'

export const SelectSwapTokenScreen = ({
  selectedToken,
  setSelectedToken,
  hideZeroBalance
}: {
  selectedToken: LocalTokenWithBalance | undefined
  setSelectedToken: (token: LocalTokenWithBalance) => void
  hideZeroBalance?: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [searchText, setSearchText] = useState<string>('')
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const cChainNetwork = useCChainNetwork()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    chainId: cChainNetwork?.chainId,
    hideZeroBalance
  })
  const handleSelectToken = (token: LocalTokenWithBalance): void => {
    setSelectedToken(token)
    canGoBack() && back()
  }

  const searchResults = useMemo(() => {
    if (searchText.length === 0) {
      return filteredTokenList
    }
    return filteredTokenList.filter(
      token =>
        token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
        token.localId.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [filteredTokenList, searchText])

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
      keyExtractor={item => item.localId}
    />
  )
}
