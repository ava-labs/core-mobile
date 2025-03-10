import { Text, Toggle, useTheme, View } from '@avalabs/k2-alpine'
import { alpha } from '@avalabs/k2-mobile'
import React, { ReactNode } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleVisibility,
  toggleCollectibleVisibility
} from 'store/portfolio'
import { getGridCardHeight, HORIZONTAL_ITEM_GAP } from '../consts'
import { CardContainer } from './CardContainer'
import { CollectibleRenderer } from './CollectibleRenderer'

export const CollectibleManagementItem = ({
  collectible,
  index
}: {
  collectible: NftItem
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
    dispatch(toggleCollectibleVisibility({ uid: collectible.localId }))
  }

  const collectibleName =
    collectible.name.length > 0 ? collectible.name : 'Untitled'

  const collectionName =
    collectible.collectionName.length === 0 ||
    ['Unknown', 'Unkown'].includes(collectible.collectionName)
      ? 'Unknown collection'
      : collectible.collectionName

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
              {collectibleName}
            </Text>
            <Text
              variant="subtitle2"
              numberOfLines={1}
              style={{
                color: alpha(isDark ? '#FFFFFF' : '#1E1E24', 0.6)
              }}>
              {collectionName}
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
                ? `${collectible?.localId}_displayed`
                : `${collectible?.localId}_blocked`
            }
            value={isToggledOn}
            onValueChange={handleChange}
          />
        </View>
      </View>
    </Pressable>
  )
}
