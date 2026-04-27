import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { Transaction } from 'store/transaction'
import {
  findNftToken,
  isCollectibleTransaction,
  isNftTransaction,
  isPotentiallySwap
} from './utils'

const USER_ADDRESS = '0xUser'
const MARKETPLACE = '0xMarketplace'
const NFT_CONTRACT = '0xCollection'
const TOKEN_ID = '42'

function makeTx(
  overrides: Partial<Transaction> & { tokens: Transaction['tokens'] }
): Transaction {
  return {
    isContractCall: false,
    isIncoming: false,
    isOutgoing: false,
    isSender: false,
    timestamp: Date.now(),
    hash: '0xabc',
    from: USER_ADDRESS,
    to: '0xto',
    gasUsed: '21000',
    chainId: String(ChainId.AVALANCHE_MAINNET_ID),
    explorerLink: '',
    txType: TransactionType.UNKNOWN,
    ...overrides
  }
}

describe('findNftToken', () => {
  it('returns the NFT token when it sits at index 1 (purchase pattern)', () => {
    const tx = makeTx({
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: '0.075'
        },
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1',
          collectableTokenId: TOKEN_ID
        }
      ]
    })

    const nft = findNftToken(tx)
    expect(nft?.type).toBe(TokenType.ERC721)
    expect(nft?.collectableTokenId).toBe(TOKEN_ID)
  })

  it('prefers the NFT entry that carries collectableTokenId when paired entries exist', () => {
    const tx = makeTx({
      tokens: [
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1'
        },
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1',
          collectableTokenId: TOKEN_ID
        }
      ]
    })

    expect(findNftToken(tx)?.collectableTokenId).toBe(TOKEN_ID)
  })

  it('returns undefined when no NFT token is present', () => {
    const tx = makeTx({
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: '1'
        },
        {
          type: TokenType.ERC20,
          address: '0x123',
          name: 'USDC',
          symbol: 'USDC',
          amount: '5'
        }
      ]
    })

    expect(findNftToken(tx)).toBeUndefined()
  })
})

describe('isCollectibleTransaction', () => {
  it('detects a marketplace NFT purchase (NATIVE + ERC721, txType=UNKNOWN)', () => {
    const tx = makeTx({
      isContractCall: true,
      txType: TransactionType.UNKNOWN,
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: '0.075',
          from: { address: USER_ADDRESS }
        },
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1',
          collectableTokenId: TOKEN_ID,
          from: { address: MARKETPLACE },
          to: { address: USER_ADDRESS }
        }
      ]
    })

    expect(isCollectibleTransaction(tx)).toBe(true)
  })

  it('still detects the legacy paired-NFT pattern', () => {
    const tx = makeTx({
      tokens: [
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1'
        },
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1',
          collectableTokenId: TOKEN_ID
        }
      ]
    })

    expect(isCollectibleTransaction(tx)).toBe(true)
  })

  it('detects via txType for NFT_BUY / NFT_SEND / NFT_RECEIVE', () => {
    const baseTokens: Transaction['tokens'] = [
      {
        type: TokenType.NATIVE,
        name: 'Avalanche',
        symbol: 'AVAX',
        amount: '1'
      }
    ]

    expect(
      isCollectibleTransaction(
        makeTx({ txType: TransactionType.NFT_BUY, tokens: baseTokens })
      )
    ).toBe(true)
    expect(
      isCollectibleTransaction(
        makeTx({ txType: TransactionType.NFT_SEND, tokens: baseTokens })
      )
    ).toBe(true)
    expect(
      isCollectibleTransaction(
        makeTx({ txType: TransactionType.NFT_RECEIVE, tokens: baseTokens })
      )
    ).toBe(true)
  })

  it('returns false for plain swap-like transactions (no NFT, non-NFT txType)', () => {
    const tx = makeTx({
      isContractCall: true,
      txType: TransactionType.SWAP,
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: '1'
        },
        {
          type: TokenType.ERC20,
          address: '0x123',
          name: 'USDC',
          symbol: 'USDC',
          amount: '20'
        }
      ]
    })

    expect(isCollectibleTransaction(tx)).toBe(false)
  })

  it('respects explicit SWAP txType even when an NFT leg is present', () => {
    // Defensive guard: if the backend confidently classified the tx as a
    // swap, we should not reclassify it as a collectible just because a
    // routing leg happens to include an NFT token entry.
    const tx = makeTx({
      isContractCall: true,
      txType: TransactionType.SWAP,
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: '1'
        },
        {
          type: TokenType.ERC721,
          address: NFT_CONTRACT,
          name: 'Cool NFT',
          symbol: 'COOL',
          amount: '1',
          collectableTokenId: TOKEN_ID
        }
      ]
    })

    expect(isCollectibleTransaction(tx)).toBe(false)
  })
})

describe('isNftTransaction', () => {
  it('returns true only for NFT_* txTypes', () => {
    expect(
      isNftTransaction(makeTx({ txType: TransactionType.NFT_BUY, tokens: [] }))
    ).toBe(true)
    expect(
      isNftTransaction(makeTx({ txType: TransactionType.NFT_SEND, tokens: [] }))
    ).toBe(true)
    expect(
      isNftTransaction(
        makeTx({ txType: TransactionType.NFT_RECEIVE, tokens: [] })
      )
    ).toBe(true)
    expect(
      isNftTransaction(makeTx({ txType: TransactionType.SWAP, tokens: [] }))
    ).toBe(false)
  })
})

describe('isPotentiallySwap', () => {
  it('returns true when tx and token from/to addresses match', () => {
    const tx = makeTx({
      from: USER_ADDRESS,
      to: MARKETPLACE,
      tokens: [
        {
          type: TokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          amount: '1',
          from: { address: USER_ADDRESS },
          to: { address: MARKETPLACE }
        }
      ]
    })

    expect(isPotentiallySwap(tx)).toBe(true)
  })

  it('returns false when token transfer does not align with tx endpoints', () => {
    const tx = makeTx({
      from: USER_ADDRESS,
      to: MARKETPLACE,
      tokens: [
        {
          type: TokenType.ERC20,
          address: '0x123',
          name: 'Tok',
          symbol: 'TKN',
          amount: '1',
          from: { address: '0xother' },
          to: { address: USER_ADDRESS }
        }
      ]
    })

    expect(isPotentiallySwap(tx)).toBe(false)
  })
})
