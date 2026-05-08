import { Avalanche } from '@avalabs/core-wallets-sdk'
import { RpcMethod, RpcRequest } from '@avalabs/vm-module-types'
import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { RequestContext } from 'store/rpc/types'
import {
  isOptimisticConfirmationEnabled,
  __resetOptimisticGateCacheForTests
} from './isOptimisticConfirmationEnabled'

const mockGetUpgradesInfo = jest.fn()
const mockGetInfo = jest.fn(() => ({ getUpgradesInfo: mockGetUpgradesInfo }))
const mockMainnetProvider = { getInfo: mockGetInfo }
const mockFujiProvider = { getInfo: mockGetInfo }

jest.mock('@avalabs/core-wallets-sdk', () => ({
  Avalanche: {
    JsonRpcProvider: {
      getDefaultMainnetProvider: jest.fn(),
      getDefaultFujiProvider: jest.fn()
    }
  }
}))

const mockGetMainnetProvider = Avalanche.JsonRpcProvider
  .getDefaultMainnetProvider as jest.Mock
const mockGetFujiProvider = Avalanche.JsonRpcProvider
  .getDefaultFujiProvider as jest.Mock

const makeRequest = (
  chainId: string,
  context: Record<string, unknown> = {}
): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: 'session-1',
    method: RpcMethod.ETH_SEND_TRANSACTION,
    chainId,
    params: {},
    dappInfo: { name: 'Test', url: 'https://test.com', icon: '' },
    context
  } as unknown as RpcRequest)

const farFuture = (): string =>
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
const farPast = (): string =>
  new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

