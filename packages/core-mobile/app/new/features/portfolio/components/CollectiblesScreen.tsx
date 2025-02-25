import {
  alpha,
  Icons,
  Pressable,
  useTheme,
  View,
  Text
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { Image } from 'expo-image'
import React from 'react'
import { Platform, ScaledSize, ViewStyle } from 'react-native'
import { MasonryFlashList } from 'react-native-collapsible-tab-view'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { NFTItem } from 'store/nft'

const HORIZONTAL_MARGIN = 16
const HORIZONTAL_ITEM_GAP = 14
const VERTICAL_ITEM_GAP = 12
const LIST_CARD_HEIGHT = 100

const data: Partial<NFTItem>[] = [
  {
    name: 'Test',
    address: '0x123'
  },
  {
    name: 'Test'
  },
  {
    name: 'Test'
  },
  {
    name: 'Test'
  },
  {
    name: 'Test'
  },
  {
    name: 'Test'
  },
  {
    name: 'Test'
  },
  {
    name: 'Test'
  }
]

export const getGridCardHeight = (
  type: 'grid' | 'list' | 'columns',
  dimensions: ScaledSize
) => {
  switch (type) {
    case 'list':
      return LIST_CARD_HEIGHT
    case 'grid':
      return (
        (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP * 3.6) / 2
      )
    default:
      return (dimensions.width - HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP) / 1.5
  }
}

export const CollectiblesScreen = (): JSX.Element => {
  const renderItem: ListRenderItem<Partial<NFTItem>> = ({ item, index }) => {
    return (
      <View>
        <NftCard nft={item} index={index} type="grid" />
      </View>
    )
  }

  const renderEmpty = () => {
    return <EmptyCollectibles />
  }

  return (
    <MasonryFlashList
      renderItem={renderItem}
      data={data}
      numColumns={2}
      estimatedItemSize={150}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      scrollEnabled={data?.length > 0}
      removeClippedSubviews={Platform.OS === 'android'}
      ListEmptyComponent={renderEmpty}
      style={{
        overflow: 'visible',
        marginTop: HORIZONTAL_MARGIN
      }}
      contentContainerStyle={{
        padding: data?.length ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2 : 0,
        paddingTop: HORIZONTAL_ITEM_GAP,
        paddingBottom: HORIZONTAL_MARGIN
      }}
    />
  )
}

const NftCard = ({
  nft,
  type,
  index
}: {
  nft: Partial<NFTItem>
  type: 'grid' | 'list'
  index: number
}) => {
  return (
    <PressableAnimation>
      <CardContainer
        style={{
          height: index % 3 === 0 ? 220 : 180,
          marginHorizontal: type === 'grid' ? HORIZONTAL_ITEM_GAP / 2 : 0,
          marginVertical: type === 'grid' ? VERTICAL_ITEM_GAP / 2 : 0
        }}>
        {/* <Text>{collectible.processedMetadata?.imageUri}</Text> */}
        <ContentRenderer height={index % 3 === 0 ? 220 : 180} />
      </CardContainer>
    </PressableAnimation>
  )
}

const EaseOutQuart = Easing.bezier(0.25, 1, 0.5, 1)
const DEFAULT_DURATION = 500
const SPRING_CONFIG = {
  damping: 10,
  stiffness: 200,
  mass: 0.5
}
const TIMING_CONFIG = {
  duration: DEFAULT_DURATION,
  easing: EaseOutQuart
}
const DEFAULT_SCALE = 0.96

const EmptyCollectibles = () => {
  return (
    <View
      sx={{
        flex: 1,
        flexDirection: 'row',
        gap: HORIZONTAL_MARGIN,
        padding: HORIZONTAL_MARGIN
      }}>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <PressableAnimation>
          <CardContainer
            style={{
              height: 220
            }}>
            <Icons.Custom.Search color={'#000000'} />
          </CardContainer>
        </PressableAnimation>

        <CardContainer
          style={{
            height: 180
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <CardContainer
          style={{
            height: 190
          }}
        />
        <CardContainer
          style={{
            height: 190
          }}
        />
      </View>
    </View>
  )
}

const CardContainer = ({
  style,
  children
}: {
  style: ViewStyle
  children?: JSX.Element
}) => {
  const {
    theme: { isDark }
  } = useTheme()
  return (
    <View
      style={{
        height: 220,
        backgroundColor: alpha(isDark ? '#3F3F42' : '#F6F6F6', 0.8),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: alpha(isDark ? '#fff' : '#000', 0.1),
        borderRadius: 18,
        ...style
      }}>
      {children}
    </View>
  )
}

const PressableAnimation = ({ children }: { children: JSX.Element }) => {
  const opacity = useSharedValue(1)
  const scale = useSharedValue(1)

  const onPressIn = () => {
    'worklet'
    opacity.value = withTiming(0.5, TIMING_CONFIG)
    scale.value = withSpring(DEFAULT_SCALE, SPRING_CONFIG)
  }

  const onPressOut = () => {
    'worklet'
    opacity.value = withTiming(1, TIMING_CONFIG)
    scale.value = withSpring(1, SPRING_CONFIG)
  }

  const pressStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    }
  })

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[pressStyle]}>{children}</Animated.View>
    </Pressable>
  )
}

const ContentRenderer = ({
  style,
  width = 200,
  height
}: {
  style?: ViewStyle
  width?: number
  height: number
}) => {
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        ...style
      }}>
      <Image
        style={{
          flex: 1,
          width: '100%',
          borderRadius: 18
        }}
        source={`https://picsum.photos/${width}/${height}`}
        contentFit="cover"
      />
    </View>
  )
}
