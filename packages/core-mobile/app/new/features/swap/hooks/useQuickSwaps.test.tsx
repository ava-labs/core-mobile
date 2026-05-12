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

const { useActiveWallet } = jest.requireMock('common/hooks/useActiveWallet')

const buildStore = (
  overrides?: Partial<{
    flagOn: boolean
    isEnabled: boolean
    feeSetting: 'low' | 'medium' | 'high'
    maxBuy: 'unlimited' | '1000' | '5000' | '10000' | '50000'
    walletType: WalletType
  }>
): ReturnType<typeof configureStore> => {
  const flagOn = overrides?.flagOn ?? true
  const walletType = overrides?.walletType ?? WalletType.SEEDLESS
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
        // `selectIsQuickSwapsAvailable` requires the per-feature flag
        // AND the master `everything` kill-switch. Test mock keeps both
        // on by default; pass `flagOn: false` to flip the per-feature
        // gate off.
        featureFlags: {
          'fusion-quick-swaps': flagOn,
          everything: true
        }
      }),
      // Minimal wallet slice shape so selectActiveWallet finds an entry.
      wallet: () => ({
        activeWalletId: 'wallet-1',
        wallets: { 'wallet-1': { id: 'wallet-1', type: walletType } }
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
})

describe('useQuickSwaps', () => {
  it('isAvailable=true for software wallet + flag on', () => {
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore())
    })
    expect(result.current.isAvailable).toBe(true)
  })

  it('isAvailable=false on hardware wallets (one negative case is enough — the allowlist itself is tested in shared.test.ts)', () => {
    useActiveWallet.mockReturnValue({ type: WalletType.LEDGER })
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore({ walletType: WalletType.LEDGER }))
    })
    expect(result.current.isAvailable).toBe(false)
  })

  it('isAvailable=false when posthog flag is off', () => {
    const { result } = renderHook(() => useQuickSwaps(), {
      wrapper: wrap(buildStore({ flagOn: false }))
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
