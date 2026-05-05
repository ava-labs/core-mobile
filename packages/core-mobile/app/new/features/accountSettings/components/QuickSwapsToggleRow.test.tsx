import React from 'react'
import { create, act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { advancedReducer } from 'store/settings/advanced/slice'
import { currencyReducer } from 'store/settings/currency/slice'
import type { QuickSwapFeeLevel, QuickSwapMaxBuy } from 'store/settings/advanced/types'
import { QuickSwapsToggleRow } from './QuickSwapsToggleRow'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate })
}))

jest.mock('@avalabs/k2-alpine', () => {
  const { View: RNView, Text: RNText, Switch } = require('react-native')
  return {
    View: RNView,
    Text: RNText,
    Toggle: ({
      testID,
      value,
      onValueChange
    }: {
      testID?: string
      value: boolean
      onValueChange?: (v: boolean) => void
    }) => <Switch testID={testID} value={value} onValueChange={onValueChange} />,
    useTheme: () => ({
      theme: {
        isDark: false,
        colors: {
          $surfacePrimary: '#ffffff',
          $surfaceSecondary: '#f5f5f6',
          $textPrimary: '#28282e',
          $textSecondary: '#28282e99'
        }
      }
    })
  }
})

const buildStore = (
  isEnabled = false,
  feeSetting: QuickSwapFeeLevel = 'medium',
  maxBuy: QuickSwapMaxBuy = 'unlimited'
) =>
  configureStore({
    reducer: {
      settings: (state: Record<string, unknown> = {}, action) => ({
        ...state,
        advanced: advancedReducer(
          (state.advanced as Parameters<typeof advancedReducer>[0]) ?? {
            developerMode: false,
            isLeftHanded: false,
            quickSwaps: { isEnabled, feeSetting, maxBuy }
          },
          action as Parameters<typeof advancedReducer>[1]
        ),
        currency: currencyReducer(
          (state.currency as Parameters<typeof currencyReducer>[0]) ??
            undefined,
          action as Parameters<typeof currencyReducer>[1]
        )
      })
    }
  })

const renderRow = (store: ReturnType<typeof buildStore>) => {
  let renderer: ReturnType<typeof create>
  act(() => {
    renderer = create(
      <Provider store={store}>
        <QuickSwapsToggleRow />
      </Provider>
    )
  })
  return renderer!
}

// --- helpers ---

const queryByTestId = (
  root: ReturnType<typeof create>,
  testID: string
): ReturnType<typeof root.root.findAll>[number] | null => {
  const results = root.root.findAll(node => node.props.testID === testID)
  return results.length > 0 ? results[0] ?? null : null
}

const getTextContent = (root: ReturnType<typeof create>): string[] => {
  const texts: string[] = []
  root.root.findAll(node => {
    if (Array.isArray(node.children)) {
      node.children.forEach(child => {
        if (typeof child === 'string') {
          texts.push(child)
        }
      })
    }
    return false
  })
  return texts
}

type RTRNode = ReturnType<typeof create.prototype.root.findAll>[number]

const firePress = (node: RTRNode): void => {
  act(() => {
    node.props.onPress?.()
  })
}

const fireValueChange = (node: RTRNode, value: unknown): void => {
  act(() => {
    node.props.onValueChange?.(value)
  })
}

// ---

beforeEach(() => mockNavigate.mockClear())

describe('QuickSwapsToggleRow', () => {
  it('renders the title and subtitle', () => {
    const store = buildStore()
    const renderer = renderRow(store)
    const texts = getTextContent(renderer)
    expect(texts).toContain('Quick swaps')
    expect(
      texts.some(t => t.includes('Swap tokens inside of Core with one-click'))
    ).toBe(true)
  })

  it('hides fee picker and amount-limit row when isEnabled=false', () => {
    const store = buildStore(false)
    const renderer = renderRow(store)
    expect(queryByTestId(renderer, 'quick-swaps-fee-picker')).toBeNull()
    expect(queryByTestId(renderer, 'quick-swaps-amount-limit-row')).toBeNull()
  })

  it('reveals fee picker and amount-limit row when isEnabled=true', () => {
    const store = buildStore(true)
    const renderer = renderRow(store)
    expect(queryByTestId(renderer, 'quick-swaps-fee-picker')).not.toBeNull()
    expect(queryByTestId(renderer, 'quick-swaps-amount-limit-row')).not.toBeNull()
  })

  it('toggles state when the switch is pressed', () => {
    const store = buildStore(false)
    const renderer = renderRow(store)
    const toggleNode = queryByTestId(renderer, 'quick-swaps-toggle-switch')
    expect(toggleNode).not.toBeNull()
    fireValueChange(toggleNode!, true)
    expect(
      (store.getState() as ReturnType<typeof store.getState>).settings.advanced
        .quickSwaps.isEnabled
    ).toBe(true)
  })

  it('updates feeSetting when a tier button is tapped', () => {
    const store = buildStore(true, 'medium')
    const renderer = renderRow(store)
    // Find all pressables and pick the one containing text "Fast"
    const allPressables = renderer.root.findAll(
      node => typeof node.props.onPress === 'function'
    )
    const fastPressable = allPressables.find(node => {
      try {
        const textNodes = node.findAll(
          (n: RTRNode) =>
            typeof n.props.children === 'string' && n.props.children === 'Fast'
        )
        return textNodes.length > 0
      } catch {
        return false
      }
    })
    expect(fastPressable).toBeDefined()
    firePress(fastPressable!)
    expect(
      (store.getState() as ReturnType<typeof store.getState>).settings.advanced
        .quickSwaps.feeSetting
    ).toBe('high')
  })

  it('navigates to /accountSettings/swapAmountLimit on row tap', () => {
    const store = buildStore(true)
    const renderer = renderRow(store)
    const amountLimitRow = queryByTestId(renderer, 'quick-swaps-amount-limit-row')
    expect(amountLimitRow).not.toBeNull()
    firePress(amountLimitRow!)
    expect(mockNavigate).toHaveBeenCalledWith('/accountSettings/swapAmountLimit')
  })
})
