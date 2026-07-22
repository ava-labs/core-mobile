import { Network } from '@avalabs/core-chains-sdk'
import {
  HYPERCORE_CHAIN_ID,
  HYPEREVM_CHAIN_ID,
  isHyperliquidChainId,
  isHyperliquidNetwork
} from './isHyperliquidNetwork'

describe('isHyperliquidChainId', () => {
  it('returns true for the HyperEVM chain id', () => {
    expect(isHyperliquidChainId(HYPEREVM_CHAIN_ID)).toBe(true)
    expect(isHyperliquidChainId(999)).toBe(true)
  })

  it('returns true for the synthetic HyperCore chain id', () => {
    expect(isHyperliquidChainId(HYPERCORE_CHAIN_ID)).toBe(true)
    expect(isHyperliquidChainId(9999)).toBe(true)
  })

  it('returns false for other chain ids', () => {
    expect(isHyperliquidChainId(1)).toBe(false)
    expect(isHyperliquidChainId(43114)).toBe(false)
  })
})

describe('isHyperliquidNetwork', () => {
  it('matches by chain id', () => {
    expect(isHyperliquidNetwork({ chainId: 999 } as Network)).toBe(true)
    expect(isHyperliquidNetwork({ chainId: 9999 } as Network)).toBe(true)
  })

  it('matches by chain name', () => {
    expect(
      isHyperliquidNetwork({ chainId: 1234, chainName: 'HyperEVM' } as Network)
    ).toBe(true)
    expect(
      isHyperliquidNetwork({ chainId: 1234, chainName: 'HyperCore' } as Network)
    ).toBe(true)
  })

  it('matches chain name case-insensitively and ignores surrounding whitespace', () => {
    expect(
      isHyperliquidNetwork({ chainId: 1234, chainName: 'hyperevm' } as Network)
    ).toBe(true)
    expect(
      isHyperliquidNetwork({
        chainId: 1234,
        chainName: ' HYPERCORE '
      } as Network)
    ).toBe(true)
  })

  it('returns false for other networks', () => {
    expect(
      isHyperliquidNetwork({ chainId: 1, chainName: 'Ethereum' } as Network)
    ).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isHyperliquidNetwork(undefined)).toBe(false)
  })
})
