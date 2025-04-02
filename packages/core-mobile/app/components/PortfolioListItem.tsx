import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { Text, View } from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { Space } from './Space'
import { MaliciousTokenIconWithWarning } from './MaliciousTokenIconWithWarning'

interface Props {
  tokenName: string
  tokenPrice: string
  tokenPriceInCurrency?: number
  image?: string
  symbol: string
  onPress?: () => void
  showLoading?: boolean
  testID?: string
  isMalicious: boolean
}

const PortfolioListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  tokenPriceInCurrency = 0,
  image,
  symbol,
  onPress,
  showLoading,
  testID,
  isMalicious
}) => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const title = tokenName

  const subTitle = (
    <AvaListItem.CurrencyAmount
      value={
        <Text
          variant="body2"
          sx={{ color: '$neutral50' }}
          ellipsizeMode={'tail'}>{`${tokenPrice} `}</Text>
      }
      currency={
        <Text
          variant="body2"
          ellipsizeMode="tail"
          numberOfLines={1}
          sx={{
            color: '$neutral400',
            flexShrink: 1
          }}>{`${symbol}`}</Text>
      }
    />
  )

  const { getMarketTokenBySymbol } = useWatchlist()
  const marketToken = getMarketTokenBySymbol(symbol)
  const percentChange = marketToken?.priceChangePercentage24h ?? undefined
  const priceChange = percentChange
    ? (tokenPriceInCurrency * percentChange) / 100
    : undefined

  return (
    <View
      testID={testID}
      sx={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: '$neutral900'
      }}>
      <AvaListItem.Base
        title={
          <View sx={{ flexDirection: 'row', gap: 8 }}>
            {isMalicious && (
              <MaliciousTokenIconWithWarning
                contentWidth={200}
                position="right"
              />
            )}
            <Text sx={{ flex: 1 }} numberOfLines={1} variant="heading6">
              {title}
            </Text>
          </View>
        }
        titleAlignment={'flex-start'}
        subtitle={subTitle}
        leftComponent={
          <Avatar.Token
            name={tokenName}
            symbol={symbol}
            logoUri={image}
            size={40}
          />
        }
        rightComponent={
          showLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <View
              sx={{
                alignItems: 'flex-end',
                marginLeft: 8
              }}>
              <Text
                testID={`portfolio_list_item__${symbol}_balance`}
                variant="heading6"
                ellipsizeMode={'tail'}>
                {currencyFormatter(tokenPriceInCurrency)}
              </Text>
              {priceChange !== undefined && (
                <>
                  <Space y={4} />
                  <PriceChangeIndicator price={priceChange} />
                </>
              )}
            </View>
          )
        }
        onPress={onPress}
      />
    </View>
  )
}

export default React.memo(PortfolioListItem)
