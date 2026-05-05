import React from 'react'
import { create, act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { advancedReducer } from 'store/settings/advanced/slice'
import type { QuickSwapMaxBuy } from 'store/settings/advanced/types'
import { SwapAmountLimitScreen } from './SwapAmountLimitScreen'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

jest.mock('store/settings/currency', () => ({
  selectSelectedCurrency: () => 'USD'
}))

jest.mock('@avalabs/k2-alpine', () => {
  const { View: RNView, Text: RNText } = require('react-native')
  return {
    View: RNView,
    Text: RNText,
    useTheme: () => ({
      theme: {
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

const buildStore = (maxBuy: QuickSwapMaxBuy = 'unlimited') =>
  configureStore({
    reducer: {
      settings: (state: Record<string, unknown> = {}, action) => ({
        ...state,
        advanced: advancedReducer(
          (state.advanced as Parameters<typeof advancedReducer>[0]) ?? {
            developerMode: false,
            isLeftHanded: false,
            quickSwaps: {
              isEnabled: true,
              feeSetting: 'medium',
              maxBuy
            }
          },
          action as Parameters<typeof advancedReducer>[1]
        )
      })
    }
  })

const renderScreen = (store: ReturnType<typeof buildStore>) => {
  let renderer: ReturnType<typeof create>
  act(() => {
    renderer = create(
      <Provider store={store}>
        <SwapAmountLimitScreen />
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

// ---

beforeEach(() => mockBack.mockClear())

describe('SwapAmountLimitScreen', () => {
  it('renders all five options', () => {
    const store = buildStore()
    const renderer = renderScreen(store)
    const texts = getTextContent(renderer)
    ;['Unlimited', '1,000', '5,000', '10,000', '50,000'].forEach(label =>
      expect(texts).toContain(label)
    )
  })

  it('marks the current selection', () => {
    const store = buildStore('5000')
    const renderer = renderScreen(store)
    expect(queryByTestId(renderer, 'amount-limit-row-5000-selected')).not.toBeNull()
  })

  it('dispatches and pops on tap', () => {
    const store = buildStore('unlimited')
    const renderer = renderScreen(store)
    // Find the pressable for '10000' (unselected, no -selected suffix)
    const row = queryByTestId(renderer, 'amount-limit-row-10000')
    expect(row).not.toBeNull()
    firePress(row!)
    expect(
      (store.getState() as ReturnType<typeof store.getState>).settings.advanced
        .quickSwaps.maxBuy
    ).toBe('10000')
    expect(mockBack).toHaveBeenCalled()
  })
})
