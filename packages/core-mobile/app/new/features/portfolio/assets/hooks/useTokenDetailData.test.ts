/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react-hooks'
import { ChainId } from '@avalabs/core-chains-sdk'
import { AVAX_P_ID, AVAX_X_ID } from 'services/balance/const'
import { caip2ChainIds } from 'consts/caip2ChainIds'
import { tokenIds } from 'consts/tokenIds'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import type { LocalTokenWithBalance } from 'store/balance'
import { useTokenDetailData } from './useTokenDetailData'

// Mutable flags/state the mocked selectors + hooks read from.
const state = {
  isFusionEnabled: true,
  isCctEnabled: true,
  hasXpAddresses: true
}

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector()
}))

jest.mock('store/posthog', () => ({
  selectIsFusionEnabled: () => state.isFusionEnabled,
  selectIsFusionAvalancheCctEnabled: () => state.isCctEnabled,
  selectIsMeldOfframpBlocked: () => false,
  selectIsPriceChartBlocked: () => false
}))
jest.mock('store/account/slice', () => ({
  selectActiveAccount: () => ({ id: 'acc-1', index: 0 })
}))
jest.mock('store/settings/currency', () => ({
  selectSelectedCurrency: () => 'USD'
}))
jest.mock('store/settings/securityPrivacy', () => ({
  selectIsPrivacyModeEnabled: () => false
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => false
}))

const mockNavigateToSwap = jest.fn()

jest.mock('common/hooks/useInAppBrowser', () => () => ({ openUrl: jest.fn() }))
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: jest.fn() }) }))
jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => ({
    getNetwork: (chainId: number) => ({ caip2ChainId: `caip2:${chainId}` })
  })
}))
jest.mock('features/swap/hooks/useNavigateToSwap', () => ({
  useNavigateToSwap: () => ({ navigateToSwap: mockNavigateToSwap })
}))
jest.mock('features/stake/hooks/useAddStake', () => ({
  useAddStake: () => ({ addStake: jest.fn(), canAddStake: false })
}))
jest.mock('features/meld/hooks/useBuy', () => ({
  useBuy: () => ({ navigateToBuy: jest.fn(), isBuyable: () => false })
}))
jest.mock('features/meld/hooks/useWithdraw', () => ({
  useWithdraw: () => ({
    navigateToWithdraw: jest.fn(),
    isWithdrawable: () => false
  })
}))
jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))
jest.mock('common/hooks/useHasXpAddresses', () => ({
  useHasXpAddresses: () => state.hasXpAddresses
}))
jest.mock('features/send/store', () => ({
  useSendSelectedToken: () => [undefined, jest.fn()]
}))
jest.mock('common/hooks/useMarketToken', () => ({
  useMarketToken: () => undefined
}))
jest.mock('features/portfolio/hooks/useIsBalanceAccurateByNetwork', () => ({
  useIsBalanceAccurateByNetwork: () => true
}))
jest.mock('features/portfolio/hooks/useIsLoadingBalancesForAccount', () => ({
  useIsLoadingBalancesForAccount: () => false
}))
jest.mock('features/portfolio/hooks/useAccountBalances', () => ({
  useAccountBalances: () => ({ refetch: jest.fn(), isRefetching: false })
}))
jest.mock('./useTokenActivity', () => ({
  useTokenActivity: () => ({ refresh: jest.fn(), isRefreshing: false })
}))
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() })
}))

const makeToken = (
  networkChainId: number,
  localId: string
): LocalTokenWithBalance =>
  ({
    networkChainId,
    localId,
    internalId: localId,
    symbol: 'AVAX',
    balanceInCurrency: 0
  } as any)

const swapButton = (token: LocalTokenWithBalance): any => {
  const { result } = renderHook(() => useTokenDetailData(token))
  return result.current.actionButtons.find(
    b => b.title === ActionButtonTitle.Swap
  )
}

describe('useTokenDetailData — Swap button on X/P AVAX (CP-14516)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    state.isFusionEnabled = true
    state.isCctEnabled = true
    state.hasXpAddresses = true
  })

  it('shows Swap for P-Chain AVAX when CCT is enabled + has XP addresses', () => {
    expect(swapButton(makeToken(ChainId.AVALANCHE_P, AVAX_P_ID))).toBeDefined()
  })

  it('shows Swap for X-Chain AVAX when CCT is enabled + has XP addresses', () => {
    expect(swapButton(makeToken(ChainId.AVALANCHE_X, AVAX_X_ID))).toBeDefined()
  })

  it('defaults the destination to C-Chain AVAX for a P/X source', () => {
    swapButton(makeToken(ChainId.AVALANCHE_P, AVAX_P_ID))?.onPress?.()
    expect(mockNavigateToSwap).toHaveBeenCalledWith(
      expect.objectContaining({
        fromCaip2Id: `caip2:${ChainId.AVALANCHE_P}`,
        toCaip2Id: caip2ChainIds.C_CHAIN,
        toTokenId: tokenIds.AVAX
      })
    )
  })

  it('hides Swap on P-Chain AVAX when CCT is disabled', () => {
    state.isCctEnabled = false
    expect(
      swapButton(makeToken(ChainId.AVALANCHE_P, AVAX_P_ID))
    ).toBeUndefined()
  })

  it('hides Swap when the wallet has no XP addresses', () => {
    state.hasXpAddresses = false
    expect(
      swapButton(makeToken(ChainId.AVALANCHE_P, AVAX_P_ID))
    ).toBeUndefined()
  })

  it('hides Swap for a non-AVAX X-Chain asset (ANT)', () => {
    expect(
      swapButton(makeToken(ChainId.AVALANCHE_X, 'some-ant-asset-id'))
    ).toBeUndefined()
  })

  it('keeps Swap on C-Chain AVAX with same-chain destination', () => {
    const button = swapButton(
      makeToken(ChainId.AVALANCHE_MAINNET_ID, 'NATIVE-AVAX')
    )
    expect(button).toBeDefined()
    button?.onPress?.()
    expect(mockNavigateToSwap).toHaveBeenCalledWith(
      expect.objectContaining({
        fromCaip2Id: `caip2:${ChainId.AVALANCHE_MAINNET_ID}`,
        toCaip2Id: `caip2:${ChainId.AVALANCHE_MAINNET_ID}`,
        toTokenId: undefined
      })
    )
  })
})
