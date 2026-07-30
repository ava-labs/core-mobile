import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'

jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    BlurViewWithFallback: () => null,
    NavigationTitleHeader: () => null,
    Separator: () => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: ({ children, sx: _sx, variant: _v, ...rest }: any) =>
      r.createElement(rn.Text, rest, children)
  }
})

jest.mock('common/hooks/useEffectiveHeaderHeight', () => ({
  useEffectiveHeaderHeight: () => 100
}))

jest.mock('common/hooks/useFadingHeaderNavigation', () => ({
  useFadingHeaderNavigation: () => ({
    onScroll: jest.fn(),
    scrollY: { value: 0 },
    targetHiddenProgress: { value: 0 }
  })
}))

jest.mock('react-native-keyboard-controller', () => {
  const rn = require('react-native') as typeof import('react-native')
  return {
    KeyboardAwareScrollView: rn.ScrollView,
    KeyboardStickyView: rn.View
  }
})

// The global reanimated mock's `useSharedValue` returns a NEW object on every
// render (no useRef), so values written from `onLayout` are wiped by the next
// state-driven re-render — unlike real shared values, which are render-stable.
// Override it with a stable version so the snap tests can observe writes.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual(
    'react-native-reanimated'
  ) as typeof import('react-native-reanimated')
  const r = require('react') as typeof import('react')
  return {
    ...actual,
    useSharedValue: <T,>(init: T) => r.useRef({ value: init }).current
  }
})

const mockScrollTo = jest.fn()

jest.mock('react-native-gesture-handler', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  // Wraps the RN ScrollView and exposes a spyable `scrollTo` through the ref
  // so the header-snap tests can assert on the scroll commands it issues.
  const MockScrollView = r.forwardRef((props, ref) => {
    r.useImperativeHandle(ref, () => ({ scrollTo: mockScrollTo }))
    return r.createElement(rn.ScrollView, props)
  })
  return { ScrollView: MockScrollView }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 852 })
}))

jest.mock('./Grabber', () => ({ __esModule: true, default: () => null }))

jest.mock('./LinearGradientBottomWrapper', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LinearGradientBottomWrapper: ({ children }: any) => children
}))

import { View } from 'react-native'
import { ScrollScreen } from './ScrollScreen'

const MEASURED_VIEWPORT_HEIGHT = 640
const MEASURED_TITLE_REGION_HEIGHT = 80
const MEASURED_TITLE_HEIGHT = 40

const render = async (
  props: Partial<React.ComponentProps<typeof ScrollScreen>> = {}
): Promise<ReactTestRenderer> => {
  let instance!: ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <ScrollScreen title="Test title" {...props}>
        {null}
      </ScrollScreen>
    )
  })
  return instance
}

const layoutEvent = (height: number): unknown => ({
  nativeEvent: { layout: { x: 0, y: 0, width: 390, height } }
})

const fireScrollViewLayout = async (
  instance: ReactTestRenderer,
  height: number
): Promise<void> => {
  const scrollView = instance.root.findByType(ScrollView)
  await act(async () => {
    scrollView.props.onLayout(layoutEvent(height))
  })
}

const getContentContainerMinHeight = (
  instance: ReactTestRenderer
): number | undefined => {
  const scrollView = instance.root.findByType(ScrollView)
  return StyleSheet.flatten(scrollView.props.contentContainerStyle)?.minHeight
}

// The collapsible header region (title + subtitle block) is the first plain
// View inside the scroll view carrying both `collapsable={false}` and an
// `onLayout` (see `renderHeaderContent`).
const fireHeaderRegionLayout = async (
  instance: ReactTestRenderer,
  height: number
): Promise<void> => {
  const headerRegion = instance.root.findAll(
    node =>
      node.type === View &&
      node.props.collapsable === false &&
      node.props.onLayout !== undefined
  )[0]
  if (!headerRegion) throw new Error('header region not found')
  await act(async () => {
    headerRegion.props.onLayout(layoutEvent(height))
  })
}

// The title's Animated.View is the first measured descendant inside the
// header region wrapper (the wrapper itself carries `collapsable={false}`).
const fireTitleLayout = async (
  instance: ReactTestRenderer,
  height: number
): Promise<void> => {
  const headerRegion = instance.root.findAll(
    node =>
      node.type === View &&
      node.props.collapsable === false &&
      node.props.onLayout !== undefined
  )[0]
  // Filter by handler identity: the wrapper's own host element carries the
  // same `onLayout` as the composite we already have.
  const titleView = headerRegion
    ?.findAll(node => node.props?.onLayout !== undefined)
    .find(node => node.props.onLayout !== headerRegion.props.onLayout)
  if (!titleView) throw new Error('title view not found')
  await act(async () => {
    titleView.props.onLayout(layoutEvent(height))
  })
}

const releaseDragAt = async (
  instance: ReactTestRenderer,
  y: number
): Promise<void> => {
  const scrollView = instance.root.findByType(ScrollView)
  await act(async () => {
    scrollView.props.onScrollEndDrag({ nativeEvent: { contentOffset: { y } } })
  })
}

