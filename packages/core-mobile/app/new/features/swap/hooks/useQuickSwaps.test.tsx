import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { advancedReducer } from 'store/settings/advanced/slice'
import { WalletType } from 'services/wallet/types'
import { useQuickSwaps } from './useQuickSwaps'

jest.mock('common/hooks/useActiveWallet', () => ({
  useActiveWallet: jest.fn()
}))
jest.mock('store/network/slice', () => ({
  selectActiveNetwork: jest.fn()
}))

const { useActiveWallet } = jest.requireMock('common/hooks/useActiveWallet')
const { selectActiveNetwork } = jest.requireMock('store/network/slice')

const buildStore = (
  overrides?: Partial<{
    flagOn: boolean
    isEnabled: boolean
    feeSetting: 'low' | 'medium' | 'high'
    maxBuy: 'unlimited' | '1000' | '5000' | '10000' | '50000'
  }>
): ReturnType<typeof configureStore> => {
  const flagOn = overrides?.flagOn ?? true
  return configureStore({
    reducer: {
      settings: (state: any = { advanced: undefined }, action: any) => ({
        ...state,
        advanced: advancedReducer(
          state.advanced ?? {
            developerMode: false,
            isLeftHanded: false,
            quickSwaps: {
              isEnabled: overrides?.isEnabled ?? true,
              feeSetting: overrides?.feeSetting ?? 'medium',
              maxBuy: overrides?.maxBuy ?? 'unlimited'
            }
          },
          action
        )
      }),
      posthog: () => ({
        featureFlags: { 'fusion-quick-swaps': flagOn }
      })
    }
  })
}

const wrap =
  (
    store: ReturnType<typeof buildStore>
  ): React.FC<{ children: React.ReactNode }> =>
  ({ children }) =>
    Provider({ store, children })

beforeEach(() => {
  useActiveWallet.mockReturnValue({ type: WalletType.SEEDLESS })
  selectActiveNetwork.mockReturnValue({ vmName: 'EVM' })
})

describe('useQuickSwaps', () => {
  it('isAvailable=true for seedless + EVM + flag on', () => {
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore())
    })
    expect(result.current.isAvailable).toBe(true)
  })

  it.each([WalletType.LEDGER, WalletType.LEDGER_LIVE, WalletType.KEYSTONE])(
    'isAvailable=false for %s wallet',
    type => {
      useActiveWallet.mockReturnValue({ type })
      const { result } = renderHook(() => useQuickSwaps(), {
        wrapper: wrap(buildStore())
      })
      expect(result.current.isAvailable).toBe(false)
    }
  )

  it('isAvailable=false when posthog flag is off', () => {
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore({ flagOn: false }))
    })
    expect(result.current.isAvailable).toBe(false)
  })

  it('isAvailable=false on a non-EVM active network', () => {
    selectActiveNetwork.mockReturnValue({ vmName: 'BITCOIN' })
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore())
    })
    expect(result.current.isAvailable).toBe(false)
  })

  it('isEnabled reflects redux state', () => {
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore({ isEnabled: false }))
    })
    expect(result.current.isEnabled).toBe(false)
  })
})
