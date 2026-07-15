import {
  BlurViewWithFallback,
  NavigationTitleHeader,
  Separator,
  Text
} from '@avalabs/k2-alpine'
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
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
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
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
  useSharedValue,
  withTiming
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
  /**
   * Android only: render the title/search header OUTSIDE the scroll list (a
   * fixed top region) and mount the FlashList only once `data` is non-empty;
   * the empty state renders below the fixed header.
   *
   * On iOS this prop is ignored — the default in-list header is used, which
   * works as expected there.
   *
   * Use for Android form-sheet search screens that start empty:
   * react-native-screens wires the form sheet's swipe-to-dismiss (and nested
   * scroll) to the first scrollable child found when the sheet lays out, so a
   * list that's empty at mount is never wired and neither scroll nor
   * swipe-to-dismiss work on release builds. Mounting the list only with data
   * present fixes the wiring, and keeping the search header outside the list
   * means it never remounts when results appear (typing doesn't drop focus).
   *
   * Defaults to false (CP-14376).
   */
  headerOutsideList?: boolean
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
  /**
   * Renders an absolute-positioned banner just below the sticky header that
   * fades in once the user has scrolled past `triggerContentY` (a y-coordinate
   * in FlashList content space, typically obtained via the FlashList ref's
   * `getLayout(index)`). Useful for section labels that need to stick at the
   * top of the list but can't be added to FlashList's `stickyHeaderIndices`
   * (which only shows one sticky at a time and would push out the title/search
   * header).
   */
  headerOverlay?: {
    triggerContentY: number
    render: () => React.ReactNode
  }
  /** Optional ref to the flat list */
  flatListRef?: RefObject<ListScreenRef<T> | null>
}

export type ListScreenRef<T> = {
  scrollViewRef?: RefObject<FlashListRef<T>>
}

const DefaultListScreen = <T,>({
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
  headerOverlay,
  flatListRef,
  ...props
}: ListScreenProps<T>): JSX.Element => {
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

  // Stable header element — recreated only when the title text changes, so
  // `useFadingHeaderNavigation`'s header-title sync effect doesn't re-run (and
  // re-`setOptions`) on every render. See ScrollScreen for the same fix.
  const navigationHeader = useMemo(
    () => <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
    [navigationTitle, title]
  )

  const { onScroll, scrollY, targetHiddenProgress } = useFadingHeaderNavigation(
    {
      header: navigationHeader,
      targetLayout,
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

  // Capture only the emptiness flag — referencing `data` inside the worklet
  // would serialize the whole array to the UI thread, which throws on
  // non-plain values (e.g. Big instances) since react-native-worklets 0.10.
  const isListEmpty = data.length === 0

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
      transform: [{ scale: isListEmpty ? 1 : scale }],
      transformOrigin: 'bottom left'
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

  // Pull primitives out of `headerOverlay` so the worklet captures stable
  // values — otherwise the whole object reference (new on each
  // triggerContentY tick from the caller) would force Reanimated to
  // recompile the worklet.
  const hasHeaderOverlay = !!headerOverlay
  const overlayTrigger = headerOverlay?.triggerContentY ?? 0
  const headerOverlayAnimatedStyle = useAnimatedStyle(() => {
    if (!hasHeaderOverlay || headerSentinelHeight === 0) {
      return { opacity: 0 }
    }
    // The header's inner content translates up by `heightDelta` on scroll
    // (see animatedHeaderContainerStyle below the title fade animation).
    // The visible sticky bottom is therefore `headerSentinelHeight -
    // heightDelta` once scrolled, which is where the overlay should sit.
    const heightDelta = shouldShowStickyHeader
      ? contentHeaderHeight + (isModal ? 16 : 20)
      : 0
    const visibleStickyBottom = headerSentinelHeight - heightDelta
    const threshold = overlayTrigger - visibleStickyBottom

    // Crossfade window — fade the overlay in/out over a ~24 px scroll range
    // centered on the threshold so the banner hits half-opacity at the exact
    // moment the in-list divider crosses the sticky edge. Without this, the
    // divider scrolls under the header and the banner pops in afterward,
    // producing a visible beat where neither label is on screen.
    const FADE = 24
    const opacity = interpolate(
      scrollY.value,
      [threshold - FADE / 2, threshold + FADE / 2],
      [0, 1],
      Extrapolation.CLAMP
    )
    // Ride the same translateY as the inner content so the overlay sits flush
    // with the collapsed sticky bottom instead of the original natural
    // bottom (which would leave a transparent gap where the title used to be).
    const collapseTranslate = interpolate(
      scrollY.value,
      [0, contentHeaderHeight],
      [0, -heightDelta],
      Extrapolation.CLAMP
    )
    // A small bounded slide on entry adds motion to the dissolve.
    const entranceTranslate = interpolate(
      scrollY.value,
      [threshold - FADE / 2, threshold + FADE / 2],
      [-6, 0],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [{ translateY: collapseTranslate + entranceTranslate }]
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
      {headerOverlay && (
        // The overlay is a non-interactive label that sits directly on top of
        // the first list row. It animates from opacity 0, and an opacity-0 view
        // still intercepts touches — with "box-none" the opaque banner child
        // swallowed taps on the first token (CP-14391). "none" lets every tap
        // fall through to the list beneath, which is all the banner ever wants.
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: flashListMarginTop + headerSentinelHeight,
              left: 0,
              right: 0,
              zIndex: 1
            },
            headerOverlayAnimatedStyle
          ]}>
          {headerOverlay.render()}
        </Animated.View>
      )}
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
    // Keyboard handling is done manually via `contentContainerStyle`'s
    // keyboard-height paddingBottom (content-aware: only what's actually
    // hidden behind the keyboard becomes scrollable). Left enabled, this
    // component would ALSO add a keyboard-height contentInset while the
    // keyboard is open, unconditionally extending the scroll range — a whole
    // keyboard of blank space below short lists (CP-14376). Auto
    // scroll-to-focused-input isn't needed either: every ListScreenV2 input
    // is a search bar in the top header, never hidden by the keyboard.
    enabled={false}
    nestedScrollEnabled={Platform.OS === 'android'}
  />
))

// Scroll component for the Android `headerOutsideList` mode. A plain ScrollView
// (not keyboard-aware: the input lives in the fixed header above the list) with
// `nestedScrollEnabled` so the list participates in the Android form sheet's
// nested scroll — a vertical swipe scrolls the list and, at the top, hands back
// to the sheet's drag-to-dismiss instead of being swallowed (CP-14376).
const PlainScrollComponent = React.forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => (
    <ScrollView
      {...props}
      ref={ref}
      nestedScrollEnabled={Platform.OS === 'android'}
    />
  )
)
PlainScrollComponent.displayName = 'ListScreenV2PlainScrollComponent'

