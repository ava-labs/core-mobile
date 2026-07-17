import {
  BlurViewWithFallback,
  NavigationTitleHeader,
  Separator,
  SxProp,
  Text
} from '@avalabs/k2-alpine'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, {
  forwardRef,
  useCallback,
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
  StyleProp,
  View,
  ViewStyle
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
  KeyboardStickyView
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Grabber from './Grabber'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'

// Extra padding bottom so the gradient doesnt cover the bottom of the screen
const EXTRA_PADDING_BOTTOM = 48

// Use this component when you need a scrollable screen with proper keyboard handling and header management.
// It handles all the logic for the header and footer, including keyboard interactions and gestures.

// *** Always use this component for most scrollable screens
// *** All screens are usually scrollable (android won't scroll if the contents are smaller than the screen)
// *** We never display a View as a wrapper, it's always a ScrollView or KeyboardAwareScrollView
// *** If you have an input on the screen, you need to enable keyboard avoiding
// *** Never use a view to wrap your route content, use this instead

// It provides:
// - A navigation bar with a title
// - A header with a title and subtitle
// - A footer with a loading indicator
// - Custom sticky header and footer components
// - Custom empty state component
// - Proper keyboard avoidance and handling

interface ScrollScreenProps extends KeyboardAwareScrollViewProps {
  /** The main title displayed at the top of the screen */
  title?: string
  titleSx?: SxProp
  /** Optional subtitle displayed below the title */
  subtitle?: string
  /** The main content to be displayed in the scrollable area */
  children: React.ReactNode
  /** Whether this screen has a parent screen in the navigation stack */
  hasParent?: boolean
  /** Whether this screen is presented as a modal */
  isModal?: boolean
  /** Whether the screen should adjust its layout when the keyboard appears */
  shouldAvoidKeyboard?: boolean
  /** Whether the screen should avoid the footer when the keyboard appears */
  disableStickyFooter?: boolean
  /** Title to be displayed in the navigation header */
  navigationTitle?: string
  /** Custom header component to be rendered */
  renderHeader?: () => React.ReactNode
  /** Custom footer component to be rendered at the bottom of the screen */
  renderFooter?: () => React.ReactNode
  /** Custom component to be rendered on the right side of the header */
  renderHeaderRight?: () => React.ReactNode
  /** The distance between keyboard and focused TextInput when keyboard is shown. Default is 0. */
  bottomOffset?: number
  /** Whether this screen should show navigation title when scroll. Default is true. */
  showNavigationHeaderTitle?: boolean
  /** Custom style for the header */
  headerStyle?: StyleProp<ViewStyle>
  /** Whether this screen should hide the header background  */
  hideHeaderBackground?: boolean
  /** Overlay component rendered absolutely positioned at the top of the screen over the header area */
  headerCenterOverlay?: React.ReactNode
  /** TestID for the screen */
  testID?: string
  /** Called when the scroll position reaches the end of the content */
  onScrolledToEnd?: (reachedEnd: boolean) => void
}

const KeyboardScrollView = Animated.createAnimatedComponent(
  KeyboardAwareScrollView
)

function assignForwardedRef<T>(
  ref: React.ForwardedRef<T>,
  node: T | null
): void {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref) {
    ref.current = node
  }
}

