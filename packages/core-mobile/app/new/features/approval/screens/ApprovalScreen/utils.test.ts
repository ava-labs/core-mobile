import {
  RpcRequest,
  DetailItem,
  RpcMethod,
  DetailItemType
} from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { RootState } from 'store/types'
import { Account } from 'store/account/types'
import {
  getAlertMessage,
  getAlertReasons,
  removeWebsiteItemIfNecessary,
  overrideContractItem,
  getAccountSelector,
  getNativeAmountItem,
  getPeerTrustWarning,
  isRequestedAccountUnavailable,
  getAccountUnavailableMessage,
  withNativeAmountItem
} from './utils'

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

describe('getAccountSelector', () => {
  const SVM_ADDRESS = 'SoLaNaPubKey1111111111111111111111111111111'
  // Active wallet 'w1' and a different wallet 'w2' that holds the SAME address —
  // the CP-14468 scenario where a dApp pubkey could resolve cross-wallet.
  const activeAccount = {
    id: 'w1-0',
    walletId: 'w1',
    index: 0,
    addressC: '0xc1',
    addressBTC: 'btc1',
    addressSVM: SVM_ADDRESS
  }
  const otherWalletAccount = {
    id: 'w2-0',
    walletId: 'w2',
    index: 0,
    addressC: '0xc2',
    addressBTC: 'btc2',
    addressSVM: SVM_ADDRESS
  }

  const stateWith = (...accounts: unknown[]): RootState =>
    ({
      account: {
        accounts: Object.fromEntries(
          accounts.map(a => [(a as { id: string }).id, a])
        ),
        activeAccountId: 'w1-0'
      }
    } as unknown as RootState)

  const signingData = {
    type: RpcMethod.SOLANA_SIGN_TRANSACTION,
    account: SVM_ADDRESS,
    data: 'serialized'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  it('resolves the active wallet account that owns the address', () => {
    const selector = getAccountSelector(signingData, 'w1')
    expect(selector(stateWith(activeAccount, otherWalletAccount))).toEqual(
      activeAccount
    )
  })

  it('returns undefined when the address only exists in a non-active wallet', () => {
    // Approval is disabled (account undefined) rather than displaying/signing a
    // cross-wallet account.
    const selector = getAccountSelector(signingData, 'w1')
    expect(selector(stateWith(otherWalletAccount))).toBeUndefined()
  })
})

describe('isRequestedAccountUnavailable', () => {
  const account = { id: 'w1-0', walletId: 'w1' } as unknown as Account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withAccount = { type: RpcMethod.SOLANA_SIGN_TRANSACTION } as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withoutAccount = { type: RpcMethod.AVALANCHE_SIGN_MESSAGE } as any

  it('is true when an account is requested but none resolved (cross-wallet)', () => {
    expect(
      isRequestedAccountUnavailable(
        { ...withAccount, account: 'addr' },
        undefined
      )
    ).toBe(true)
  })

  it('is false when the requested account resolved', () => {
    expect(
      isRequestedAccountUnavailable(
        { ...withAccount, account: 'addr' },
        account
      )
    ).toBe(false)
  })

  it('is false when the request does not target a specific account', () => {
    expect(isRequestedAccountUnavailable(withoutAccount, undefined)).toBe(false)
  })
})

describe('getAccountUnavailableMessage', () => {
  it('names both the account and the owning wallet when known', () => {
    const message = getAccountUnavailableMessage('Wallet 2', 'Account 3')
    expect(message).toContain('Wallet 2')
    expect(message).toContain('Account 3')
    expect(message).toContain('Switch to')
  })

  it('names just the wallet when the account name is unknown', () => {
    const message = getAccountUnavailableMessage('Wallet 2')
    expect(message).toContain('Wallet 2')
    // No "<account> in <wallet>" phrasing without an account name.
    expect(message).not.toContain(' in "')
  })

  it('falls back to a generic message when nothing is known', () => {
    const message = getAccountUnavailableMessage()
    expect(message).toContain('a different wallet')
    expect(message).not.toContain('"')
  })

  it('uses request-neutral wording (shown for message signing too, not just txs)', () => {
    for (const message of [
      getAccountUnavailableMessage('Wallet 2', 'Account 3'),
      getAccountUnavailableMessage('Wallet 2'),
      getAccountUnavailableMessage()
    ]) {
      expect(message).not.toContain('transaction')
    }
  })
})

describe('getNativeAmountItem', () => {
  const signingData = (value: unknown): never =>
    ({
      type: RpcMethod.ETH_SEND_TRANSACTION,
      account: '0xfrom',
      data: { value }
    } as never)

  it('derives a currency row from a non-zero native value', () => {
    expect(
      getNativeAmountItem({
        signingData: signingData('0x6124fee993bc0000'),
        symbol: 'ETH',
        maxDecimals: 18
      })
    ).toEqual({
      type: DetailItemType.CURRENCY,
      label: 'Amount',
      value: 7000000000000000000n,
      maxDecimals: 18,
      symbol: 'ETH'
    })
  })

  it('accepts a decimal string value', () => {
    expect(
      getNativeAmountItem({
        signingData: signingData('1000000000000000000'),
        symbol: 'AVAX',
        maxDecimals: 18
      })?.value
    ).toBe(1000000000000000000n)
  })

  it('omits the row for a zero value', () => {
    expect(
      getNativeAmountItem({
        signingData: signingData('0x0'),
        symbol: 'ETH',
        maxDecimals: 18
      })
    ).toBeUndefined()
  })

  it('omits the row when there is no value at all', () => {
    expect(
      getNativeAmountItem({
        signingData: signingData(undefined),
        symbol: 'ETH',
        maxDecimals: 18
      })
    ).toBeUndefined()
  })

  it('omits the row for an unparseable value rather than guessing', () => {
    expect(
      getNativeAmountItem({
        signingData: signingData('not-a-number'),
        symbol: 'ETH',
        maxDecimals: 18
      })
    ).toBeUndefined()
  })

  it('only applies to eth_sendTransaction', () => {
    expect(
      getNativeAmountItem({
        signingData: {
          type: RpcMethod.PERSONAL_SIGN,
          account: '0xfrom',
          data: 'hello'
        } as never,
        symbol: 'ETH',
        maxDecimals: 18
      })
    ).toBeUndefined()
  })
})

describe('withNativeAmountItem', () => {
  const amountItem = {
    type: DetailItemType.CURRENCY as const,
    label: 'Amount',
    value: 7000000000000000000n,
    maxDecimals: 18,
    symbol: 'ETH'
  }

  it('prepends the amount row so it reads before the recipient', () => {
    const section = {
      title: 'Transaction Details',
      items: [
        { type: DetailItemType.ADDRESS as const, label: 'To', value: '0xto' }
      ]
    }

    expect(withNativeAmountItem(section, amountItem).items).toEqual([
      amountItem,
      section.items[0]
    ])
  })

  it('returns the section untouched when there is no amount to add', () => {
    const section = { title: 'Transaction Details', items: [] }
    expect(withNativeAmountItem(section, undefined)).toBe(section)
  })

  it('does not duplicate an amount the module already itemised', () => {
    const section = {
      title: 'Transaction Details',
      items: [
        {
          type: DetailItemType.CURRENCY as const,
          label: 'Amount',
          value: 7000000000000000000n,
          maxDecimals: 18,
          symbol: 'ETH'
        }
      ]
    }

    expect(withNativeAmountItem(section, amountItem)).toBe(section)
  })

  it('still adds the row when the module itemised a different token', () => {
    const section = {
      title: 'Transaction Details',
      items: [
        {
          type: DetailItemType.CURRENCY as const,
          label: 'Amount',
          value: 1n,
          maxDecimals: 6,
          symbol: 'USDC'
        }
      ]
    }

    expect(withNativeAmountItem(section, amountItem).items).toHaveLength(2)
  })
})

// Check that the native amount is only shown when the value is actually being signed, 
// so it doesn't depend on a Blockaid simulation being available.
describe('getPeerTrustWarning', () => {
  const withContext = (context: Record<string, unknown> | undefined) =>
    ({ context } as unknown as RpcRequest)

  it('returns the warning the pipeline attached', () => {
    expect(
      getPeerTrustWarning(
        withContext({
          [RequestContext.PEER_TRUST_WARNING]:
            'This dApp claims to be "uniswap.org" but is served from "attacker.example".'
        })
      )
    ).toContain('attacker.example')
  })

  it('returns undefined when no warning was attached', () => {
    expect(getPeerTrustWarning(withContext({}))).toBeUndefined()
    expect(getPeerTrustWarning(withContext(undefined))).toBeUndefined()
  })

  it('ignores a non-string or empty value', () => {
    expect(
      getPeerTrustWarning(
        withContext({ [RequestContext.PEER_TRUST_WARNING]: '' })
      )
    ).toBeUndefined()
    expect(
      getPeerTrustWarning(
        withContext({ [RequestContext.PEER_TRUST_WARNING]: { spoof: true } })
      )
    ).toBeUndefined()
  })
})

// The module supplies four alert fields; the sheets rendered only `description`
// and `body`, dropping `title` and `detailedDescription` entirely.
describe('getAlertMessage', () => {
  const alert = (details: Record<string, unknown>) =>
    ({ type: 'Warning', details } as never)

  it('puts the title ahead of the description', () => {
    expect(
      getAlertMessage(
        alert({ title: 'Scam transaction', description: 'Do not proceed.' })
      )
    ).toBe('Scam transaction\nDo not proceed.')
  })

  it('does not repeat a title the description already leads with', () => {
    expect(
      getAlertMessage(
        alert({
          title: 'Manual approval required',
          description: 'Manual approval required\nslippage exceeded'
        })
      )
    ).toBe('Manual approval required\nslippage exceeded')
  })

  it('falls back to the description alone when there is no title', () => {
    expect(getAlertMessage(alert({ description: 'Just this.' }))).toBe(
      'Just this.'
    )
  })

  it('returns undefined with no alert', () => {
    expect(getAlertMessage(undefined)).toBeUndefined()
  })
})

describe('getAlertReasons', () => {
  const alert = (details: Record<string, unknown>) =>
    ({ type: 'Warning', details } as never)

  it('surfaces detailedDescription, which no renderer used to show', () => {
    // evm-module puts the real EIP-712 validation error here, behind the
    // generic "contains non-standard elements" description.
    expect(
      getAlertReasons(
        alert({
          description: 'This message contains non-standard elements.',
          detailedDescription: 'ambiguous primitive array at Mail.to[0]'
        })
      )
    ).toEqual(['ambiguous primitive array at Mail.to[0]'])
  })

  it('keeps body lines and appends the detail after them', () => {
    expect(
      getAlertReasons(
        alert({
          description: 'x',
          body: ['This transaction is malicious', 'do not proceed'],
          detailedDescription: 'flagged by scanner'
        })
      )
    ).toEqual([
      'This transaction is malicious',
      'do not proceed',
      'flagged by scanner'
    ])
  })

  it('is empty when the alert carries neither', () => {
    expect(getAlertReasons(alert({ description: 'x' }))).toEqual([])
  })

  it('ignores a whitespace-only detail', () => {
    expect(
      getAlertReasons(alert({ description: 'x', detailedDescription: '   ' }))
    ).toEqual([])
  })

  it('is empty with no alert', () => {
    expect(getAlertReasons(undefined)).toEqual([])
  })
})
