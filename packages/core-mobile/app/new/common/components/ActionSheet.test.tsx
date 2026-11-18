import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'

type ScrollScreenProps = {
  onScrolledToEnd?: (reachedEnd: boolean) => void
  renderFooter: () => React.ReactNode
  disableHeaderSnap?: boolean
  children: React.ReactNode
}

let mockScrollScreenProps: ScrollScreenProps | undefined

jest.mock('@avalabs/k2-alpine', () => {
  const r = require('react') as typeof import('react')
  const passThrough =
    (name: string) =>
    (props: React.PropsWithChildren<Record<string, unknown>>) =>
      r.createElement(name, props, props.children)
  return { View: passThrough('View'), Text: passThrough('Text') }
})
jest.mock('expo-router', () => ({
  useNavigation: () => ({
    setOptions: jest.fn(),
    addListener: () => () => undefined
  })
}))
jest.mock('new/features/approval/components/ActionButtons', () => {
  const r = require('react') as typeof import('react')
  return {
    ActionButtons: (props: Record<string, unknown>) =>
      r.createElement('ActionButtons', props)
  }
})
jest.mock('./ScrollScreen', () => {
  const r = require('react') as typeof import('react')
  return {
    ScrollScreen: (props: ScrollScreenProps) => {
      mockScrollScreenProps = props
      return r.createElement(
        'ScrollScreen',
        null,
        props.children,
        props.renderFooter()
      )
    }
  }
})

import { ActionSheet } from './ActionSheet'

const confirm = { label: 'Approve', onPress: jest.fn() }
const cancel = { label: 'Reject', onPress: jest.fn() }

const renderSheet = async (
  props: Partial<React.ComponentProps<typeof ActionSheet>> = {}
): Promise<ReactTestRenderer> => {
  let instance!: ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <ActionSheet
        onClose={jest.fn()}
        confirm={confirm}
        cancel={cancel}
        {...props}>
        {null}
      </ActionSheet>
    )
  })
  return instance
}

const confirmDisabled = (instance: ReactTestRenderer): boolean | undefined =>
  (
    instance.root.findByType('ActionButtons' as never).props.confirm as {
      disabled?: boolean
    }
  ).disabled

const hints = (instance: ReactTestRenderer): unknown[] =>
  instance.root.findAll(
    node =>
      node.props.testID === 'scroll_to_confirm_hint' &&
      typeof node.type === 'string'
  )

const reachEnd = async (reached: boolean): Promise<void> => {
  await act(async () => {
    mockScrollScreenProps?.onScrolledToEnd?.(reached)
  })
}

describe('<ActionSheet /> requireScrollToConfirm', () => {
  beforeEach(() => {
    mockScrollScreenProps = undefined
  })

  it('disables confirm and shows a hint until the content is scrolled to the end', async () => {
    const instance = await renderSheet({ requireScrollToConfirm: true })

    expect(confirmDisabled(instance)).toBe(true)
    expect(hints(instance)).toHaveLength(1)
    expect(mockScrollScreenProps?.disableHeaderSnap).toBe(true)

    await reachEnd(true)
    expect(confirmDisabled(instance)).toBeFalsy()
    expect(hints(instance)).toHaveLength(0)

    await reachEnd(false)
    expect(confirmDisabled(instance)).toBe(true)
  })

  it('keeps confirm disabled after scrolling when the caller disables it', async () => {
    const instance = await renderSheet({
      requireScrollToConfirm: true,
      confirm: { ...confirm, disabled: true }
    })

    await reachEnd(true)

    expect(confirmDisabled(instance)).toBe(true)
  })

  it('does not gate confirm or track scrolling when not required', async () => {
    const instance = await renderSheet()

    expect(confirmDisabled(instance)).toBeFalsy()
    expect(hints(instance)).toHaveLength(0)
    expect(mockScrollScreenProps?.onScrolledToEnd).toBeUndefined()
  })

  it('falls back to the gated buttons when the footer override renders nothing (idle Ledger)', async () => {
    const instance = await renderSheet({
      requireScrollToConfirm: true,
      renderFooterOverride: () => null
    })

    expect(confirmDisabled(instance)).toBe(true)
  })
})
