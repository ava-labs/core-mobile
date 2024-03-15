import React from 'react'
import { TokenWithBalance } from 'store/balance'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import Avatar from 'components/Avatar'
import { Text, View } from '@avalabs/k2-mobile'
import MarketTrend from 'screens/watchlist/components/MarketTrend'
import { useGetTokenPercentChange } from 'hooks/useGetTokenPercentChange'

const Tokens = (): JSX.Element => {
  const { filteredTokenList: tokens } = useSearchableTokenList()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()

  const tokensToDisplay = tokens.slice(0, 4)

  const { getTokenPercentChange } = useGetTokenPercentChange()

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

    const percentChange = getTokenPercentChange(token.symbol)
    const priceChange = (balanceInCurrency * percentChange) / 100

    return (
      <View
        sx={{ marginBottom, flexDirection: 'row', alignItems: 'center' }}
        key={index.toString()}>
        <Avatar.Token
          size={24}
          name={token.name}
          symbol={token.symbol}
          logoUri={token.logoUri}
        />
        <View sx={{ marginLeft: 8, marginRight: 16, flex: 1 }}>
          <Text variant="buttonMedium">{token.name}</Text>
          <Text variant="overline">{token.symbol}</Text>
        </View>
        <View sx={{ alignItems: 'flex-end' }}>
          <Text variant="buttonMedium">{formattedBalance}</Text>
          {percentChange !== undefined && (
            <MarketTrend
              priceChange={priceChange}
              percentChange={percentChange}
            />
          )}
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
