import React from 'react'
import { create, act } from 'react-test-renderer'
import { AdvancedSettingsScreen } from './AdvancedSettingsScreen'

jest.mock('@avalabs/k2-alpine', () => {
  const { View: RNView, Text: RNText } = require('react-native')
  return {
    View: RNView,
    Text: RNText,
    useTheme: () => ({
      theme: {
        colors: {
          $surfacePrimary: '#ffffff',
          $textPrimary: '#000000',
          $textSecondary: '#666666'
        }
      }
    })
  }
})

jest.mock('features/swap/hooks/useQuickSwaps', () => ({
  useQuickSwaps: jest.fn()
}))

jest.mock(
  '../components/QuickSwapsToggleRow',
  () => {
    const { View: RNView } = require('react-native')
    return {
      QuickSwapsToggleRow: ({ testID }: { testID?: string }) => (
        <RNView testID={testID} />
      )
    }
  }
)

const { useQuickSwaps } = jest.requireMock('features/swap/hooks/useQuickSwaps')

const queryByTestId = (
  root: ReturnType<typeof create>,
  testID: string
): object | null => {
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

describe('AdvancedSettingsScreen', () => {
  it('renders title and subtitle', () => {
    useQuickSwaps.mockReturnValue({ isAvailable: false })
    let renderer: ReturnType<typeof create>
    act(() => {
      renderer = create(<AdvancedSettingsScreen />)
    })
    const texts = getTextContent(renderer!)
    expect(texts).toContain('Advanced settings')
    expect(texts).toContain('Tools and settings for power users')
  })

  it('hides the Quick Swaps row when isAvailable=false', () => {
    useQuickSwaps.mockReturnValue({ isAvailable: false })
    let renderer: ReturnType<typeof create>
    act(() => {
      renderer = create(<AdvancedSettingsScreen />)
    })
    expect(queryByTestId(renderer!, 'quick-swaps-toggle-row')).toBeNull()
  })

  it('renders the Quick Swaps row when isAvailable=true', () => {
    useQuickSwaps.mockReturnValue({
      isAvailable: true,
      isEnabled: false,
      feeSetting: 'medium',
      maxBuy: 'unlimited'
    })
    let renderer: ReturnType<typeof create>
    act(() => {
      renderer = create(<AdvancedSettingsScreen />)
    })
    expect(queryByTestId(renderer!, 'quick-swaps-toggle-row')).not.toBeNull()
  })
})
