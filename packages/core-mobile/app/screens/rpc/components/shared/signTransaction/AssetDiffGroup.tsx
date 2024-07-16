import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useState } from 'react'
import { Asset, AssetDiff, GeneralAssetDiff } from 'services/blockaid/types'
import { balanceToDisplayValue, numberToBN } from '@avalabs/utils-sdk'
import { isHexString } from 'ethers'
import { Text, View } from '@avalabs/k2-mobile'
import Avatar from 'components/Avatar'
import CarrotSVG from 'components/svg/CarrotSVG'
import { TouchableOpacity } from 'react-native-gesture-handler'

export const AssetDiffGroup = ({
  assetDiff,
  isOut
}: {
  assetDiff: AssetDiff
  isOut: boolean
}): JSX.Element => {
  const asset = assetDiff.asset

  const selector = isOut ? 'out' : 'in'
  const diffs = assetDiff[selector]

  const [expanded, setExpanded] = useState(diffs.length === 1)

  return (
    <View sx={{ gap: 16 }}>
      {diffs.length > 1 && (
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
              {asset.name !== undefined && asset.symbol !== undefined && (
                <Avatar.Token
                  name={asset.name}
                  symbol={asset.symbol}
                  logoUri={asset.logo_url}
                  size={32}
                />
              )}
              <Text variant="heading6" numberOfLines={1} sx={{ flexShrink: 1 }}>
                {asset.name} ({diffs.length})
              </Text>
            </View>
            <View sx={{ alignItems: 'flex-end' }}>
              <CarrotSVG direction={expanded ? 'up' : 'down'} />
            </View>
          </View>
        </TouchableOpacity>
      )}
      {expanded &&
        diffs.map((diff, i) => (
          <AssetDiffItem
            asset={asset}
            assetDiff={diff}
            isOut={isOut}
            key={i.toString()}
          />
        ))}
    </View>
  )
}

const AssetDiffItem = ({
  asset,
  assetDiff,
  isOut,
  key
}: {
  asset: Asset
  assetDiff: GeneralAssetDiff
  isOut: boolean
  key: string
}): JSX.Element => {
  const { currencyFormatter } = useApplicationContext().appHook

  let displayValue
  if ('value' in assetDiff && assetDiff.value) {
    if ('decimals' in asset) {
      const valueBN = numberToBN(assetDiff.value, asset.decimals)
      displayValue = balanceToDisplayValue(valueBN, asset.decimals)
    } else if (isHexString(assetDiff.value)) {
      // for some token(like ERC1155) blockaid returns value in hex format
      displayValue = parseInt(assetDiff.value, 16).toString()
    }
  } else if (asset.type === 'ERC721') {
    // for ERC721 type token, we just display 1 to indicate that a single NFT will be transferred
    displayValue = 1
  }

  const assetDiffColor = isOut ? '$dangerLight' : '$successLight'

  return (
    <View
      key={key}
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
        {asset.name !== undefined && asset.symbol !== undefined && (
          <Avatar.Token
            name={asset.name}
            symbol={asset.symbol}
            logoUri={asset.logo_url}
            size={32}
          />
        )}
        <Text variant="heading6" numberOfLines={1} sx={{ flexShrink: 1 }}>
          {asset.name}
        </Text>
      </View>
      <View sx={{ alignItems: 'flex-end' }}>
        {displayValue !== undefined && (
          <Text variant="body2" sx={{ color: assetDiffColor }}>
            {isOut ? '-' : ''}
            {displayValue} {asset.symbol}
          </Text>
        )}
        {assetDiff.usd_price !== undefined && (
          <Text
            variant="body2"
            sx={{
              color: displayValue !== undefined ? '$neutral400' : assetDiffColor
            }}>
            {displayValue === undefined && (isOut ? '-' : '')}
            {currencyFormatter(Number(assetDiff.usd_price))}
          </Text>
        )}
      </View>
    </View>
  )
}
