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
import { Pressable, ViewStyle } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import {
  getGridCardHeight,
  HORIZONTAL_ITEM_GAP,
  HORIZONTAL_MARGIN,
  VERTICAL_ITEM_GAP
} from '../consts'
import { CardContainer } from './CardContainer'
import { CollectibleRenderer } from './CollectibleRenderer'

export const CollectibleItem = memo(
  ({
    collectible,
    type,
    index,
    onPress
  }: {
    collectible: NftItem
    type: CollectibleView
    index: number
    onPress?: () => void
  }): ReactNode => {
    if (type === CollectibleView.ListView)
      return (
        <CollectibleListItem
          onPress={onPress}
          collectible={collectible}
          index={index}
        />
      )

    return (
      <CollectibleGridItem
        type={type}
        collectible={collectible}
        index={index}
        onPress={onPress}
        style={{
          marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
          marginBottom: VERTICAL_ITEM_GAP
        }}
      />
    )
  }
)

export const CollectibleListItem = memo(
  ({
    collectible,
    index,
    onPress
  }: {
    collectible: NftItem
    index: number
    onPress?: () => void
  }): ReactNode => {
    const {
      theme: { colors }
    } = useTheme()
    const height = getGridCardHeight(CollectibleView.ListView, index)

    const collectibleName =
      collectible.name.length > 0 ? collectible.name : 'Untitled'

    const collectionName =
      collectible.collectionName.length === 0 ||
      ['Unknown', 'Unkown'].includes(collectible.collectionName)
        ? 'Unknown collection'
        : collectible.collectionName

    return (
      <Animated.View
        entering={getListItemEnteringAnimation(0)}
        layout={LinearTransition.springify()}>
        <Pressable
          onPress={onPress}
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
                    color: '$textSecondary'
                  }}>
                  {collectionName}
                </Text>
              </View>

              {(collectible?.imageData?.image ||
                collectible?.imageData?.video) &&
              collectible.balance ? (
                <Pill text={collectible.balance.toString()} />
              ) : null}
            </View>
            <Icons.Navigation.ChevronRightV2 color={colors.$textPrimary} />
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
    index,
    style,
    onPress
  }: {
    collectible: NftItem
    type: CollectibleView
    index: number
    style?: ViewStyle
    onPress?: () => void
  }): ReactNode => {
    const height = getGridCardHeight(type, index)

    return (
      <AnimatedPressable
        entering={getListItemEnteringAnimation(index)}
        layout={LinearTransition.springify()}
        onPress={onPress}>
        <CardContainer
          style={[
            {
              height
            },
            style
          ]}>
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
