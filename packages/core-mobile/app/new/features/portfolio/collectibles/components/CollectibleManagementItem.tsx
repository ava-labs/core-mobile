import { Text, Toggle, useTheme, View } from '@avalabs/k2-alpine'
import { alpha } from '@avalabs/k2-mobile'
import React, { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleVisibility,
  toggleCollectibleVisibility
} from 'store/portfolio'
import {
  getCollectibleCollectionName,
  getCollectibleName,
  getGridCardHeight,
  HORIZONTAL_ITEM_GAP,
  HORIZONTAL_MARGIN
} from '../consts'
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
    theme: { colors }
  } = useTheme()
  const height = getGridCardHeight(CollectibleView.ListView, index)

  const collectibleVisibility = useSelector(selectCollectibleVisibility)
  const isToggledOn = isCollectibleVisible(collectibleVisibility, collectible)

  function handleChange(): void {
    dispatch(toggleCollectibleVisibility({ uid: collectible.localId }))
  }

  const collectibleName = getCollectibleName(collectible)
  const collectionName = getCollectibleCollectionName(collectible)

  return (
    <Pressable
      style={{
        height,
        flexDirection: 'row',
        alignItems: 'center',
        gap: HORIZONTAL_ITEM_GAP,
        paddingLeft: HORIZONTAL_MARGIN
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
        sx={{
          flex: 1,
          height: '100%',
          borderBottomWidth: 0.5,
          borderColor: '$borderPrimary',
          alignItems: 'center',
          flexDirection: 'row',
          gap: HORIZONTAL_ITEM_GAP,
          paddingRight: HORIZONTAL_MARGIN
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
              sx={{
                color: alpha(colors?.$textSecondary, 0.6)
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
