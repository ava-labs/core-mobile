import { Avalanche } from '@avalabs/core-wallets-sdk'
import { RpcMethod, RpcRequest } from '@avalabs/vm-module-types'
import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId
} from '@avalabs/core-chains-sdk'
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

const makeRequest = (chainId: string): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: 'session-1',
    method: RpcMethod.ETH_SEND_TRANSACTION,
    chainId,
    params: {},
    dappInfo: { name: 'Test', url: 'https://test.com', icon: '' },
    context: {}
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

  it('treats a missing heliconTime field as not-yet-enabled', async () => {
    mockGetUpgradesInfo.mockResolvedValue({})

    const result = await isOptimisticConfirmationEnabled(
      makeRequest(AvalancheCaip2ChainId.C)
    )

    expect(result).toBe(true)
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