describe('isOptimisticConfirmationEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetOptimisticGateCacheForTests()
    mockGetMainnetProvider.mockReturnValue(mockMainnetProvider)
    mockGetFujiProvider.mockReturnValue(mockFujiProvider)
    mockGetUpgradesInfo.mockResolvedValue({ heliconTime: farFuture() })
  })

  it('returns false for non-Avalanche networks', async () => {
    const result = await isOptimisticConfirmationEnabled(
      makeRequest(BitcoinCaip2ChainId.MAINNET)
    )

    expect(result).toBe(false)
    expect(mockGetUpgradesInfo).not.toHaveBeenCalled()
  })

  it('returns false for non-Avalanche EVM networks', async () => {
    const result = await isOptimisticConfirmationEnabled(
      makeRequest('eip155:1')
    )

    expect(result).toBe(false)
    expect(mockGetUpgradesInfo).not.toHaveBeenCalled()
  })

  it('returns true for Avalanche C-Chain mainnet before Helicon is enabled', async () => {
    mockGetUpgradesInfo.mockResolvedValue({ heliconTime: farFuture() })

    const result = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )

    expect(mockGetMainnetProvider).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('returns false for Avalanche C-Chain mainnet after Helicon is enabled', async () => {
    mockGetUpgradesInfo.mockResolvedValue({ heliconTime: farPast() })

    const result = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )

    expect(result).toBe(false)
  })

  it('treats a missing heliconTime field as unknown -> non-optimistic', async () => {
    // We can't prove Helicon is still in the future, so default to the safer
    // post-Helicon flow rather than re-enabling optimistic confetti.
    mockGetUpgradesInfo.mockResolvedValue({})

    const result = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )

    expect(result).toBe(false)
  })

  it('treats an unparseable heliconTime as unknown -> non-optimistic', async () => {
    mockGetUpgradesInfo.mockResolvedValue({ heliconTime: 'not-a-date' })

    const result = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )

    expect(result).toBe(false)
  })

  it('returns false for the local Avalanche chain without consulting InfoAPI', async () => {
    // ChainId.AVALANCHE_LOCAL_ID = 43112; passes isAvalancheChainId but has no
    // default mainnet/fuji-style provider for getUpgradesInfo.
    const result = await isOptimisticConfirmationEnabled(
      makeRequest('eip155:43112')
    )

    expect(result).toBe(false)
    expect(mockGetUpgradesInfo).not.toHaveBeenCalled()
    expect(mockGetMainnetProvider).not.toHaveBeenCalled()
    expect(mockGetFujiProvider).not.toHaveBeenCalled()
  })

  it('uses the Fuji provider for Avalanche C-Chain testnet', async () => {
    await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C_TESTNET)
    )

    expect(mockGetFujiProvider).toHaveBeenCalled()
    expect(mockGetMainnetProvider).not.toHaveBeenCalled()
  })

  it('uses the Mainnet provider for P-Chain mainnet', async () => {
    await isOptimisticConfirmationEnabled(makeRequest(AvalancheCaip2ChainId.P))

    expect(mockGetMainnetProvider).toHaveBeenCalled()
    expect(mockGetFujiProvider).not.toHaveBeenCalled()
  })

  it('uses the Fuji provider for X-Chain testnet', async () => {
    await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.X_TESTNET)
    )

    expect(mockGetFujiProvider).toHaveBeenCalled()
    expect(mockGetMainnetProvider).not.toHaveBeenCalled()
  })

  it('returns false (conservative) when the upgrades info call fails', async () => {
    mockGetUpgradesInfo.mockRejectedValue(new Error('network down'))

    const result = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )

    expect(result).toBe(false)
  })

  it('shares a single in-flight fetch across concurrent calls for the same network', async () => {
    let resolveFetch: ((value: { heliconTime: string }) => void) | undefined
    mockGetUpgradesInfo.mockReturnValue(
      new Promise<{ heliconTime: string }>(resolve => {
        resolveFetch = resolve
      })
    )

    const requestA = makeRequest(AvalancheCaip2ChainId.C)
    const requestB = {
      ...makeRequest(AvalancheCaip2ChainId.C),
      requestId: 'req-2'
    } as RpcRequest

    const pendingA = isOptimisticConfirmationEnabled(requestA)
    const pendingB = isOptimisticConfirmationEnabled(requestB)

    resolveFetch?.({ heliconTime: farFuture() })

    const [resultA, resultB] = await Promise.all([pendingA, pendingB])

    expect(resultA).toBe(true)
    expect(resultB).toBe(true)
    expect(mockGetUpgradesInfo).toHaveBeenCalledTimes(1)
  })

  describe('sae-override flag', () => {
    it("returns false when override is 'enabled' (forces post-Helicon flow)", async () => {
      const request = makeRequest(AvalancheCaip2ChainId.C, {
        [RequestContext.SAE_OVERRIDE]: 'enabled'
      })

      const result = await isOptimisticConfirmationEnabled(request)

      expect(result).toBe(false)
      expect(mockGetUpgradesInfo).not.toHaveBeenCalled()
    })

    it("returns true when override is 'disabled' (forces optimistic flow)", async () => {
      const request = makeRequest(AvalancheCaip2ChainId.C, {
        [RequestContext.SAE_OVERRIDE]: 'disabled'
      })

      const result = await isOptimisticConfirmationEnabled(request)

      expect(result).toBe(true)
      expect(mockGetUpgradesInfo).not.toHaveBeenCalled()
    })

    it("falls through to InfoAPI check when override is 'auto'", async () => {
      mockGetUpgradesInfo.mockResolvedValue({ heliconTime: farFuture() })
      const request = makeRequest(AvalancheCaip2ChainId.C, {
        [RequestContext.SAE_OVERRIDE]: 'auto'
      })

      const result = await isOptimisticConfirmationEnabled(request)

      expect(result).toBe(true)
      expect(mockGetUpgradesInfo).toHaveBeenCalled()
    })

    it("forces optimistic flow even on non-Avalanche networks when override is 'disabled'", async () => {
      // The override is meant to be a blunt instrument; if QA flips it on a
      // non-Avalanche tx, respect it rather than silently ignoring.
      const request = makeRequest(BitcoinCaip2ChainId.MAINNET, {
        [RequestContext.SAE_OVERRIDE]: 'disabled'
      })

      const result = await isOptimisticConfirmationEnabled(request)

      expect(result).toBe(true)
    })
  })

  it('separates the cache between mainnet and fuji', async () => {
    mockGetUpgradesInfo
      .mockResolvedValueOnce({ heliconTime: farFuture() })
      .mockResolvedValueOnce({ heliconTime: farPast() })

    const mainnetResult = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )
    const fujiResult = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C_TESTNET)
    )

    expect(mainnetResult).toBe(true)
    expect(fujiResult).toBe(false)
    expect(mockGetUpgradesInfo).toHaveBeenCalledTimes(2)
  })
})
