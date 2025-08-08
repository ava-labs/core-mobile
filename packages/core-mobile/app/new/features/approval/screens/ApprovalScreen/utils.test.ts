import {
  RpcRequest,
  DetailItem,
  RpcMethod,
  DetailItemType
} from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { removeWebsiteItemIfNecessary, overrideContractItem } from './utils'

// Mock the isInAppRequest function for controlled testing
jest.mock('store/rpc/utils/isInAppRequest', () => ({
  isInAppRequest: jest.fn()
}))

describe('removeWebsiteItemIfNecessary', () => {
  const mockRequest: RpcRequest = {
    method: RpcMethod.ETH_SEND_TRANSACTION,
    context: {},
    requestId: '1',
    sessionId: '1',
    chainId: 'eip155:1',
    params: [],
    dappInfo: { name: 'Test Dapp', url: 'https://test.com', icon: '' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true for string item', () => {
    const item = 'test string'
    expect(removeWebsiteItemIfNecessary(item, mockRequest)).toBe(true)
  })

  it('returns true for non-in-app request regardless of label', () => {
    const item: DetailItem = {
      label: 'Website',
      value: { name: 'Core', icon: '', url: 'https://core.app/' },
      type: DetailItemType.LINK
    }
    ;(isInAppRequest as jest.Mock).mockReturnValue(false)
    expect(removeWebsiteItemIfNecessary(item, mockRequest)).toBe(true)
  })

  it('returns true for in-app request with non-website label', () => {
    const item: DetailItem = {
      label: 'Account',
      type: DetailItemType.ADDRESS,
      value: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F'
    }
    ;(isInAppRequest as jest.Mock).mockReturnValue(true)
    expect(removeWebsiteItemIfNecessary(item, mockRequest)).toBe(true)
  })

  it('returns false for in-app request with website label', () => {
    const item: DetailItem = {
      label: 'Website',
      value: { name: 'Core', icon: '', url: 'https://core.app/' },
      type: DetailItemType.LINK
    }
    ;(isInAppRequest as jest.Mock).mockReturnValue(true)
    expect(removeWebsiteItemIfNecessary(item, mockRequest)).toBe(false)
  })

  it('is case-insensitive for website label', () => {
    const item: DetailItem = {
      label: 'WEBSITE',
      value: { name: 'Core', icon: '', url: 'https://core.app/' },
      type: DetailItemType.LINK
    }
    ;(isInAppRequest as jest.Mock).mockReturnValue(true)
    expect(removeWebsiteItemIfNecessary(item, mockRequest)).toBe(false)
  })

  it('returns true for other labels in in-app request', () => {
    const item: DetailItem = {
      label: 'Network',
      type: DetailItemType.NETWORK,
      value: {
        name: 'Ethereum',
        logoUri:
          'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg'
      }
    }
    ;(isInAppRequest as jest.Mock).mockReturnValue(true)
    expect(removeWebsiteItemIfNecessary(item, mockRequest)).toBe(true)
  })
})

describe('overrideContractItem', () => {
  const baseRequest: RpcRequest = {
    method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
    context: {},
    requestId: '1',
    sessionId: '1',
    chainId: 'eip155:1',
    params: [],
    dappInfo: { name: 'Test Dapp', url: 'https://test.com', icon: '' }
  }
  const ethSendTxRequest: RpcRequest = {
    method: RpcMethod.ETH_SEND_TRANSACTION,
    context: {},
    requestId: '1',
    sessionId: '1',
    chainId: 'eip155:1',
    params: [],
    dappInfo: { name: 'Test Dapp', url: 'https://test.com', icon: '' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns item unchanged for string input', () => {
    const item = 'test string'
    expect(overrideContractItem(item, baseRequest)).toBe('test string')
  })

  it('returns item unchanged for non-ETH_SEND_TRANSACTION method', () => {
    const item: DetailItem = {
      label: 'Contract',
      type: DetailItemType.ADDRESS,
      value: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F'
    }
    expect(overrideContractItem(item, baseRequest)).toEqual(item)
  })

  it('returns item unchanged for ETH_SEND_TRANSACTION with non-contract label', () => {
    const item: DetailItem = {
      label: 'Account',
      type: DetailItemType.ADDRESS,
      value: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F'
    }
    expect(overrideContractItem(item, ethSendTxRequest)).toEqual(item)
  })

  it('returns item unchanged for ETH_SEND_TRANSACTION with contract label and no non-contract context', () => {
    const item: DetailItem = {
      label: 'Contract',
      type: DetailItemType.ADDRESS,
      value: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F'
    }
    expect(overrideContractItem(item, ethSendTxRequest)).toEqual(item)
  })

  it('overrides contract label to To for ETH_SEND_TRANSACTION with non-contract recipient', () => {
    const item: DetailItem = {
      label: 'Contract',
      type: DetailItemType.ADDRESS,
      value: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F'
    }
    const request: RpcRequest = {
      method: RpcMethod.ETH_SEND_TRANSACTION,
      context: {
        [RequestContext.NON_CONTRACT_RECIPIENT_ADDRESS]: '0xToAddress'
      },
      requestId: '1',
      sessionId: '1',
      chainId: 'eip155:1',
      params: [],
      dappInfo: { name: 'Test Dapp', url: 'https://test.com', icon: '' }
    }
    const result = overrideContractItem(item, request)
    expect(result).toEqual({
      ...item,
      label: 'To',
      value: '0xToAddress'
    })
    expect(result).not.toBe(item) // Ensure a new object is returned
  })

  it('is case-insensitive for contract label', () => {
    const item: DetailItem = {
      label: 'CONTRACT',
      type: DetailItemType.ADDRESS,
      value: '0x6bD4f76e2c0453bFC6F7177542808E22A4Ee323F'
    }
    const request: RpcRequest = {
      method: RpcMethod.ETH_SEND_TRANSACTION,
      context: {
        [RequestContext.NON_CONTRACT_RECIPIENT_ADDRESS]: '0xToAddress'
      },
      requestId: '1',
      sessionId: '1',
      chainId: 'eip155:1',
      params: [],
      dappInfo: { name: 'Test Dapp', url: 'https://test.com', icon: '' }
    }
    const result = overrideContractItem(item, request)
    expect(result).toEqual({
      ...item,
      label: 'To',
      value: '0xToAddress'
    })
  })

  it('returns item unchanged for other labels in ETH_SEND_TRANSACTION', () => {
    const item: DetailItem = {
      label: 'Network',
      type: DetailItemType.NETWORK,
      value: {
        name: 'Ethereum',
        logoUri:
          'https://images.ctfassets.net/gcj8jwzm6086/6l56QLVZmvacuBfjHBTThP/791d743dd2c526692562780c2325fedf/eth-circle__1_.svg'
      }
    }
    expect(overrideContractItem(item, ethSendTxRequest)).toEqual(item)
  })
})
