import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { MarketToken } from 'store/watchlist'
import { Transaction } from 'store/transaction'
import { C_CHAIN_TOKEN_THRESHOLDS } from './constants/cChainTokenThresholds'
import {
  buildSymbolToPriceMapFromMarketTokens,
  filterOutLowValueActivityTransactions,
  parseTxTokenAmount,
  shouldFilterLowValueActivityTransaction
} from './filterLowValueActivity'

const USDC_MAINNET = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'

const nativeCChainThresholdRow = C_CHAIN_TOKEN_THRESHOLDS.find(
  r => r.contractAddress === null
)
if (nativeCChainThresholdRow === undefined) {
  throw new Error(
    'expected native C-Chain threshold row (contractAddress null)'
  )
}
const NATIVE_C_CHAIN_MIN_QTY = nativeCChainThresholdRow.quantity

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

describe('buildSymbolToPriceMapFromMarketTokens', () => {
  it('keeps first token per symbol like getMarketTokenBySymbol', () => {
    const map = buildSymbolToPriceMapFromMarketTokens([
      { symbol: 'AAA', currentPrice: 0.5 } as MarketToken,
      { symbol: 'aaa', currentPrice: 0.9 } as MarketToken
    ])
    expect(map.get('aaa')).toBe(0.5)
  })
})

describe('shouldFilterLowValueActivityTransaction', () => {
  const emptyPriceMap = new Map<string, number>()

  it('filters priced activity below $0.01', () => {
    const symbolToPriceUsd = new Map<string, number>([['tkn', 1]])

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

    expect(shouldFilterLowValueActivityTransaction(tx, symbolToPriceUsd)).toBe(
      true
    )
  })

  it('keeps priced activity at or above $0.01', () => {
    const symbolToPriceUsd = new Map<string, number>([['tkn', 1]])

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

    expect(shouldFilterLowValueActivityTransaction(tx, symbolToPriceUsd)).toBe(
      false
    )
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

    expect(shouldFilterLowValueActivityTransaction(tx, emptyPriceMap)).toBe(
      false
    )
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

    expect(shouldFilterLowValueActivityTransaction(tx, emptyPriceMap)).toBe(
      true
    )
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

    expect(shouldFilterLowValueActivityTransaction(tx, emptyPriceMap)).toBe(
      false
    )
  })

  it('uses only tokens[0] for priced swaps (ignores larger second leg)', () => {
    const symbolToPriceUsd = new Map<string, number>([
      ['small', 1],
      ['big', 1]
    ])

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

    expect(shouldFilterLowValueActivityTransaction(tx, symbolToPriceUsd)).toBe(
      true
    )
  })

  it('never filters NFT transactions even when token value would be below threshold', () => {
    const symbolToPriceUsd = new Map<string, number>([['usdc', 1]])
    const tx = makeEvmTx({
      txType: TransactionType.NFT_SEND,
      tokens: [
        {
          type: TokenType.ERC20,
          address: USDC_MAINNET,
          name: 'USD Coin',
          symbol: 'USDC',
          amount: '0.001'
        }
      ]
    })

    expect(shouldFilterLowValueActivityTransaction(tx, symbolToPriceUsd)).toBe(
      false
    )
    expect(shouldFilterLowValueActivityTransaction(tx, emptyPriceMap)).toBe(
      false
    )
  })

  it('never filters ERC721/ERC1155 collectible transactions (paired collectible id)', () => {
    const symbolToPriceUsd = new Map<string, number>([['cool', 0.000001]])
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.ERC721,
          address: '0xCollection',
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1'
        },
        {
          type: TokenType.ERC721,
          address: '0xCollection',
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1',
          collectableTokenId: '42'
        }
      ]
    })

    expect(shouldFilterLowValueActivityTransaction(tx, symbolToPriceUsd)).toBe(
      false
    )
  })

  it('on C-Chain without price, filters native AVAX below native threshold', () => {
    const belowMin = (NATIVE_C_CHAIN_MIN_QTY / 2).toString()
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: belowMin
        }
      ]
    })

    expect(shouldFilterLowValueActivityTransaction(tx, emptyPriceMap)).toBe(
      true
    )
  })

  it('on C-Chain without price, keeps native AVAX at or above native threshold', () => {
    const tx = makeEvmTx({
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: String(NATIVE_C_CHAIN_MIN_QTY)
        }
      ]
    })

    expect(shouldFilterLowValueActivityTransaction(tx, emptyPriceMap)).toBe(
      false
    )
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
      symbolToPriceUsd: new Map()
    })
    expect(out).toHaveLength(1)
  })
})
