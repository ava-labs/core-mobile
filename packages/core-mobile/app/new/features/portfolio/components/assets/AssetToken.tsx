import { TokenWithBalance } from '@avalabs/vm-module-types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import {
  alpha,
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { TokenLogo } from '../TokenLogo'

interface TokenProps {
  token: TokenWithBalance
}

export const AssetToken = ({ token }: TokenProps): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  // const { getMarketToken } = useWatchlist()

  const { balanceDisplayValue, balanceInCurrency, symbol } = token
  const formattedBalance = balanceInCurrency
    ? currencyFormatter(balanceInCurrency)
    : `${balanceDisplayValue} ${symbol}`

  // const marketToken = getMarketToken(symbol)
  // const percentChange = marketToken?.priceChangePercentage24h ?? undefined
  // const priceChange =
  //   percentChange && balanceInCurrency
  //     ? (balanceInCurrency * percentChange) / 100
  //     : undefined

  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)

  const goToTokenDetail = (): void => {
    // TODO: go to token detail
  }

  return (
    <TouchableOpacity
      onPress={goToTokenDetail}
      sx={{
        borderRadius: 18,
        paddingHorizontal: 17,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$surfaceSecondary'
      }}>
      {/* TODO: use another endpoint to get the logo and network icon */}
      <TokenLogo
        size={24}
        symbol={token.symbol}
        logoUri={token.logoUri}
        backgroundColor={colors.$borderPrimary}
        borderColor={borderColor}
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
          <Text
            variant="buttonMedium"
            numberOfLines={1}
            sx={{ lineHeight: 16 }}>
            {token.name}
          </Text>
          <View sx={{ flexDirection: 'row', flexShrink: 1 }}>
            <Text variant="body2" sx={{ lineHeight: 16 }} ellipsizeMode="tail">
              {token.balanceDisplayValue}
            </Text>
            <Space x={4} />
            <Text variant="body2" numberOfLines={1} ellipsizeMode="tail">
              {token.symbol}
            </Text>
          </View>
        </View>
        <View
          sx={{
            alignItems: 'flex-end',
            flexShrink: 1,
            justifyContent: 'center'
          }}>
          <Text
            variant="buttonMedium"
            numberOfLines={1}
            sx={{ fontWeight: '500', lineHeight: 16 }}>
            {formattedBalance}
          </Text>
          {/* {priceChange !== undefined && (
            <PriceChangeIndicator price={priceChange} />
          )} */}
        </View>
      </View>
      <View
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 13
        }}>
        <Icons.Navigation.ChevronRight
          width={16}
          height={16}
          color={colors.$textSecondary}
        />
      </View>
    </TouchableOpacity>
  )
}
