import { renderHook } from '@testing-library/react-hooks'
import { useRecurringEligibility } from './useRecurringEligibility'

jest.mock('../services/InfoChainsService', () => ({
  useInfoChains: () => ({
    data: [
      {
        chainId: 43114,
        recurring: {
          enabled: true,
          minFrequencySeconds: 300,
          supportedTokens: [
            {
              address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
              minimumAmount: '1000000'
            }
          ]
        }
      }
    ]
  })
}))

const usdc = {
  address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
  networkChainId: 43114,
  decimals: 6,
  symbol: 'USDC'
}
const wavax = {
  address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
  networkChainId: 43114,
  decimals: 18,
  symbol: 'WAVAX'
}
const solOnUnsupportedChain = {
  address: '0xdeadbeef',
  networkChainId: 7777,
  decimals: 9,
  symbol: 'SOL'
}
const wavaxOnUnsupportedChain = {
  address: '0xdeadbeefcafe',
  networkChainId: 7777,
  decimals: 18,
  symbol: 'WAVAX'
}

describe('useRecurringEligibility', () => {
  it('returns eligible for a supported same-chain EVM pair', () => {
    const { result } = renderHook(() =>
      useRecurringEligibility(usdc as any, wavax as any, '0xabc')
    )
    expect(result.current.eligible).toBe(true)
    if (result.current.eligible) {
      expect(result.current.minimumAmount).toBe('1000000')
    }
  })

  it('returns ineligible for a cross-chain pair', () => {
    const { result } = renderHook(() =>
      useRecurringEligibility(
        usdc as any,
        { ...wavax, networkChainId: 1 } as any,
        '0xabc'
      )
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'cross-chain'
    })
  })

  it('returns ineligible when source token is not in supportedTokens', () => {
    const { result } = renderHook(() =>
      useRecurringEligibility(wavax as any, usdc as any, '0xabc')
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'unsupported-token'
    })
  })

  it('returns ineligible when source chain is not in info/chains', () => {
    const { result } = renderHook(() =>
      useRecurringEligibility(
        solOnUnsupportedChain as any,
        wavaxOnUnsupportedChain as any,
        '0xabc'
      )
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'unsupported-source-chain'
    })
  })

  it('returns ineligible when address is missing', () => {
    const { result } = renderHook(() =>
      useRecurringEligibility(usdc as any, wavax as any, undefined)
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'no-evm-address'
    })
  })
})
