import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { rgba } from 'polished'
import React, { ReactNode, useMemo } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { NftItem } from 'services/nft/types'

import { Row } from 'components/Row'
import { DeFiRowItem } from 'features/portfolio/defi/components/DeFiRowItem'
import { HORIZONTAL_MARGIN } from '../consts'

export const CollectibleDetailsContent = ({
  collectible
}: {
  collectible: NftItem | undefined
}): ReactNode => {
  const { theme } = useTheme()
  const statistics = useMemo(
    () =>
      collectible?.processedMetadata?.attributes?.map(item => ({
        text: camelCaseToTitle(item.trait_type),
        value: item.value
      })) || [],
    [collectible?.processedMetadata?.attributes]
  )

  const renderStatistic: ListRenderItem<{
    text: string
    value: string
  }> = ({ item }) => {
    return (
      <DeFiRowItem>
        <Row style={{ flex: 1, alignItems: 'center', gap: 12 }}>
          <Text
            variant="body1"
            numberOfLines={1}
            ellipsizeMode="tail"
            sx={{ color: '$textSecondary', flexShrink: 1 }}>
            {item?.text}
          </Text>
        </Row>
        <Text variant="body1">{item.value}</Text>
      </DeFiRowItem>
    )
  }

  const collectibleName =
    collectible?.name && collectible.name.length > 0
      ? collectible?.name
      : 'Untitled'

  // TODO: Ask if needed
  // const collectionName =
  //   collectible.collectionName.length === 0 ||
  //   ['Unknown', 'Unkown'].includes(collectible.collectionName)
  //     ? 'Unknown collection'
  //     : collectible.collectionName

  return (
    <View
      style={{
        gap: HORIZONTAL_MARGIN
      }}>
      <View
        style={{
          zIndex: 1000,
          gap: HORIZONTAL_MARGIN,
          paddingHorizontal: HORIZONTAL_MARGIN * 2
        }}>
        <Text variant="buttonMedium">{collectibleName || 'Untitled'}</Text>

        <Text
          variant="subtitle1"
          style={{
            fontSize: 14,
            color: rgba(theme.colors.$surfacePrimary, 0.7)
          }}>
          {collectible?.description?.trim() || 'No description'}
        </Text>
      </View>

      {statistics.length ? (
        <View>
          <Text
            sx={{
              color: '$white',
              textTransform: 'uppercase',
              paddingHorizontal: HORIZONTAL_MARGIN * 2,
              paddingTop: HORIZONTAL_MARGIN
              //   fontFamily: theme.customFonts.secondary.black
            }}>
            Attributes
          </Text>
          <FlatList
            horizontal
            data={statistics}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: HORIZONTAL_MARGIN * 2,
              paddingVertical: HORIZONTAL_MARGIN,
              paddingTop: HORIZONTAL_MARGIN / 2
            }}
            renderItem={renderStatistic}
          />
        </View>
      ) : null}

      <View
        style={{
          gap: 8,
          paddingHorizontal: HORIZONTAL_MARGIN * 2,
          paddingTop: statistics.length ? 0 : HORIZONTAL_MARGIN
        }}>
        <View
          style={{
            gap: 12,
            backgroundColor: rgba(theme.colors.$textPrimary, 0.2),
            borderRadius: 16,
            padding: HORIZONTAL_MARGIN
          }}>
          <DeFiRowItem>
            <Row style={{ flex: 1, alignItems: 'center', gap: 12 }}>
              <Text
                variant="body1"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ color: '$textSecondary', flexShrink: 1 }}>
                {collectible?.symbol}
              </Text>
            </Row>
            <Text variant="body1">
              {/* {numberSign}
              {getAmount(collectible.amount * collectible.price, 'compact')} */}
            </Text>
          </DeFiRowItem>
        </View>
      </View>
    </View>
  )
}

function camelCaseToTitle(text: string): string {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
    return str.toUpperCase().trim()
  })
}

const formatAddress = (address?: string): string => {
  if (!address) return ''
  return `${address?.substring(0, 6)}...${address?.substring(
    address?.length - 4
  )}`
}
