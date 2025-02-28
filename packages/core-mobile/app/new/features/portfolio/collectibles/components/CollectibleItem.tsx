import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { memo } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { CollectibleView } from 'store/balance'
import { NFTItem } from 'store/nft'
import {
  getGridCardHeight,
  HORIZONTAL_ITEM_GAP,
  VERTICAL_ITEM_GAP
} from '../consts'
import { CardContainer } from './CardContainer'
import { ContentRenderer } from './ContentRenderer'

export const CollectibleGridItem = memo(
  ({
    collectible,
    type,
    index
  }: {
    collectible: NFTItem
    type: CollectibleView
    index: number
  }): JSX.Element | JSX.Element[] => {
    const {
      theme: { isDark, colors }
    } = useTheme()
    const dimensions = useWindowDimensions()
    const height = getGridCardHeight(type, dimensions, index)

    if (type === CollectibleView.ListView) {
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
              <ContentRenderer
                imageUrl={collectible.imageData?.image}
                videoUrl={collectible.imageData?.image}
              />
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

                <Pill text="123" />
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

    return (
      <AnimatedPressable
        entering={getListItemEnteringAnimation(index)}
        layout={LinearTransition.springify()}>
        <CardContainer
          style={{
            height,
            marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
            marginVertical: VERTICAL_ITEM_GAP / 2
          }}>
          <View
            style={{
              position: 'absolute',
              zIndex: 1,
              right: 10,
              top: 10
            }}>
            <Pill text="123" />
          </View>

          <ContentRenderer
            imageUrl={collectible.imageData?.image}
            videoUrl={collectible.imageData?.image}
          />
        </CardContainer>
      </AnimatedPressable>
    )
  }
)

const Pill = ({ text }: { text: string }): JSX.Element => {
  return (
    <View
      style={{
        backgroundColor: alpha('#58585B', 0.8),
        borderRadius: 100,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      <Icons.Content.Close />
      <Text
        variant="buttonSmall"
        sx={{ lineHeight: 20, color: '$surfacePrimary' }}
        numberOfLines={1}>
        {text}
      </Text>
    </View>
  )
}