// `headerOutsideList` variant (Android): the title/search header is a fixed top
// region and the FlashList mounts only once there's data. Keeps the search
// header out of the scroll list (so it never remounts / drops focus) and lets
// the Android form sheet wire swipe-to-dismiss to a non-empty list (CP-14376).
const OuterHeaderListScreen = <T,>({
  data,
  title,
  isModal,
  backgroundColor,
  renderEmpty,
  renderHeader,
  renderListFooter,
  flatListRef,
  // Not supported in this variant — destructured so they don't leak into the
  // FlashList spread below.
  subtitle: _subtitle,
  navigationTitle: _navigationTitle,
  showNavigationHeaderTitle: _showNavigationHeaderTitle,
  hasParent: _hasParent,
  renderHeaderRight: _renderHeaderRight,
  renderFooter: _renderFooter,
  shouldShowStickyHeader: _shouldShowStickyHeader,
  headerOverlay: _headerOverlay,
  ...props
}: ListScreenProps<T>): JSX.Element => {
  const insets = useSafeAreaInsets()
  const headerHeight = useEffectiveHeaderHeight()
  const keyboard = useKeyboardState()
  const scrollViewRef = useRef<FlashListRef<T>>(null)

  const {
    renderItem,
    keyExtractor,
    getItemType,
    contentContainerStyle: _contentContainerStyle,
    ...restProps
  } = props

  useImperativeHandle(
    flatListRef,
    () => ({
      scrollViewRef: scrollViewRef as RefObject<FlashListRef<T>>
    }),
    [scrollViewRef]
  )

  const isAndroidModal = Platform.OS === 'android' && isModal

  // Keep the centered empty state above the keyboard (the search input is
  // autofocused, so the keyboard is usually open). Animate `paddingBottom`
  // rather than a translate: the container's outer bounds stay fixed below the
  // fixed header, so it never overlaps/covers the header's Cancel/clear
  // controls — while the centered content still eases up above the keyboard
  // (withTiming, like the CollapsibleTabs ContentWrapper).
  const emptyAnimatedStyle = useAnimatedStyle(() => ({
    paddingBottom: withTiming(keyboard.isVisible ? keyboard.height : 0, {
      duration: 100
    })
  }))

  return (
    <View
      style={{ flex: 1, backgroundColor: backgroundColor ?? 'transparent' }}>
      <View
        style={{
          paddingTop: isAndroidModal
            ? insets.top + 18
            : isModal
            ? 28
            : headerHeight + 16,
          paddingHorizontal: 16,
          paddingBottom: 12
        }}>
        {title ? (
          <Text
            variant="heading2"
            style={{ marginBottom: renderHeader ? 12 : 0 }}>
            {title}
          </Text>
        ) : null}
        {renderHeader?.()}
      </View>
      {data.length === 0 ? (
        <Animated.View style={[{ flex: 1 }, emptyAnimatedStyle]}>
          <Pressable
            style={{ flex: 1 }}
            // Tapping the empty/zero-state area dismisses the keyboard (there's
            // no scroll view here to provide keyboardDismissMode).
            onPress={() => Keyboard.dismiss()}>
            {renderEmpty?.()}
          </Pressable>
        </Animated.View>
      ) : (
        <FlashList
          {...restProps}
          ref={scrollViewRef}
          renderScrollComponent={PlainScrollComponent}
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            ...((_contentContainerStyle as ViewStyle) ?? {}),
            // The Android form sheet is NOT resized when the keyboard opens —
            // the window keeps its height (KeyboardProvider) and a
            // single-detent sheet is only nudged up by its top gap, so the
            // keyboard covers the bottom of the list. Reserve that space so
            // the covered rows can scroll into view; without it a list that
            // overflows the visible area but fits the sheet can't scroll at
            // all. This plain ScrollView has no keyboard awareness of its
            // own, so this is single (not double) compensation.
            paddingBottom:
              (keyboard.isVisible ? keyboard.height : insets.bottom) + 16
          }}
          ListFooterComponent={renderListFooter ?? undefined}
        />
      )}
      {isModal && (
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
      )}
    </View>
  )
}

// `headerOutsideList` only changes layout on Android, where the form sheet
// scroll/dismiss wiring needs a non-empty list at mount. iOS uses the default
// in-list header (form sheets work there as-is).
export const ListScreenV2 = <T,>({
  headerOutsideList = false,
  ...props
}: ListScreenProps<T>): JSX.Element =>
  headerOutsideList && Platform.OS === 'android' ? (
    <OuterHeaderListScreen {...props} />
  ) : (
    <DefaultListScreen {...props} />
  )
