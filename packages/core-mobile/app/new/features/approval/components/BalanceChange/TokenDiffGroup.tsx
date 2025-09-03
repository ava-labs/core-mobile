import React, { useCallback, useMemo, useState } from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  Separator,
  alpha,
  useTheme,
  Arrow
} from '@avalabs/k2-alpine'
import {
  NetworkContractToken,
  NetworkToken,
  TokenDiff,
  TokenDiffItem,
  TokenType
} from '@avalabs/vm-module-types'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'

export const TokenDiffGroup = ({
  tokenDiff,
  isOut
}: {
  tokenDiff: TokenDiff
  isOut: boolean
}): JSX.Element => {
  const token = tokenDiff.token

  const diffItems = tokenDiff.items

  const [expanded, setExpanded] = useState(diffItems.length === 1)

  return (
    <View>
      {diffItems.length > 1 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <View
            sx={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16
            }}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '80%'
              }}>
              <Text
                variant="body1"
                numberOfLines={1}
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: '$textPrimary'
                }}>
                {token.name}
              </Text>
            </View>
            <View sx={{ alignItems: 'flex-end', flex: 1 }}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                <Text
                  variant="body1"
                  sx={{
                    color: '$textSecondary',
                    fontSize: 16,
                    lineHeight: 16
                  }}>
                  {diffItems.length}
                </Text>
                <View style={{ marginTop: -3 }}>
                  <Arrow expanded={expanded} />
                </View>
              </View>
            </View>
          </View>
          {expanded && (
            <Separator sx={{ marginVertical: 16, marginHorizontal: 16 }} />
          )}
        </TouchableOpacity>
      )}
      {expanded &&
        diffItems.map((diffItem, i) => {
          const showSeparator =
            diffItems.length > 1 && i !== diffItems.length - 1

          return (
            <View key={i.toString()} style={{ paddingHorizontal: 16 }}>
              <TokenDiffItemComponent
                token={token}
                diffItem={diffItem}
                isOut={isOut}
                key={i.toString()}
              />
              {showSeparator && <Separator sx={{ marginVertical: 16 }} />}
            </View>
          )
        })}
    </View>
  )
}

const TokenDiffItemComponent = ({
  token,
  diffItem,
  isOut
}: {
  token: NetworkToken | NetworkContractToken
  diffItem: TokenDiffItem
  isOut: boolean
}): JSX.Element => {
  const isNft =
    'type' in token &&
    (token.type === TokenType.ERC721 || token.type === TokenType.ERC1155)

  const formatExchangedAmount = useExchangedAmount()
  const {
    theme: { colors }
  } = useTheme()

  const displayValueColor = isOut ? colors.$textDanger : colors.$textPrimary
  const priceInCurrencyColor = useMemo(() => {
    const lightTextPrimary = alpha(colors.$textPrimary, 0.6)
    return diffItem.displayValue === undefined
      ? lightTextPrimary
      : isOut
      ? colors.$textDanger
      : lightTextPrimary
  }, [diffItem.displayValue, isOut, colors.$textDanger, colors.$textPrimary])

  const renderTokenLogo = useCallback((): JSX.Element | null => {
    return (
      <TokenLogo
        symbol={token.symbol}
        logoUri={token.logoUri}
        size={42}
        isNft={isNft}
      />
    )
  }, [token.symbol, token.logoUri, isNft])

  return (
    <View
      sx={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          width: '20%'
        }}>
        {renderTokenLogo()}
        <Text
          variant="heading1"
          numberOfLines={1}
          sx={{
            fontSize: 18,
            lineHeight: 21,
            color: '$textPrimary'
          }}>
          {token.symbol}
        </Text>
      </View>
      <View
        sx={{
          alignItems: 'flex-end',
          width: '65%'
        }}>
        {diffItem.displayValue !== undefined && (
          <Text
            variant="heading1"
            numberOfLines={1}
            sx={{
              fontSize: 36,
              lineHeight: 36,
              color: displayValueColor
            }}>
            {isOut ? '-' : '+'}
            {diffItem.displayValue}
          </Text>
        )}
        {diffItem.usdPrice !== undefined && (
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{
              marginTop: -2,
              fontSize: 13,
              lineHeight: 16,
              color: priceInCurrencyColor
            }}>
            {diffItem.displayValue === undefined && (isOut ? '-' : '+')}
            {formatExchangedAmount(Number(diffItem.usdPrice))}
          </Text>
        )}
      </View>
    </View>
  )
}