describe('ScrollScreen header snap on release', () => {
  const setupSnappable = async (
    props: Partial<React.ComponentProps<typeof ScrollScreen>> = {}
  ): Promise<ReactTestRenderer> => {
    const instance = await render(props)
    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)
    await fireHeaderRegionLayout(instance, MEASURED_TITLE_REGION_HEIGHT)
    await fireTitleLayout(instance, MEASURED_TITLE_HEIGHT)
    return instance
  }

  it('bounces back to expanded when released at or below the title threshold', async () => {
    const instance = await setupSnappable()

    await releaseDragAt(instance, MEASURED_TITLE_HEIGHT - 20)

    expect(mockScrollTo).toHaveBeenCalledWith({ y: 0, animated: true })
  })

  it('commits to fully collapsed when released past the title', async () => {
    const instance = await setupSnappable()

    await releaseDragAt(instance, MEASURED_TITLE_HEIGHT + 10)

    expect(mockScrollTo).toHaveBeenCalledWith({
      y: MEASURED_TITLE_REGION_HEIGHT,
      animated: true
    })
  })

  it('does not snap at rest or when released past the header region', async () => {
    const instance = await setupSnappable()

    await releaseDragAt(instance, 0)
    await releaseDragAt(instance, MEASURED_TITLE_REGION_HEIGHT)
    await releaseDragAt(instance, MEASURED_TITLE_REGION_HEIGHT + 100)

    expect(mockScrollTo).not.toHaveBeenCalled()
  })

  it('does not snap when there is no title or subtitle', async () => {
    const instance = await render({ title: undefined })
    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)
    await fireHeaderRegionLayout(instance, MEASURED_TITLE_REGION_HEIGHT)

    await releaseDragAt(instance, 20)

    expect(mockScrollTo).not.toHaveBeenCalled()
  })

  it('does not snap when disableHeaderSnap is set', async () => {
    const instance = await setupSnappable({ disableHeaderSnap: true })

    await releaseDragAt(instance, MEASURED_TITLE_HEIGHT - 20)
    await releaseDragAt(instance, MEASURED_TITLE_HEIGHT + 10)

    expect(mockScrollTo).not.toHaveBeenCalled()
  })

  it('still forwards the event to a caller-provided onScrollEndDrag when disableHeaderSnap is set', async () => {
    const onScrollEndDrag = jest.fn()
    const instance = await setupSnappable({
      disableHeaderSnap: true,
      onScrollEndDrag
    })

    await releaseDragAt(instance, 20)

    expect(onScrollEndDrag).toHaveBeenCalledTimes(1)
  })

  it('forwards the event to a caller-provided onScrollEndDrag', async () => {
    const onScrollEndDrag = jest.fn()
    const instance = await setupSnappable({ onScrollEndDrag })

    await releaseDragAt(instance, 20)

    expect(onScrollEndDrag).toHaveBeenCalledTimes(1)
    expect(onScrollEndDrag.mock.calls[0][0].nativeEvent.contentOffset.y).toBe(
      20
    )
  })
})

describe('ScrollScreen content minHeight', () => {
  it('uses the scroll view measured height on the non-keyboard branch', async () => {
    const instance = await render()

    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)

    expect(getContentContainerMinHeight(instance)).toBe(
      MEASURED_VIEWPORT_HEIGHT
    )
  })

  it('uses the scroll view measured height on the keyboard-aware branch', async () => {
    const instance = await render({ shouldAvoidKeyboard: true })

    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)

    expect(getContentContainerMinHeight(instance)).toBe(
      MEASURED_VIEWPORT_HEIGHT
    )
  })

  it('adds the measured title region so the release snap can fully collapse the header', async () => {
    const instance = await render()

    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)
    await fireHeaderRegionLayout(instance, MEASURED_TITLE_REGION_HEIGHT)

    expect(getContentContainerMinHeight(instance)).toBe(
      MEASURED_VIEWPORT_HEIGHT + MEASURED_TITLE_REGION_HEIGHT
    )
  })

  it('does not add snap room when there is no title or subtitle', async () => {
    const instance = await render({ title: undefined })

    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)
    // The no-title phantom header still measures a layout; it must not add
    // snap room since the release snap is disabled without a title.
    await fireHeaderRegionLayout(instance, MEASURED_TITLE_REGION_HEIGHT)

    expect(getContentContainerMinHeight(instance)).toBe(
      MEASURED_VIEWPORT_HEIGHT
    )
  })

  it('does not add snap room when disableHeaderSnap is set', async () => {
    const instance = await render({ disableHeaderSnap: true })

    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)
    await fireHeaderRegionLayout(instance, MEASURED_TITLE_REGION_HEIGHT)

    expect(getContentContainerMinHeight(instance)).toBe(
      MEASURED_VIEWPORT_HEIGHT
    )
  })

  it('applies no minHeight before the viewport has been measured', async () => {
    const instance = await render()

    expect(getContentContainerMinHeight(instance)).toBeUndefined()
  })

  it('still forwards layout events to a caller-provided onLayout', async () => {
    const onLayout = jest.fn()
    const instance = await render({ onLayout })

    await fireScrollViewLayout(instance, MEASURED_VIEWPORT_HEIGHT)

    expect(onLayout).toHaveBeenCalledTimes(1)
  })
})
