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

jest.mock('react-native-gesture-handler', () => {
  const rn = require('react-native') as typeof import('react-native')
  return { ScrollView: rn.ScrollView }
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
