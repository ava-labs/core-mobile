import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useState } from 'react'
import { Text, View } from '@avalabs/k2-mobile'
import Avatar from 'components/Avatar'
import CarrotSVG from 'components/svg/CarrotSVG'
import { TouchableOpacity } from 'react-native-gesture-handler'
import {
  AssetDiff,
  AssetDiffItem,
  NetworkContractToken,
  NetworkToken
} from '@avalabs/vm-module-types'

export const AssetDiffGroup = ({
  assetDiff,
  isOut
}: {
  assetDiff: AssetDiff
  isOut: boolean
}): JSX.Element => {
  const token = assetDiff.token

  const diffItems = assetDiff.items

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
          <AssetDiffItemComponent
            token={token}
            diffItem={diffItem}
            isOut={isOut}
            key={i.toString()}
          />
        ))}
    </View>
  )
}

const AssetDiffItemComponent = ({
  token,
  diffItem,
  isOut
}: {
  token: NetworkToken | NetworkContractToken
  diffItem: AssetDiffItem
  isOut: boolean
}): JSX.Element => {
  const { currencyFormatter } = useApplicationContext().appHook

  const displayValue = diffItem.value

  const assetDiffColor = isOut ? '$dangerLight' : '$successLight'

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
        {displayValue !== undefined && (
          <Text variant="body2" sx={{ color: assetDiffColor }}>
            {isOut ? '-' : ''}
            {displayValue} {token.symbol}
          </Text>
        )}
        {diffItem.usdPrice !== undefined && (
          <Text
            variant="body2"
            sx={{
              color: displayValue !== undefined ? '$neutral400' : assetDiffColor
            }}>
            {displayValue === undefined && (isOut ? '-' : '')}
            {currencyFormatter(Number(diffItem.usdPrice))}
          </Text>
        )}
      </View>
    </View>
  )
}
