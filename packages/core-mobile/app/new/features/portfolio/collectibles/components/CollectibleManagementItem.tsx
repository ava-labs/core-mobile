import { Text, Toggle, View } from '@avalabs/k2-alpine'
import { alpha } from '@avalabs/k2-mobile'
import React, { ReactNode } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { CollectibleView } from 'store/balance'
import { NFTItem } from 'store/nft'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleVisibility,
  toggleCollectibleVisibility
} from 'store/portfolio'
import { useTheme } from '@avalabs/k2-alpine'
import { getGridCardHeight, HORIZONTAL_ITEM_GAP } from '../consts'
import { CardContainer } from './CardContainer'
import { CollectibleRenderer } from './ContentRenderer'

export const CollectibleManagementItem = ({
  collectible,
  index
}: {
  collectible: NFTItem
  index: number
}): ReactNode => {
  const dispatch = useDispatch()
  const {
    theme: { isDark }
  } = useTheme()
  const dimensions = useWindowDimensions()
  const height = getGridCardHeight(CollectibleView.ListView, dimensions, index)

  const collectibleVisibility = useSelector(selectCollectibleVisibility)
  const isToggledOn = isCollectibleVisible(collectibleVisibility, collectible)

  function handleChange(): void {
    dispatch(toggleCollectibleVisibility({ uid: collectible.uid }))
  }

  return (
    <Pressable
      style={{
        height,
        marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: HORIZONTAL_ITEM_GAP
      }}>
      <CardContainer
        style={{
          height: 48,
          width: 48,
          borderRadius: 12
        }}>
        <CollectibleRenderer collectible={collectible} />
      </CardContainer>
      <View
        style={{
          flex: 1,
          height: '100%',
          borderBottomWidth: 0.5,
          borderColor: isDark ? alpha('#CCCCCC', 0.2) : '#CCCCCC',
          alignItems: 'center',
          flexDirection: 'row',
          gap: HORIZONTAL_ITEM_GAP
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <View
            style={{
              flex: 1
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {collectible.tokenId ?? 'ID'}
            </Text>
            <Text
              variant="subtitle2"
              numberOfLines={1}
              style={{
                color: alpha(isDark ? '#FFFFFF' : '#1E1E24', 0.6)
              }}>
              {collectible.processedMetadata?.name ?? 'Name'}
            </Text>
          </View>
        </View>
        <View
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 23
          }}>
          <Toggle
            testID={
              isToggledOn
                ? `${collectible?.uid}_displayed`
                : `${collectible?.uid}_blocked`
            }
            value={isToggledOn}
            onValueChange={handleChange}
          />
        </View>
      </View>
    </Pressable>
  )
}
