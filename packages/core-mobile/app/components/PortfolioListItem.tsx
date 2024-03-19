import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { Text, View } from '@avalabs/k2-mobile'
import PriceChangeIndicator from 'screens/watchlist/components/PriceChangeIndicator'
import { useGetMarketToken } from 'hooks/useGetMarketToken'
import { Space } from './Space'

interface Props {
  tokenName: string
  tokenPrice: string
  tokenPriceInCurrency?: number
  image?: string
  symbol: string
  onPress?: () => void
  showLoading?: boolean
  testID?: string
}

const PortfolioListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  tokenPriceInCurrency = 0,
  image,
  symbol,
  onPress,
  showLoading
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

  const { getMarketToken } = useGetMarketToken()
  const marketToken = getMarketToken(symbol)
  const percentChange = marketToken?.priceChangePercentage24h ?? 0
  const priceChange = (tokenPriceInCurrency * percentChange) / 100

  return (
    <View
      sx={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: '$neutral900'
      }}>
      <AvaListItem.Base
        title={
          <Text numberOfLines={1} variant="heading6">
            {title}
          </Text>
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
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          showLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <View sx={{ alignItems: 'flex-end', marginLeft: 8 }}>
              <Text variant="heading6" ellipsizeMode={'tail'}>
                {currencyFormatter(tokenPriceInCurrency)}
              </Text>
              <Space y={4} />
              <PriceChangeIndicator
                priceChange={priceChange}
                percentChange={percentChange}
              />
            </View>
          )
        }
        onPress={onPress}
      />
    </View>
  )
}

export default React.memo(PortfolioListItem)
