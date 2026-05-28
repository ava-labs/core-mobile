import {
  BlurViewWithFallback,
  NavigationTitleHeader,
  Separator,
  Text,
  useTheme
} from '@avalabs/k2-alpine'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, {
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
  useKeyboardState
} from 'react-native-keyboard-controller'
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import { ErrorState } from './ErrorState'
import Grabber from './Grabber'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'

const HEADER_SENTINEL = Symbol('ListScreenV2Header')
const EMPTY_SENTINEL = Symbol('ListScreenV2Empty')
type SentinelItem = typeof HEADER_SENTINEL | typeof EMPTY_SENTINEL

// Use this component when you need to display a list of items in a screen.
// It handles all the logic for the header and footer, including keyboard interactions and gestures.

// It provides:
// - A navigation bar with a title
// - A header with a title
// - Custom sticky header and footer components
// - Custom empty state component
// - Proper keyboard avoidance and handling

// Used by all screens that display a list of items

export interface ListScreenProps<T>
  extends Omit<
    FlashListProps<T>,
    | 'ListHeaderComponent'
    | 'ListFooterComponent'
    | 'ListEmptyComponent'
    | 'stickyHeaderIndices'
    | 'initialScrollIndex'
    | 'getItemLayout'
    | 'onViewableItemsChanged'
    | 'viewabilityConfig'
    | 'viewabilityConfigCallbackPairs'
  > {
  /** The title displayed in the screen header */
  title: string
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** Optional title to display in the navigation bar */
  navigationTitle?: string
  /** Array of data items to be rendered in the list */
  data: T[]
  /** Whether this screen has a parent screen in the navigation stack */
  hasParent?: boolean
  /** Whether this screen is presented as a modal */
  isModal?: boolean
  /** Optional background color */
  backgroundColor?: string
  /** Whether to show the navigation header title */
  showNavigationHeaderTitle?: boolean
  /** Optional function to render a custom sticky header component */
  renderHeader?: () => React.ReactNode
  /** Optional function to render content in the navigation bar's right side */
  renderHeaderRight?: () => React.ReactNode
  /** Optional function to render content when the list is empty */
  renderEmpty?: () => React.ReactNode
  /** Optional function to render a fixed footer at the bottom of the screen */
  renderFooter?: () => React.ReactNode
  /** Optional function to render a true list footer rendered after the last item (maps to FlashList's ListFooterComponent). Use this for infinite-scroll spinners instead of renderFooter. */
  renderListFooter?: () => React.ReactNode
  /** Whether to show the sticky header */
  shouldShowStickyHeader?: boolean
  /** Optional ref to the flat list */
  flatListRef?: RefObject<ListScreenRef<T> | null>
}

export type ListScreenRef<T> = {
  scrollViewRef?: RefObject<FlashListRef<T>>
}

