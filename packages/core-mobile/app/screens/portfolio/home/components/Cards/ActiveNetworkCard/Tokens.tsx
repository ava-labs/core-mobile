import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import Avatar from 'components/Avatar'
import { Text, View } from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Space } from 'components/Space'
import { TokenWithBalance } from '@avalabs/vm-module-types'

const Tokens = (): JSX.Element => {
  const { filteredTokenList: tokens } = useSearchableTokenList()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()

  const tokensToDisplay = tokens.slice(0, 4)

  const { getMarketTokenBySymbol } = useWatchlist()

  const renderToken = (
    token: TokenWithBalance,
    index: number,
    allTokens: TokenWithBalance[]
  ): JSX.Element => {
    const { balanceDisplayValue, balanceInCurrency, symbol } = token
    const lastItem = index === allTokens.length - 1
    const marginBottom = lastItem ? 0 : 16
    const formattedBalance = balanceInCurrency
      ? currencyFormatter(balanceInCurrency)
      : `${balanceDisplayValue} ${symbol}`

    const marketToken = getMarketTokenBySymbol(symbol)
    const percentChange = marketToken?.priceChangePercentage24h ?? undefined
    const priceChange =
      percentChange && balanceInCurrency
        ? (balanceInCurrency * percentChange) / 100
        : undefined

    return (
      <View
        sx={{
          marginBottom,
          flexDirection: 'row',
          alignItems: 'center'
        }}
        key={index.toString()}>
        <Avatar.Token
          size={24}
          name={token.name}
          symbol={token.symbol}
          logoUri={token.logoUri}
        />
        <View
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <View
            sx={{
              marginLeft: 8,
              marginRight: 16,
              flexShrink: 1
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {token.name}
            </Text>
            <View sx={{ flexDirection: 'row', flexShrink: 1 }}>
              <Text
                variant="overline"
                sx={{ color: '$neutral50' }}
                ellipsizeMode="tail">
                {token.balanceDisplayValue}
              </Text>
              <Space x={4} />
              <Text variant="overline" numberOfLines={1} ellipsizeMode="tail">
                {token.symbol}
              </Text>
            </View>
          </View>
          <View
            sx={{
              alignItems: 'flex-end',
              flexShrink: 1
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {formattedBalance}
            </Text>
            {priceChange !== undefined && (
              <PriceChangeIndicator price={priceChange} />
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderMoreText = (): JSX.Element | null => {
    const moreText = tokens.length - tokensToDisplay.length

    if (moreText === 0) return null

    return (
      <Text
        variant="buttonSmall"
        sx={{ marginTop: 4, alignSelf: 'flex-end', color: '$blueMain' }}>
        + {moreText} more
      </Text>
    )
  }

  return (
    <>
      {tokensToDisplay.map(renderToken)}
      {renderMoreText()}
    </>
  )
}

export default Tokens
