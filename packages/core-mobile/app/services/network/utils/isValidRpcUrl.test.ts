import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { Network } from 'ethers'
import { isValidRPCUrl } from './isValidRpcUrl'

const mockGetNetwork = jest.fn()
jest.mock('@avalabs/wallets-sdk', () => ({
  JsonRpcBatchInternal: jest
    .fn()
    .mockImplementation(() => ({ getNetwork: mockGetNetwork }))
}))

describe('app/services/network/utils/isValidRpcUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true when rpc url is for the given chainId', async () => {
    mockGetNetwork.mockReturnValue(1)
    expect(await isValidRPCUrl(1, 'https://someurl.example')).toBe(false)
    expect(JsonRpcBatchInternal).toHaveBeenCalledWith(
      { maxCalls: 40 },
      'https://someurl.example',
      new Network('', 1)
    )
  })

  it('returns false on errors', async () => {
    mockGetNetwork.mockRejectedValue(new Error('some error'))
    expect(await isValidRPCUrl(1, 'https://someurl.example')).toBe(false)
    expect(JsonRpcBatchInternal).toHaveBeenCalledWith(
      { maxCalls: 40 },
      'https://someurl.example',
      new Network('', 1)
    )
  })

  it('returns false when chain id does not match', async () => {
    mockGetNetwork.mockReturnValue(2)
    expect(await isValidRPCUrl(1, 'https://someurl.example')).toBe(false)
    expect(JsonRpcBatchInternal).toHaveBeenCalledWith(
      { maxCalls: 40 },
      'https://someurl.example',
      new Network('', 1)
    )
  })
})
