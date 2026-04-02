import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { getOnChainErc20Balance } from './getOnChainErc20Balance'

const mockBalanceOf = jest.fn()

jest.mock('contracts/openzeppelin', () => ({
  ERC20__factory: {
    connect: () => ({
      balanceOf: mockBalanceOf
    })
  }
}))

const mockProvider = {} as unknown as JsonRpcBatchInternal

describe('getOnChainErc20Balance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the on-chain balance for a given token and user', async () => {
    mockBalanceOf.mockResolvedValue(500000n)

    const result = await getOnChainErc20Balance({
      tokenAddress: '0xTokenAddress',
      userAddress: '0xUserAddress',
      provider: mockProvider
    })

    expect(result).toBe(500000n)
    expect(mockBalanceOf).toHaveBeenCalledWith('0xUserAddress')
  })

  it('throws when balanceOf call fails', async () => {
    mockBalanceOf.mockRejectedValue(new Error('RPC error'))

    await expect(
      getOnChainErc20Balance({
        tokenAddress: '0xTokenAddress',
        userAddress: '0xUserAddress',
        provider: mockProvider
      })
    ).rejects.toThrow(
      'Failed to verify on-chain balance for token 0xTokenAddress'
    )
  })
})
