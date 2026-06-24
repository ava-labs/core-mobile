import { DetailItemType } from '@avalabs/vm-module-types'
import { parseKnownTypedData } from './parseKnownTypedData'
import { getTypedDataChainId } from './getTypedDataChainId'
import { KnownTypedDataKind } from './types'

const OWNER = '0x1111111111111111111111111111111111111111'
const SPENDER = '0x2222222222222222222222222222222222222222'
const TOKEN = '0x3333333333333333333333333333333333333333'
const RECIPIENT = '0x4444444444444444444444444444444444444444'

const permit712 = {
  types: {
    EIP712Domain: [],
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  },
  primaryType: 'Permit',
  domain: {
    name: 'USD Coin',
    version: '2',
    chainId: 1,
    verifyingContract: TOKEN
  },
  message: {
    owner: OWNER,
    spender: SPENDER,
    value: '1000000',
    nonce: 0,
    deadline: 1700000000
  }
}

const permit2Single = {
  types: { EIP712Domain: [], PermitSingle: [] },
  primaryType: 'PermitSingle',
  domain: {
    name: 'Permit2',
    chainId: 1,
    verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3'
  },
  message: {
    details: {
      token: TOKEN,
      amount: '1461501637330902918203684832716283019655932542975',
      expiration: 1700000000,
      nonce: 0
    },
    spender: SPENDER,
    sigDeadline: 1700000000
  }
}

const seaportOrder = {
  types: { EIP712Domain: [], OrderComponents: [] },
  primaryType: 'OrderComponents',
  domain: {
    name: 'Seaport',
    version: '1.5',
    chainId: 1,
    verifyingContract: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'
  },
  message: {
    offerer: OWNER,
    offer: [
      {
        itemType: 2,
        token: TOKEN,
        identifierOrCriteria: '123',
        startAmount: '1'
      }
    ],
    consideration: [
      {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        startAmount: '1000000000000000000',
        recipient: RECIPIENT
      }
    ],
    startTime: '1700000000',
    endTime: '1700100000'
  }
}

describe('parseKnownTypedData', () => {
  it('parses EIP-2612 Permit with spender, amount and deadline', () => {
    const result = parseKnownTypedData(permit712 as never)

    expect(result?.kind).toBe(KnownTypedDataKind.ERC20_PERMIT)
    const items = result?.section.items ?? []
    expect(items).toContainEqual({
      type: DetailItemType.ADDRESS,
      label: 'Spender',
      value: SPENDER
    })
    expect(items).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Amount',
      value: '1000000',
      alignment: 'horizontal'
    })
    expect(items).toContainEqual({
      type: DetailItemType.DATE,
      label: 'Deadline',
      value: '1700000000'
    })
  })

  it('parses Uniswap Permit2 PermitSingle and treats the max amount as no expiry', () => {
    const result = parseKnownTypedData(permit2Single as never)

    expect(result?.kind).toBe(KnownTypedDataKind.PERMIT2)
    const items = result?.section.items ?? []
    expect(items).toContainEqual({
      type: DetailItemType.ADDRESS,
      label: 'Token',
      value: TOKEN
    })
    expect(items).toContainEqual({
      type: DetailItemType.ADDRESS,
      label: 'Spender',
      value: SPENDER
    })
    // expiration is a normal timestamp here -> a DATE item
    expect(items).toContainEqual({
      type: DetailItemType.DATE,
      label: 'Expiration',
      value: '1700000000'
    })
  })

  it('renders a sentinel max deadline as "No expiry"', () => {
    const result = parseKnownTypedData({
      ...permit712,
      message: {
        ...permit712.message,
        deadline:
          '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      }
    } as never)

    expect(result?.section.items).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Deadline',
      value: 'No expiry',
      alignment: 'horizontal'
    })
  })

  it('parses an OpenSea Seaport order summary', () => {
    const result = parseKnownTypedData(seaportOrder as never)

    expect(result?.kind).toBe(KnownTypedDataKind.SEAPORT)
    const items = result?.section.items ?? []
    expect(items).toContainEqual({
      type: DetailItemType.ADDRESS,
      label: 'Offerer',
      value: OWNER
    })
    expect(items).toContainEqual({
      type: DetailItemType.TEXT,
      label: 'Offering',
      value: '1 item(s)',
      alignment: 'horizontal'
    })
    expect(items).toContainEqual({
      type: DetailItemType.ADDRESS,
      label: 'Recipient 1',
      value: RECIPIENT
    })
  })

  it('returns null for unrecognized typed data', () => {
    const result = parseKnownTypedData({
      types: { EIP712Domain: [], Mail: [] },
      primaryType: 'Mail',
      domain: { name: 'Ether Mail', chainId: 1 },
      message: { contents: 'Hello' }
    } as never)

    expect(result).toBeNull()
  })

  it('returns null for V1 (array) typed data and undefined input', () => {
    expect(
      parseKnownTypedData([
        { name: 'message', type: 'string', value: 'hi' }
      ] as never)
    ).toBeNull()
    expect(parseKnownTypedData(undefined)).toBeNull()
  })

  it('never throws on malformed payloads', () => {
    expect(() =>
      parseKnownTypedData({ primaryType: 'Permit' } as never)
    ).not.toThrow()
    expect(parseKnownTypedData({ primaryType: 'Permit' } as never)).toBeNull()
  })
})

describe('getTypedDataChainId', () => {
  it('reads a numeric domain chainId', () => {
    expect(getTypedDataChainId(permit712 as never)).toBe(1)
  })

  it('reads a hex-string domain chainId', () => {
    expect(
      getTypedDataChainId({
        ...permit712,
        domain: { ...permit712.domain, chainId: '0x89' }
      } as never)
    ).toBe(137)
  })

  it('reads a decimal-string domain chainId', () => {
    expect(
      getTypedDataChainId({
        ...permit712,
        domain: { ...permit712.domain, chainId: '43114' }
      } as never)
    ).toBe(43114)
  })

  it('returns undefined when the domain has no chainId', () => {
    expect(
      getTypedDataChainId({
        ...permit712,
        domain: { name: 'USD Coin' }
      } as never)
    ).toBeUndefined()
  })

  it('returns undefined for V1 (array) typed data and undefined input', () => {
    expect(getTypedDataChainId([] as never)).toBeUndefined()
    expect(getTypedDataChainId(undefined)).toBeUndefined()
  })
})
