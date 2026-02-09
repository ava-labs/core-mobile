import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useCallback, memo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { useTokenNameForDisplay } from 'common/hooks/useTokenNameForDisplay'
import { useMarketToken } from 'common/hooks/useMarketToken'
import { TokenListView } from './TokenListView'
import { TokenGridView } from './TokenGridView'

interface TokenListItemProps {
  token: LocalTokenWithBalance
  index: number
  isGridView?: boolean
  onPress: (token: LocalTokenWithBalance) => void
}

export const TokenListItem = memo(
  ({
    token,
    index,
    isGridView,
    onPress
  }: // eslint-disable-next-line sonarjs/cognitive-complexity
  TokenListItemProps): React.JSX.Element => {
    const { formatCurrency } = useFormatCurrency()
    const { balanceInCurrency } = token
    const formattedBalance = balanceInCurrency
      ? formatCurrency({ amount: balanceInCurrency })
      : undefined

    const tokenNameForDisplay = useTokenNameForDisplay({ token }) ?? token.name

    const marketToken = useMarketToken({
      // Only resolve market token when token.change24 is missing
      token: token.change24 === undefined ? token : undefined
    })
    const percentChange =
      token.change24 ?? marketToken?.priceChangePercentage24h ?? undefined
    const priceChange =
      percentChange !== undefined && balanceInCurrency !== undefined
        ? (balanceInCurrency * percentChange) / 100
        : undefined
    const formattedPrice =
      priceChange !== undefined
        ? formatCurrency({ amount: Math.abs(priceChange) })
        : undefined

    const status =
      priceChange !== undefined
        ? priceChange > 0
          ? PriceChangeStatus.Up
          : priceChange < 0
          ? PriceChangeStatus.Down
          : PriceChangeStatus.Neutral
        : undefined

    const handlePress = useCallback(() => {
      onPress(token)
    }, [onPress, token])

    return isGridView ? (
      <TokenGridView
        token={token}
        tokenNameForDisplay={tokenNameForDisplay}
        index={index}
        onPress={handlePress}
        priceChangeStatus={status}
        formattedBalance={formattedBalance}
        formattedPrice={formattedPrice}
      />
    ) : (
      <TokenListView
        token={token}
        tokenNameForDisplay={tokenNameForDisplay}
        index={index}
        onPress={handlePress}
        priceChangeStatus={status}
        formattedBalance={formattedBalance}
        formattedPrice={formattedPrice}
      />
    )
  }
)