export const ScrollScreen = forwardRef<ScrollView, ScrollScreenProps>(
  // eslint-disable-next-line sonarjs/cognitive-complexity
  function ScrollScreen(
    {
      title,
      titleSx,
      subtitle,
      children,
      hasParent,
      isModal,
      navigationTitle,
      shouldAvoidKeyboard,
      // Default to the pre-1.21 spacer-view keyboard avoidance.
      // keyboard-controller 1.21 changed `KeyboardAwareScrollView`'s default to
      // `mode="insets"`, which only adjusts `contentInset` and doesn't move
      // non-scrollable `flex: 1` layouts above the keyboard. Defaulting to
      // "layout" keeps every screen behaving exactly as it did before the
      // RN/keyboard-controller upgrade. Adopting "insets" should be an opt-in,
      // per-screen change with its own QA.
      mode = 'layout',
      disableStickyFooter,
      showNavigationHeaderTitle = true,
      hideHeaderBackground,
      headerCenterOverlay,
      headerStyle,
      testID = 'bottom_sheet',
      renderHeader,
      renderFooter,
      renderHeaderRight,
      onScrolledToEnd,
      // Pulled out of `...props` so the internal size/layout tracking can be
      // composed with them rather than silently overriding them.
      onContentSizeChange: onContentSizeChangeProp,
      onLayout: onLayoutProp,
      onScrollEndDrag: onScrollEndDragProp,
      ...props
    },
    ref
  ): JSX.Element {
    const insets = useSafeAreaInsets()
    const headerHeight = useEffectiveHeaderHeight()

    const [headerLayout, setHeaderLayout] = useState<
      LayoutRectangle | undefined
    >()

    const [headerTitleLayout, setHeaderTitleLayout] = useState<
      LayoutRectangle | undefined
    >()

    const [footerLayout, setFooterLayout] = useState<
      LayoutRectangle | undefined
    >()

    // Internal handle for the header snap's `scrollTo`, composed with the
    // forwarded ref so callers keep their handle.
    const scrollViewRef = useRef<ScrollView | null>(null)
    const setScrollViewRef = useCallback(
      (node: ScrollView | null) => {
        scrollViewRef.current = node
        assignForwardedRef(ref, node)
      },
      [ref]
    )

    // scroll to end tracking
    const scrollContentHeight = useRef(0)
    const scrollViewHeight = useRef(0)
    const hasReachedEndRef = useRef(false)
    // Measured height of the scroll viewport, mirrored into state so it can
    // drive the content container's `minHeight` (see below).
    const [scrollViewLayoutHeight, setScrollViewLayoutHeight] = useState(0)
    const titleHeight = useSharedValue<number>(0)
    const subtitleHeight = useSharedValue<number>(0)

    const SCROLL_END_THRESHOLD = 20

    // Whether the content actually overflows the viewport. Drives Android
    // `nestedScrollEnabled` on the keyboard-aware branch: when the content
    // scrolls, the plain RN ScrollView must participate in the parent form
    // sheet's nested scrolling so a downward swipe scrolls to the top instead
    // of being captured by the sheet's drag-to-dismiss. When the content fits,
    // we leave it off so a short modal stays swipe-to-dismiss. (CP-14679)
    const [isScrollable, setIsScrollable] = useState(false)

    const updateIsScrollable = useCallback(() => {
      // Only the keyboard-aware branch's Android form-sheet nested-scroll path
      // reads this (see `nestedScrollEnabled` below): it negotiates with a
      // parent `BottomSheetBehavior`, which only exists when the screen is a
      // modal. Everywhere else the value is never consumed — the non-keyboard
      // branch renders a gesture-handler ScrollView with no `isScrollable` prop,
      // and iOS / non-modal screens have no sheet to negotiate with. Skip the
      // state update in all those cases to avoid renders for a value nothing
      // reads (e.g. an Android modal ActionSheet using `onScrolledToEnd` on the
      // non-keyboard branch). Keep this gate in sync with `scrollBelowHeader`
      // and `nestedScrollEnabled` below.
      if (Platform.OS !== 'android' || !isModal || !shouldAvoidKeyboard) return
      // Wait until BOTH the viewport and the content have been measured before
      // computing scrollability. `onLayout` and `onContentSizeChange` fire in
      // either order; acting on a half-measured state (e.g. content known but
      // `scrollViewHeight` still 0) would make `maxScroll` equal the full
      // content height and wrongly mark short content as scrollable, briefly
      // enabling `nestedScrollEnabled` and breaking swipe-to-dismiss.
      if (scrollViewHeight.current <= 0 || scrollContentHeight.current <= 0)
        return
      const maxScroll = scrollContentHeight.current - scrollViewHeight.current
      const scrollable = maxScroll > 0
      setIsScrollable(prev => (prev === scrollable ? prev : scrollable))
    }, [isModal, shouldAvoidKeyboard])

    const checkScrolledToEnd = useCallback(
      (contentOffsetY: number) => {
        if (!onScrolledToEnd || hasReachedEndRef.current) return

        const maxScroll = scrollContentHeight.current - scrollViewHeight.current
        const isAtEnd =
          maxScroll <= 0 || contentOffsetY >= maxScroll - SCROLL_END_THRESHOLD

        if (isAtEnd) {
          hasReachedEndRef.current = true
          onScrolledToEnd(true)
        }
      },
      [onScrolledToEnd]
    )

    const checkScrollableAfterLayout = useCallback(() => {
      if (!onScrolledToEnd) return

      const maxScroll = scrollContentHeight.current - scrollViewHeight.current
      if (maxScroll <= 0 && scrollContentHeight.current > 0) {
        // content doesn't require scroll
        hasReachedEndRef.current = true
        onScrolledToEnd(true)
      }
    }, [onScrolledToEnd])

    const handleContentSizeChange = useCallback(
      (_w: number, h: number) => {
        const prevHeight = scrollContentHeight.current
        scrollContentHeight.current = h
        updateIsScrollable()

        if (!onScrolledToEnd) return

        if (Math.abs(h - prevHeight) > 1) {
          hasReachedEndRef.current = false
          onScrolledToEnd(false)
          checkScrollableAfterLayout()
        }
      },
      [onScrolledToEnd, checkScrollableAfterLayout, updateIsScrollable]
    )

    const handleScrollViewLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout
        scrollViewHeight.current = height
        setScrollViewLayoutHeight(prev => (prev === height ? prev : height))
        updateIsScrollable()
        checkScrollableAfterLayout()
      },
      [checkScrollableAfterLayout, updateIsScrollable]
    )

    // Run the internal tracking and then forward to any caller-provided
    // handler, so passing `onContentSizeChange` / `onLayout` to ScrollScreen
    // keeps working instead of being overridden by the internal handlers.
    const handleContentSizeChangeComposed = useCallback(
      (w: number, h: number) => {
        handleContentSizeChange(w, h)
        onContentSizeChangeProp?.(w, h)
      },
      [handleContentSizeChange, onContentSizeChangeProp]
    )

    const handleScrollViewLayoutComposed = useCallback(
      (e: LayoutChangeEvent) => {
        handleScrollViewLayout(e)
        onLayoutProp?.(e)
      },
      [handleScrollViewLayout, onLayoutProp]
    )

    const handleTitleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { height, x, y, width } = event.nativeEvent.layout
        titleHeight.value = height
        setHeaderTitleLayout(prev =>
          prev &&
          prev.x === x &&
          prev.y === y &&
          prev.width === width &&
          prev.height === height
            ? prev
            : { x, y, width, height }
        )
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

    // Stable header element — recreated only when the title text changes. Passing
    // a fresh JSX element every render made `useFadingHeaderNavigation`'s
    // header-title sync effect re-run each render → repeated `navigation
    // .setOptions`, which (stacked across nested modal screens) churned the
    // native header and pegged the JS thread.
    const navigationHeader = useMemo(
      () => <NavigationTitleHeader title={navigationTitle ?? title ?? ''} />,
      [navigationTitle, title]
    )

    const {
      onScroll: onFadingScroll,
      scrollY,
      targetHiddenProgress
    } = useFadingHeaderNavigation({
      header: navigationHeader,
      targetLayout: headerTitleLayout ?? headerLayout,
      hasParent,
      hideHeaderBackground: hideHeaderBackground || isModal,
      renderHeaderRight,
      showNavigationHeaderTitle
    })

    const onScroll = useCallback(
      (
        event:
          | NativeSyntheticEvent<NativeScrollEvent>
          | NativeScrollEvent
          | number
      ) => {
        onFadingScroll(event)

        if (onScrolledToEnd) {
          let offsetY = 0
          if (typeof event === 'number') {
            offsetY = event
          } else if ('nativeEvent' in event) {
            offsetY = event.nativeEvent.contentOffset.y
          } else {
            offsetY = event.contentOffset.y
          }
          checkScrolledToEnd(offsetY)
        }
      },
      [onFadingScroll, onScrolledToEnd, checkScrolledToEnd]
    )

    // Snap the header on release, mirroring ListScreenV2's `onScrollEndDrag`:
    // a drag released inside the collapsible header region either commits past
    // it (offset past the title+description block → fully collapsed, nav title
    // fully in) or bounces back to fully expanded — never rests half-faded.
    const handleScrollEndDrag = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
        onScrollEndDragProp?.(event)

        // The no-title branch renders a phantom absolute header — its height
        // must not trigger snapping.
        if (!title && !subtitle) return

        const headerRegionHeight = headerLayout?.height ?? 0
        if (headerRegionHeight <= 0 || titleHeight.value <= 0) return

        const offsetY = event.nativeEvent.contentOffset.y
        if (offsetY <= 0 || offsetY >= headerRegionHeight) return

        scrollViewRef.current?.scrollTo({
          y: offsetY > titleHeight.value ? headerRegionHeight : 0,
          animated: true
        })
      },
      [onScrollEndDragProp, title, subtitle, headerLayout?.height, titleHeight]
    )

    // Commit a new layout object only when the measured rect actually changed.
    // `onLayout` can fire repeatedly with identical values (notably when a
    // screen is re-measured every frame while backgrounded behind another in a
    // native-stack — e.g. the delegate node screens behind the amount step).
    // Setting a fresh object each time would re-render → re-lay out → fire
    // `onLayout` again, spinning a layout↔setState loop that pegs the JS thread
    // (visible as a flood of `UIManagerBinding::get` in a CPU profile).
    const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout
      setHeaderLayout(prev =>
        prev &&
        prev.x === x &&
        prev.y === y &&
        prev.width === width &&
        prev.height === height
          ? prev
          : { x, y, width, height }
      )
    }, [])

    const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout
      setFooterLayout(prev =>
        prev &&
        prev.x === x &&
        prev.y === y &&
        prev.width === width &&
        prev.height === height
          ? prev
          : { x, y, width, height }
      )
    }, [])

    const animatedBorderStyle = useAnimatedStyle(() => {
      const opacity = interpolate(scrollY.value, [0, headerHeight], [0, 1])
      return {
        opacity
      }
    })

    // The content container must be at least as tall as the scroll viewport
    // (short content still fills the screen; the footer is already accounted
    // for by the container's `paddingBottom`) PLUS the collapsible title
    // region when one exists, so the release snap (`handleScrollEndDrag`)
    // always has enough scroll range to tuck the title fully under the
    // navigation header instead of stalling mid-fade at the content's max
    // offset. Both terms come from measured layouts rather than
    // `useSafeAreaFrame` math: the frame/inset relationship varies across
    // Android nav modes (gesture vs 3-button), devices and build variants, so
    // a computed value only held in the environment its constants were tuned
    // in. `undefined` until the first layout lands.
    const collapsibleHeaderHeight =
      title || subtitle ? headerLayout?.height ?? 0 : 0
    const minHeight =
      scrollViewLayoutHeight > 0
        ? scrollViewLayoutHeight + collapsibleHeaderHeight
        : undefined

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
        transform: [{ scale }],
        transformOrigin: 'bottom left'
      }
    })

    const animatedSubtitleStyle = useAnimatedStyle(() => {
      return {
        opacity: 1 - targetHiddenProgress.value
      }
    })

    const renderHeaderContent = useCallback(() => {
      if (title || subtitle || renderHeader) {
        const hasTitle = Boolean(title || subtitle)
        return (
          <View collapsable={false} onLayout={handleHeaderLayout}>
            <View
              collapsable={false}
              style={[headerStyle, hasTitle ? { gap: 4 } : undefined]}>
              {hasTitle ? (
                <View
                  style={{
                    gap: 6,
                    paddingBottom: 12
                  }}>
                  {title ? (
                    <Animated.View
                      onLayout={handleTitleLayout}
                      style={animatedTitleStyle}>
                      <Text variant="heading2" numberOfLines={4} sx={titleSx}>
                        {title}
                      </Text>
                    </Animated.View>
                  ) : null}

                  {subtitle ? (
                    <Animated.View
                      onLayout={handleSubtitleLayout}
                      style={[animatedSubtitleStyle]}>
                      <Text
                        variant="subtitle1"
                        sx={{ color: '$textSecondary' }}>
                        {subtitle}
                      </Text>
                    </Animated.View>
                  ) : null}
                </View>
              ) : null}

              {!hasTitle && renderHeader?.()}
            </View>

            {hasTitle && renderHeader?.()}
          </View>
        )
      } else {
        // If we don't have a title or subtitle, we need to render an empty header
        // so that the header height is not undefined
        return (
          <View
            collapsable={false}
            onLayout={handleHeaderLayout}
            style={[
              headerStyle,
              {
                position: 'absolute',
                minHeight: headerHeight,
                pointerEvents: 'none'
              }
            ]}
          />
        )
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      headerHeight,
      headerStyle,
      handleHeaderLayout,
      renderHeader,
      subtitle,
      title,
      titleSx
    ])

    const renderFooterContent = useCallback(() => {
      if (renderFooter) {
        const footer = renderFooter()
        if (footer) {
          // Visual content only — sizes to its own height (not absolutely
          // positioned), so whatever wraps it gets a real, non-zero height.
          const footerContent = (
            <LinearGradientBottomWrapper>
              <View
                onLayout={handleFooterLayout}
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: insets.bottom + 16
                }}>
                {footer}
              </View>
            </LinearGradientBottomWrapper>
          )

          if (shouldAvoidKeyboard) {
            return (
              <KeyboardStickyView
                enabled={!disableStickyFooter}
                offset={{
                  opened: insets.bottom
                }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                {footerContent}
              </KeyboardStickyView>
            )
          }

          return (
            <View
              collapsable={false}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0
              }}>
              {footerContent}
            </View>
          )
        }
      }

      return null
    }, [
      renderFooter,
      insets.bottom,
      handleFooterLayout,
      shouldAvoidKeyboard,
      disableStickyFooter
    ])

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

    const renderHeaderBackground = useCallback(() => {
      if (hideHeaderBackground) return null
      return (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: headerHeight
          }}>
          <BlurViewWithFallback
            style={{
              flex: 1
            }}
          />
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
        </View>
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [headerHeight, hideHeaderBackground])

    // 90% of our screens reuse this component but only some need keyboard avoiding
    // If you have an input on the screen, you need to enable this prop
    if (shouldAvoidKeyboard) {
      // On an Android form sheet, offset the scroll view *below* the header
      // (margin) instead of letting it span the full height and inset its
      // content (padding). When `nestedScrollEnabled` is on for scrollable
      // content, a full-height scroll view claims vertical drags across the
      // whole sheet — including the header strip — so the sheet's own
      // drag-to-dismiss dies there (the strip has nothing to scroll and the
      // scroll view doesn't forward the drag). Keeping the scroll view below
      // the header leaves that strip over a non-scrolling view, so the sheet
      // intercepts drags there and grabber/header swipe-to-dismiss works even
      // while the body scrolls. iOS/non-modal keep the under-header layout so
      // content still scrolls beneath the transparent header. (CP-14679)
      const scrollBelowHeader = Platform.OS === 'android' && Boolean(isModal)
      // Attach the internal composed content-size handler only when its work
      // is needed: `onScrolledToEnd` (scroll-to-end tracking) or
      // `scrollBelowHeader` (the Android modal nested-scroll path, which needs
      // `isScrollable`). Otherwise the caller's callback is passed through
      // directly so keyboard-avoiding screens don't run JS on every
      // content-size change for a no-op. (CP-14679) `onLayout` is always
      // composed: it measures the viewport that drives `minHeight`.
      const pickScrollHandler = <T,>(composed: T, passthrough: T): T =>
        onScrolledToEnd || scrollBelowHeader ? composed : passthrough
      return (
        <View style={{ flex: 1 }} collapsable={false}>
          <KeyboardScrollView
            ref={setScrollViewRef as never}
            testID={testID}
            mode={mode}
            extraKeyboardSpace={disableStickyFooter ? -insets.bottom : 0}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...props}
            // On an Android form sheet, `nestedScrollEnabled` lets this plain
            // RN ScrollView participate in the parent sheet's nested scrolling
            // so a vertical swipe scrolls the content instead of being captured
            // by the sheet's drag-to-dismiss gesture. Enabled only for a modal
            // (`scrollBelowHeader`, no-op otherwise) and only while the content
            // actually overflows — a short modal keeps swipe-to-dismiss. (The
            // gesture-handler ScrollView branch below arbitrates this on its own
            // and doesn't need the prop.) (CP-14679)
            nestedScrollEnabled={scrollBelowHeader && isScrollable}
            // `props.style` is merged last so a caller's style is preserved
            // (it would otherwise be dropped: `{...props}` spreads `style` but
            // this explicit `style` prop replaces it). Defaults come first so
            // `flex: 1` and the Android modal offset still apply unless the
            // caller overrides them, mirroring the `contentContainerStyle`
            // merge below and the non-keyboard branch's wrapper `props.style`.
            style={[
              { flex: 1 },
              scrollBelowHeader ? { marginTop: headerHeight } : null,
              props?.style
            ]}
            contentContainerStyle={[
              props?.contentContainerStyle,
              {
                // `footerLayout` is measured on the padded footer wrapper, so
                // its height already includes the bottom safe area — only add
                // the inset when there's no measured footer.
                paddingBottom:
                  (footerLayout?.height ??
                    (disableStickyFooter ? insets.bottom : 0)) +
                  EXTRA_PADDING_BOTTOM,
                // Offset lives on the scroll view's margin when below the
                // header; otherwise inset the content so it sits under the
                // transparent header.
                paddingTop: scrollBelowHeader ? 0 : headerHeight,
                minHeight
              }
            ]}
            onScroll={onScroll}
            onScrollEndDrag={handleScrollEndDrag}
            onContentSizeChange={pickScrollHandler(
              handleContentSizeChangeComposed,
              onContentSizeChangeProp
            )}
            onLayout={handleScrollViewLayoutComposed}>
            {renderHeaderContent()}
            {children}
          </KeyboardScrollView>

          {renderFooterContent()}
          {renderHeaderBackground()}
          {headerCenterOverlay}
          {renderGrabber()}
        </View>
      )
    }

    // All of our screens have to be scrollable
    // If we don't have an input on the screen then we should not enable keyboard avoiding
    return (
      <View style={[{ flex: 1 }, props.style]} collapsable={false}>
        <ScrollView
          ref={setScrollViewRef}
          testID={testID}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          {...props}
          contentContainerStyle={[
            props?.contentContainerStyle,
            {
              // `footerLayout` is measured on the padded footer wrapper, so
              // its height already includes the bottom safe area — only add
              // the inset when there's no measured footer.
              paddingBottom:
                (footerLayout?.height ?? insets.bottom) + EXTRA_PADDING_BOTTOM,
              paddingTop: headerHeight,
              minHeight
            }
          ]}
          onScroll={onScroll}
          onScrollEndDrag={handleScrollEndDrag}
          onContentSizeChange={
            onScrolledToEnd
              ? handleContentSizeChangeComposed
              : onContentSizeChangeProp
          }
          onLayout={handleScrollViewLayoutComposed}>
          {renderHeaderContent()}
          {children}
        </ScrollView>

        {renderFooterContent()}
        {renderHeaderBackground()}
        {headerCenterOverlay}
        {renderGrabber()}
      </View>
    )
  }
)

ScrollScreen.displayName = 'ScrollScreen'
