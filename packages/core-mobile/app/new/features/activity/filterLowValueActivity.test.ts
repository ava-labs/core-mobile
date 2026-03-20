import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { MarketToken } from 'store/watchlist'
import { Transaction } from 'store/transaction'
import {
  filterOutLowValueActivityTransactions,
  parseTxTokenAmount,
  shouldFilterLowValueActivityTransaction
} from './filterLowValueActivity'

const USDC_MAINNET = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'

function makeEvmTx(
  overrides: Partial<Transaction> & {
    tokens: Transaction['tokens']
  }
): Transaction {
  return {
    isContractCall: false,
    isIncoming: false,
    isOutgoing: false,
    isSender: false,
    timestamp: Date.now(),
    hash: '0xabc',
    from: '0xfrom',
    to: '0xto',
    gasUsed: '21000',
    chainId: String(ChainId.AVALANCHE_MAINNET_ID),
    explorerLink: '',
    txType: TransactionType.SEND,
    ...overrides
  }
}

describe('parseTxTokenAmount', () => {
  it('parses comma-separated amounts', () => {
    expect(parseTxTokenAmount('1,234.56')).toBe(1234.56)
  })
})

describe('shouldFilterLowValueActivityTransaction', () => {
  const noPrice = (): MarketToken | undefined => undefined

  it('filters priced activity below $0.01', () => {
    const getMarketTokenBySymbol = (symbol: string): MarketToken | undefined =>
      symbol === 'TKN' ? ({ currentPrice: 1 } as MarketToken) : undefined

    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC20,
          address: '0x123',
          name: 'Tok',
          symbol: 'TKN',
          amount: '0.005'
        }
      ],
      txType: TransactionType.SEND
    })

    expect(
      shouldFilterLowValueActivityTransaction(tx, getMarketTokenBySymbol)
    ).toBe(true)
  })

  it('keeps priced activity at or above $0.01', () => {
    const getMarketTokenBySymbol = (symbol: string): MarketToken | undefined =>
      symbol === 'TKN' ? ({ currentPrice: 1 } as MarketToken) : undefined

    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC20,
          address: '0x123',
          name: 'Tok',
          symbol: 'TKN',
          amount: '0.02'
        }
      ],
      txType: TransactionType.SEND
    })

    expect(
      shouldFilterLowValueActivityTransaction(tx, getMarketTokenBySymbol)
    ).toBe(false)
  })

  it('on C-Chain mainnet without price, keeps USDC when amount >= JSON threshold', () => {
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC20,
          address: USDC_MAINNET,
          name: 'USD Coin',
          symbol: 'USDC',
          amount: '0.02'
        }
      ],
      txType: TransactionType.SEND
    })

    expect(shouldFilterLowValueActivityTransaction(tx, noPrice)).toBe(false)
  })

  it('on C-Chain mainnet without price, filters USDC when amount < JSON threshold', () => {
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC20,
          address: USDC_MAINNET,
          name: 'USD Coin',
          symbol: 'USDC',
          amount: '0.005'
        }
      ],
      txType: TransactionType.SEND
    })

    expect(shouldFilterLowValueActivityTransaction(tx, noPrice)).toBe(true)
  })

  it('without price, keeps unknown tokens on C-Chain (not in JSON)', () => {
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC20,
          address: '0xdeadbeef00000000000000000000000000000001',
          name: 'Random',
          symbol: 'RND',
          amount: '0.000001'
        }
      ],
      txType: TransactionType.SEND
    })

    expect(shouldFilterLowValueActivityTransaction(tx, noPrice)).toBe(false)
  })

  it('uses only tokens[0] for priced swaps (ignores larger second leg)', () => {
    const getMarketTokenBySymbol = (symbol: string): MarketToken | undefined =>
      symbol === 'SMALL'
        ? ({ currentPrice: 1 } as MarketToken)
        : symbol === 'BIG'
        ? ({ currentPrice: 1 } as MarketToken)
        : undefined

    const tx = makeEvmTx({
      txType: TransactionType.SWAP,
      tokens: [
        {
          type: TokenType.ERC20,
          address: '0x111',
          name: 'Small',
          symbol: 'SMALL',
          amount: '0.005'
        },
        {
          type: TokenType.ERC20,
          address: '0x222',
          name: 'Big',
          symbol: 'BIG',
          amount: '100'
        }
      ]
    })

    expect(
      shouldFilterLowValueActivityTransaction(tx, getMarketTokenBySymbol)
    ).toBe(true)
  })
})

describe('filterOutLowValueActivityTransactions', () => {
  it('does not filter when isTestnet is true', () => {
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC20,
          address: USDC_MAINNET,
          name: 'USD Coin',
          symbol: 'USDC',
          amount: '0.005'
        }
      ],
      txType: TransactionType.SEND
    })

    const out = filterOutLowValueActivityTransactions([tx], {
      isTestnet: true,
      getMarketTokenBySymbol: () => undefined
    })
    expect(out).toHaveLength(1)
  })
})
