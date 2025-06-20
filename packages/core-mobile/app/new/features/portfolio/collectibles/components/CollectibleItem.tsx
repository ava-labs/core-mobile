import {
  alpha,
  AnimatedPressable,
  AnimatedPressableProps,
  Chip,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { memo, ReactNode } from 'react'
import { Pressable, ViewStyle } from 'react-native'
import { NftItem } from 'services/nft/types'
import { CollectibleView } from 'store/balance'
import {
  getCollectibleCollectionName,
  getCollectibleName,
  getGridCardHeight,
  HORIZONTAL_ITEM_GAP,
  HORIZONTAL_MARGIN,
  VERTICAL_ITEM_GAP
} from '../consts'
import { CardContainer } from './CardContainer'
import {
  CollectibleRenderer,
  CollectibleRendererProps
} from './CollectibleRenderer'

export const CollectibleItem = memo(
  ({
    collectible,
    type,
    index,
    style,
    onLoaded,
    onPress
  }: {
    collectible: NftItem
    type: CollectibleView
    index: number
    style?: ViewStyle
    onLoaded?: () => void
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
        onLoaded={onLoaded}
        entering={getListItemEnteringAnimation(index)}
        rendererProps={{
          videoProps: {
            muted: true,
            autoPlay: false,
            hideControls: true
          },
          style: {
            borderRadius: 18
          }
        }}
        style={{
          marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
          marginBottom: VERTICAL_ITEM_GAP,
          ...style
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
    const { theme } = useTheme()
    const height = getGridCardHeight(CollectibleView.ListView, index)

    const collectibleName = getCollectibleName(collectible)
    const collectibleCollectionName = getCollectibleCollectionName(collectible)

    return (
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
          <CollectibleRenderer
            videoProps={{
              hideControls: true
            }}
            collectible={collectible}
          />
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
              alignItems: 'center',
              gap: 10
            }}>
            <View
              style={{
                flex: 1
              }}>
              <Text
                testID={`collectible_name__${collectibleName}`}
                variant="buttonMedium"
                numberOfLines={1}>
                {collectibleName}
              </Text>
              <Text
                variant="subtitle2"
                numberOfLines={1}
                sx={{
                  color: '$textSecondary'
                }}>
                {collectibleCollectionName}
              </Text>
            </View>
            <View>
              {collectible.balance ? (
                <View
                  style={{
                    maxWidth: 100,
                    minWidth: 30,
                    backgroundColor: alpha(theme.colors.$textPrimary, 0.3),
                    borderRadius: 100,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 10
                  }}>
                  <Text
                    variant="buttonSmall"
                    numberOfLines={1}
                    style={{
                      color: theme.colors?.$textSecondary
                    }}>
                    {collectible.balance.toString()}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Icons.Navigation.ChevronRightV2 color={theme.colors.$textPrimary} />
        </View>
      </Pressable>
    )
  }
)

interface CollectibleGridItemProps extends AnimatedPressableProps {
  collectible: NftItem
  type: CollectibleView
  index: number
  style?: ViewStyle
  rendererProps?: Omit<CollectibleRendererProps, 'collectible'>
  onLoaded?: () => void
  onPress?: () => void
}

export const CollectibleGridItem = memo(
  ({
    collectible,
    type,
    index,
    style,
    rendererProps,
    onLoaded,
    onPress,
    ...props
  }: CollectibleGridItemProps): ReactNode => {
    const height = getGridCardHeight(type, index)

    return (
      <AnimatedPressable onPress={onPress} {...props}>
        <CardContainer
          style={[
            {
              height
            },
            { ...style }
          ]}>
          <CollectibleRenderer
            collectible={collectible}
            onLoaded={onLoaded}
            {...rendererProps}>
            <View
              style={{
                position: 'absolute',
                zIndex: 1,
                right: 10,
                top: 10
              }}>
              {collectible.balance ? (
                <Chip
                  size="small"
                  variant="dark"
                  style={{
                    maxWidth: 100,
                    minWidth: 30
                  }}>
                  {collectible.balance.toString()}
                </Chip>
              ) : null}
            </View>
          </CollectibleRenderer>
        </CardContainer>
      </AnimatedPressable>
    )
  }
)
