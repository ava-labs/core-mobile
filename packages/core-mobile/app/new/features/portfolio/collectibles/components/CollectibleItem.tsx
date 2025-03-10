import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { memo, ReactNode } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import {
  getGridCardHeight,
  HORIZONTAL_ITEM_GAP,
  VERTICAL_ITEM_GAP
} from '../consts'
import { CardContainer } from './CardContainer'
import { CollectibleRenderer } from './CollectibleRenderer'

export const CollectibleItem = memo(
  ({
    collectible,
    type,
    index
  }: {
    collectible: NftItem
    type: CollectibleView
    index: number
  }): ReactNode => {
    if (type === CollectibleView.ListView)
      return <CollectibleListItem collectible={collectible} index={index} />

    return (
      <CollectibleGridItem
        type={type}
        collectible={collectible}
        index={index}
      />
    )
  }
)

export const CollectibleListItem = memo(
  ({
    collectible,
    index
  }: {
    collectible: NftItem
    index: number
  }): ReactNode => {
    const {
      theme: { isDark, colors }
    } = useTheme()
    const dimensions = useWindowDimensions()
    const height = getGridCardHeight(
      CollectibleView.ListView,
      dimensions,
      index
    )

    return (
      <Animated.View
        entering={getListItemEnteringAnimation(0)}
        layout={LinearTransition.springify()}>
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
                  {collectible.name.length ? collectible.name : 'Untitled'}
                </Text>
                <Text
                  variant="subtitle2"
                  numberOfLines={1}
                  style={{
                    color: alpha(isDark ? '#FFFFFF' : '#1E1E24', 0.6)
                  }}>
                  {collectible.collectionName.length
                    ? ['Unknown', 'Unkown'].includes(collectible.collectionName)
                      ? 'Unknown collection'
                      : collectible.collectionName
                    : 'Unknown collection'}
                </Text>
              </View>

              {(collectible?.imageData?.image ||
                collectible?.imageData?.video) &&
              collectible.balance ? (
                <Pill text={collectible.balance.toString()} />
              ) : null}
            </View>
            <Icons.Navigation.ChevronRightV2
              color={colors.$textPrimary}
              style={{
                marginRight: -4
              }}
            />
          </View>
        </Pressable>
      </Animated.View>
    )
  }
)

export const CollectibleGridItem = memo(
  ({
    collectible,
    type,
    index
  }: {
    collectible: NftItem
    type: CollectibleView
    index: number
  }): ReactNode => {
    const dimensions = useWindowDimensions()
    const height = getGridCardHeight(type, dimensions, index)

    return (
      <AnimatedPressable
        entering={getListItemEnteringAnimation(index)}
        layout={LinearTransition.springify()}>
        <CardContainer
          style={{
            height,
            marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
            marginBottom: VERTICAL_ITEM_GAP
          }}>
          <CollectibleRenderer collectible={collectible}>
            <View
              style={{
                position: 'absolute',
                zIndex: 1,
                right: 10,
                top: 10
              }}>
              {collectible.balance ? (
                <Pill text={collectible.balance.toString()} />
              ) : null}
            </View>
          </CollectibleRenderer>
        </CardContainer>
      </AnimatedPressable>
    )
  }
)

const Pill = ({ text }: { text: string }): ReactNode => {
  const {
    theme: { isDark }
  } = useTheme()
  return (
    <View
      style={{
        backgroundColor: alpha('#58585B', 0.8),
        borderRadius: 100,
        paddingLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 100,
        minWidth: 30,
        justifyContent: 'center'
      }}>
      <Text
        variant="buttonSmall"
        sx={{
          lineHeight: 20,
          color: isDark ? '$textPrimary' : '$surfacePrimary',
          paddingRight: 8
        }}
        numberOfLines={1}>
        {text}
      </Text>
    </View>
  )
}
