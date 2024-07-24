import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useState } from 'react'
import { Text, View } from '@avalabs/k2-mobile'
import Avatar from 'components/Avatar'
import CarrotSVG from 'components/svg/CarrotSVG'
import { TouchableOpacity } from 'react-native-gesture-handler'
import {
  NetworkContractToken,
  NetworkToken,
  TokenDiff,
  TokenDiffItem
} from '@avalabs/vm-module-types'

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
    <View sx={{ gap: 16 }}>
      {diffItems.length > 1 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <View
            sx={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flexShrink: 1
              }}>
              {token.name !== undefined && token.symbol !== undefined && (
                <Avatar.Token
                  name={token.name}
                  symbol={token.symbol}
                  logoUri={token.logoUri}
                  size={32}
                />
              )}
              <Text variant="heading6" numberOfLines={1} sx={{ flexShrink: 1 }}>
                {token.name} ({diffItems.length})
              </Text>
            </View>
            <View sx={{ alignItems: 'flex-end' }}>
              <CarrotSVG direction={expanded ? 'up' : 'down'} />
            </View>
          </View>
        </TouchableOpacity>
      )}
      {expanded &&
        diffItems.map((diffItem, i) => (
          <TokenDiffItemComponent
            token={token}
            diffItem={diffItem}
            isOut={isOut}
            key={i.toString()}
          />
        ))}
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
  const { currencyFormatter } = useApplicationContext().appHook

  const tokenDiffColor = isOut ? '$dangerLight' : '$successLight'

  return (
    <View
      sx={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          flexShrink: 1
        }}>
        {token.name !== undefined && token.symbol !== undefined && (
          <Avatar.Token
            name={token.name}
            symbol={token.symbol}
            logoUri={token.logoUri}
            size={32}
          />
        )}
        <Text variant="heading6" numberOfLines={1} sx={{ flexShrink: 1 }}>
          {token.name}
        </Text>
      </View>
      <View sx={{ alignItems: 'flex-end' }}>
        {diffItem.displayValue !== undefined && (
          <Text variant="body2" sx={{ color: tokenDiffColor }}>
            {isOut ? '-' : ''}
            {diffItem.displayValue} {token.symbol}
          </Text>
        )}
        {diffItem.usdPrice !== undefined && (
          <Text
            variant="body2"
            sx={{
              color:
                diffItem.displayValue !== undefined
                  ? '$neutral400'
                  : tokenDiffColor
            }}>
            {diffItem.displayValue === undefined && (isOut ? '-' : '')}
            {currencyFormatter(Number(diffItem.usdPrice))}
          </Text>
        )}
      </View>
    </View>
  )
}