export const ListScreenV2 = <T,>({
  data,
  title,
  subtitle,
  navigationTitle,
  showNavigationHeaderTitle = true,
  hasParent,
  backgroundColor,
  isModal,
  renderEmpty,
  renderHeader,
  renderHeaderRight,
  renderFooter,
  renderListFooter,
  shouldShowStickyHeader = true,
  flatListRef,
  ...props
}: ListScreenProps<T>): JSX.Element => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const headerHeight = useEffectiveHeaderHeight()
  const keyboard = useKeyboardState()
  const frame = useSafeAreaFrame()

  const [targetLayout, setTargetLayout] = useState<
    LayoutRectangle | undefined
  >()
  const scrollViewRef = useRef<FlashListRef<T>>(null)

  // Shared values for worklets (UI thread animations)
  const titleHeight = useSharedValue<number>(0)
  const subtitleHeight = useSharedValue<number>(0)

  // State for React re-renders (used in useMemo)
  const [contentHeaderHeight, setContentHeaderHeight] = useState<number>(0)
  const [renderHeaderHeight, setRenderHeaderHeight] = useState<number>(0)
  const [headerSentinelHeight, setHeaderSentinelHeight] = useState<number>(0)
  const [footerHeight, setFooterHeight] = useState<number>(0)
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    if (renderFooter && !showFooter) {
      setShowFooter(true)
    }
  }, [renderFooter, showFooter])

  useImperativeHandle(
    flatListRef,
    () => ({
      scrollViewRef: scrollViewRef as RefObject<FlashListRef<T>>
    }),
    [scrollViewRef]
  )

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      targetLayout,
      shouldHeaderHaveGrabber: isModal,
      hideHeaderBackground: shouldShowStickyHeader,
      hasSeparator: shouldShowStickyHeader
        ? renderHeader
          ? false
          : true
        : true,
      hasBackgroundAnimation: !shouldShowStickyHeader,
      backgroundColor,
      hasParent,
      showNavigationHeaderTitle,
      renderHeaderRight
    }
  )

  const onScrollEvent = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll(event)
    },
    [onScroll]
  )

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      if (event.nativeEvent.contentOffset.y < contentHeaderHeight) {
        if (event.nativeEvent.contentOffset.y > titleHeight.value) {
          scrollViewRef.current?.scrollToOffset({
            offset:
              event.nativeEvent.contentOffset.y > contentHeaderHeight
                ? event.nativeEvent.contentOffset.y
                : contentHeaderHeight,
            animated: true
          })
        } else {
          scrollViewRef.current?.scrollToOffset({
            offset: 0,
            animated: true
          })
        }
      }
    },
    [contentHeaderHeight, titleHeight]
  )

  const handleTitleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, x, y, width } = event.nativeEvent.layout
      titleHeight.value = height
      setTargetLayout({
        x,
        y,
        width,
        height
      })
    },
    [titleHeight]
  )

  const handleSubtitleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      subtitleHeight.value = height
    },
    [subtitleHeight]
  )

  const handleRenderHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setRenderHeaderHeight(height)
  }, [])

  const handleContentHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setContentHeaderHeight(height)
  }, [])

  const handleHeaderSentinelLayout = useCallback((event: LayoutChangeEvent) => {
    setHeaderSentinelHeight(event.nativeEvent.layout.height)
  }, [])

  const animatedHeaderContainerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, contentHeaderHeight],
      [0, -contentHeaderHeight - (isModal ? 16 : 20)],
      Extrapolation.CLAMP
    )

    return {
      transform: [
        {
          translateY: shouldShowStickyHeader ? translateY : 0
        }
      ]
    }
  })

  const animatedTitleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [
        -titleHeight.value - subtitleHeight.value,
        0,
        titleHeight.value + subtitleHeight.value
      ],
      [Platform.OS === 'ios' ? 0.98 : 1, 1, 0.95]
    )
    return {
      opacity: 1 - targetHiddenProgress.value,
      transform: [{ scale: data.length === 0 ? 1 : scale }]
    }
  })

  const animatedSubtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - targetHiddenProgress.value
    }
  })

  const animatedHeaderBlurStyle = useAnimatedStyle(() => {
    return {
      opacity: !shouldShowStickyHeader
        ? 0
        : backgroundColor
        ? targetHiddenProgress.value
        : 1
    }
  })

  const animatedBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
    return {
      opacity: shouldShowStickyHeader ? opacity : 0
    }
  })

  const {
    renderItem,
    keyExtractor,
    getItemType,
    contentContainerStyle: _contentContainerStyle,
    ...restProps
  } = props

  const contentContainerStyle = useMemo(() => {
    const footerPadding = renderFooter ? footerHeight : 0
    const paddingBottom = keyboard.isVisible
      ? keyboard.height + 16
      : insets.bottom + 16 + footerPadding

    return {
      ...((_contentContainerStyle as ViewStyle) ?? {}),
      paddingBottom
    }
  }, [
    keyboard.isVisible,
    keyboard.height,
    insets.bottom,
    _contentContainerStyle,
    renderFooter,
    footerHeight
  ])

  const isAndroidModal = Platform.OS === 'android' && isModal
  const flashListMarginTop = isAndroidModal
    ? title.length === 0
      ? insets.top - 8
      : headerHeight
    : 0

  const overrideProps = useMemo(() => {
    const extraPadding = isModal
      ? -insets.top - (Platform.OS === 'ios' ? 8 : 16)
      : 8

    return {
      contentContainerStyle: {
        ...contentContainerStyle,
        ...(data.length === 0
          ? { flex: 1 }
          : {
              minHeight:
                frame.height +
                contentHeaderHeight +
                extraPadding -
                flashListMarginTop -
                (shouldShowStickyHeader ? renderHeaderHeight : 0)
            })
      }
    }
  }, [
    contentContainerStyle,
    data.length,
    frame.height,
    contentHeaderHeight,
    isModal,
    insets.top,
    shouldShowStickyHeader,
    renderHeaderHeight,
    flashListMarginTop
  ])

  // Prepend header sentinel (and empty sentinel when no data) so
  // stickyHeaderIndices={[0]} pins the header as a data item.
  const dataWithSentinels = useMemo(() => {
    const items: (T | SentinelItem)[] = [HEADER_SENTINEL]
    if (data.length === 0) {
      items.push(EMPTY_SENTINEL)
    } else {
      items.push(...data)
    }
    return items
  }, [data])

  const headerContent = useMemo(() => {
    return (
      <View
        style={{ overflow: 'hidden' }}
        onLayout={handleHeaderSentinelLayout}>
        <Animated.View style={[animatedHeaderContainerStyle]}>
          <View
            style={{
              paddingTop: isAndroidModal ? 16 : headerHeight + 16,
              paddingBottom: renderHeader ? 12 : 0
            }}>
            <Animated.View
              style={[
                animatedHeaderBlurStyle,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }
              ]}>
              <BlurViewWithFallback
                style={{
                  flex: 1
                }}
              />
            </Animated.View>
            <View
              onLayout={handleContentHeaderLayout}
              style={{
                gap: 6,
                paddingHorizontal: 16,
                paddingBottom: 12
              }}>
              {title ? (
                <Animated.View
                  onLayout={handleTitleLayout}
                  style={animatedTitleStyle}>
                  <Text variant="heading2">{title}</Text>
                </Animated.View>
              ) : null}

              {subtitle ? (
                <Animated.View
                  onLayout={handleSubtitleLayout}
                  style={[animatedSubtitleStyle]}>
                  <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
                    {subtitle}
                  </Text>
                </Animated.View>
              ) : null}
            </View>
            {renderHeader && (
              <View
                onLayout={handleRenderHeaderLayout}
                style={{
                  paddingHorizontal: 16
                }}>
                {renderHeader?.()}
              </View>
            )}
          </View>
          <Animated.View
            style={[
              animatedBorderStyle,
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0
              }
            ]}>
            <Separator />
          </Animated.View>
        </Animated.View>
      </View>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animated styles from useAnimatedStyle are stable worklet refs
  }, [
    isAndroidModal,
    renderHeader,
    headerHeight,
    handleHeaderSentinelLayout,
    handleContentHeaderLayout,
    title,
    handleTitleLayout,
    subtitle,
    handleSubtitleLayout,
    handleRenderHeaderLayout
  ])

  const emptyContentHeight = useMemo(() => {
    const bottomPadding = contentContainerStyle.paddingBottom
    return Math.max(
      0,
      frame.height - flashListMarginTop - headerSentinelHeight - bottomPadding
    )
  }, [
    frame.height,
    flashListMarginTop,
    headerSentinelHeight,
    contentContainerStyle.paddingBottom
  ])

  const emptyContent = useMemo(() => {
    const style = {
      minHeight: emptyContentHeight,
      justifyContent: 'center' as const,
      paddingBottom: emptyContentHeight * 0.1 // optical center offset
    }
    if (renderEmpty) {
      return <View style={style}>{renderEmpty()}</View>
    }
    return (
      <ErrorState
        sx={style}
        title="No results"
        description="Try a different search"
      />
    )
  }, [renderEmpty, emptyContentHeight])

  const internalRenderItem = useCallback(
    (info: { item: T | SentinelItem; index: number }) => {
      if (info.item === HEADER_SENTINEL) return headerContent
      if (info.item === EMPTY_SENTINEL) return emptyContent
      return (
        renderItem?.({
          ...info,
          item: info.item as T,
          index: info.index - 1
        } as Parameters<NonNullable<FlashListProps<T>['renderItem']>>[0]) ??
        null
      )
    },
    [headerContent, emptyContent, renderItem]
  )

  const internalKeyExtractor = useCallback(
    (item: T | SentinelItem, index: number) => {
      if (item === HEADER_SENTINEL) return '__list_screen_header__'
      if (item === EMPTY_SENTINEL) return '__list_screen_empty__'
      return keyExtractor
        ? keyExtractor(item as T, index - 1)
        : String(index - 1)
    },
    [keyExtractor]
  )

  const internalGetItemType = useCallback(
    (item: T | SentinelItem, index: number) => {
      if (item === HEADER_SENTINEL) return 'header'
      if (item === EMPTY_SENTINEL) return 'empty'
      return getItemType ? getItemType(item as T, index - 1) : undefined
    },
    [getItemType]
  )

  const renderGrabber = useCallback(() => {
    if (isModal)
      return (
        <View
          style={{
            position: 'absolute',
            top: Platform.OS === 'android' ? insets.top - 2 : 9,
            left: 0,
            right: 0,
            zIndex: 1000
          }}>
          <Grabber />
        </View>
      )
  }, [insets.top, isModal])

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setFooterHeight(height)
  }, [])

  const renderFooterContent = useCallback(() => {
    if (renderFooter && showFooter) {
      const footer = renderFooter()
      if (footer) {
        return (
          <LinearGradientBottomWrapper>
            <Animated.View
              entering={FadeIn.delay(150)}
              onLayout={handleFooterLayout}
              style={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 16
              }}>
              {footer}
            </Animated.View>
          </LinearGradientBottomWrapper>
        )
      }
    }
    return null
  }, [renderFooter, showFooter, handleFooterLayout, insets.bottom])

  return (
    <Animated.View
      style={[{ flex: 1 }]}
      entering={getListItemEnteringAnimation(0)}>
      <FlashList
        ref={scrollViewRef}
        renderScrollComponent={RenderScrollComponent}
        onScroll={onScrollEvent}
        onScrollEndDrag={onScrollEndDrag}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={shouldShowStickyHeader ? [0] : undefined}
        stickyHeaderConfig={{ hideRelatedCell: true }}
        overrideProps={overrideProps}
        contentContainerStyle={contentContainerStyle}
        {...restProps}
        data={dataWithSentinels as T[]}
        renderItem={
          internalRenderItem as unknown as FlashListProps<T>['renderItem']
        }
        keyExtractor={
          internalKeyExtractor as (item: T, index: number) => string
        }
        getItemType={internalGetItemType as FlashListProps<T>['getItemType']}
        ListFooterComponent={renderListFooter ? renderListFooter : undefined}
        style={StyleSheet.flatten([
          {
            backgroundColor: backgroundColor ?? 'transparent',
            marginTop: flashListMarginTop
          },
          restProps.style
        ])}
      />
      {renderGrabber()}
      {renderFooterContent()}
    </Animated.View>
  )
}

const RenderScrollComponent = React.forwardRef<
  KeyboardAwareScrollViewRef,
  ScrollViewProps
>((props, ref) => (
  <KeyboardAwareScrollView
    {...props}
    ref={ref}
    nestedScrollEnabled={Platform.OS === 'android'}
  />
))
