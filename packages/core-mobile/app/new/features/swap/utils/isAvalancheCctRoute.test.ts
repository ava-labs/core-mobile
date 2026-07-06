import { TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import {
  isAvalancheCctRoute,
  isCctOnlySource,
  isNativeAvaxToken
} from './isAvalancheCctRoute'

const makeToken = (
  overrides: Partial<LocalTokenWithBalance> = {}
): LocalTokenWithBalance =>
  ({
    type: TokenType.NATIVE,
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    networkChainId: ChainId.AVALANCHE_MAINNET_ID,
    balance: 0n,
    ...overrides
  } as LocalTokenWithBalance)

describe('isNativeAvaxToken', () => {
  it('accepts native AVAX on C-Chain', () => {
    expect(isNativeAvaxToken(makeToken())).toBe(true)
  })

  it('accepts native AVAX on P-Chain', () => {
    expect(
      isNativeAvaxToken(makeToken({ networkChainId: ChainId.AVALANCHE_P }))
    ).toBe(true)
  })

  it('accepts native AVAX on X-Chain', () => {
    expect(
      isNativeAvaxToken(makeToken({ networkChainId: ChainId.AVALANCHE_X }))
    ).toBe(true)
  })

  it('accepts native AVAX on Fuji', () => {
    expect(
      isNativeAvaxToken(
        makeToken({ networkChainId: ChainId.AVALANCHE_TESTNET_ID })
      )
    ).toBe(true)
  })

  it('rejects non-native tokens even if symbol is AVAX', () => {
    expect(isNativeAvaxToken(makeToken({ type: TokenType.ERC20 }))).toBe(false)
  })

  it('rejects native non-AVAX tokens (e.g. native ETH)', () => {
    expect(isNativeAvaxToken(makeToken({ symbol: 'ETH' }))).toBe(false)
  })

  it('rejects native AVAX on non-primary-network chains', () => {
    expect(
      isNativeAvaxToken(makeToken({ networkChainId: 1 /* Ethereum */ }))
    ).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isNativeAvaxToken(undefined)).toBe(false)
  })
})

describe('isCctOnlySource', () => {
  it('accepts native AVAX on X-Chain', () => {
    expect(
      isCctOnlySource(makeToken({ networkChainId: ChainId.AVALANCHE_X }))
    ).toBe(true)
  })

  it('accepts native AVAX on P-Chain', () => {
    expect(
      isCctOnlySource(makeToken({ networkChainId: ChainId.AVALANCHE_P }))
    ).toBe(true)
  })

  it('accepts native AVAX on X/P Fuji chains', () => {
    expect(
      isCctOnlySource(makeToken({ networkChainId: ChainId.AVALANCHE_TEST_X }))
    ).toBe(true)
    expect(
      isCctOnlySource(makeToken({ networkChainId: ChainId.AVALANCHE_TEST_P }))
    ).toBe(true)
  })

  it('rejects native AVAX on C-Chain (C-chain can swap to ERC-20s like USDC)', () => {
    expect(
      isCctOnlySource(
        makeToken({ networkChainId: ChainId.AVALANCHE_MAINNET_ID })
      )
    ).toBe(false)
  })

  it('rejects non-native tokens on X/P chains', () => {
    expect(
      isCctOnlySource(
        makeToken({
          type: TokenType.ERC20,
          networkChainId: ChainId.AVALANCHE_X
        })
      )
    ).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isCctOnlySource(undefined)).toBe(false)
  })
})

describe('isAvalancheCctRoute', () => {
  it('is true for C→P', () => {
    const fromToken = makeToken({
      networkChainId: ChainId.AVALANCHE_MAINNET_ID
    })
    const toToken = makeToken({ networkChainId: ChainId.AVALANCHE_P })
    expect(isAvalancheCctRoute({ fromToken, toToken })).toBe(true)
  })

  it('is true for X→C on Fuji', () => {
    const fromToken = makeToken({ networkChainId: ChainId.AVALANCHE_TEST_X })
    const toToken = makeToken({ networkChainId: ChainId.AVALANCHE_TESTNET_ID })
    expect(isAvalancheCctRoute({ fromToken, toToken })).toBe(true)
  })

  it('is false when source and destination chain are the same', () => {
    const fromToken = makeToken({
      networkChainId: ChainId.AVALANCHE_MAINNET_ID
    })
    const toToken = makeToken({ networkChainId: ChainId.AVALANCHE_MAINNET_ID })
    expect(isAvalancheCctRoute({ fromToken, toToken })).toBe(false)
  })

  it('is false when destination is not AVAX', () => {
    const fromToken = makeToken({
      networkChainId: ChainId.AVALANCHE_MAINNET_ID
    })
    const toToken = makeToken({ symbol: 'USDC', type: TokenType.ERC20 })
    expect(isAvalancheCctRoute({ fromToken, toToken })).toBe(false)
  })

  it('is false when either side is missing', () => {
    expect(
      isAvalancheCctRoute({ fromToken: undefined, toToken: makeToken() })
    ).toBe(false)
    expect(
      isAvalancheCctRoute({ fromToken: makeToken(), toToken: undefined })
    ).toBe(false)
  })
})
