import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { TokenType, TransactionType, TxToken } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { Transaction } from 'store/transaction'
import {
  findNftToken,
  findPaymentToken,
  getNftLabel,
  isCollectibleTransaction,
  isInputOnlyContractCall,
  isNftTransaction,
  isPaymentTokenType,
  isPotentiallySwap,
  resolvePaymentSymbol,
  resolveTxUserAddress,
  resolveUserIsRecipient,
  selectSwapTokens,
  transactionInvolvesTokenSymbol
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

describe('isPaymentTokenType', () => {
  it('accepts NATIVE and ERC20 as payment legs', () => {
    expect(isPaymentTokenType({ type: TokenType.NATIVE } as TxToken)).toBe(true)
    expect(isPaymentTokenType({ type: TokenType.ERC20 } as TxToken)).toBe(true)
  })

  it('rejects ERC721/ERC1155 and undefined', () => {
    expect(isPaymentTokenType({ type: TokenType.ERC721 } as TxToken)).toBe(
      false
    )
    expect(isPaymentTokenType({ type: TokenType.ERC1155 } as TxToken)).toBe(
      false
    )
    expect(isPaymentTokenType(undefined)).toBe(false)
  })
})

describe('resolvePaymentSymbol', () => {
  it('returns the token symbol when present', () => {
    const token = {
      type: TokenType.ERC20,
      symbol: 'USDC',
      name: 'USDC',
      amount: '5'
    } as TxToken
    expect(resolvePaymentSymbol(token, 'AVAX')).toBe('USDC')
  })

  it('falls back to the network token symbol for NATIVE legs without a symbol', () => {
    const token = {
      type: TokenType.NATIVE,
      symbol: '',
      name: '',
      amount: '1'
    } as TxToken
    expect(resolvePaymentSymbol(token, 'AVAX')).toBe('AVAX')
  })

  it('falls back to the token type as a last resort', () => {
    const token = {
      type: TokenType.ERC20,
      symbol: '',
      name: '',
      amount: '1'
    } as TxToken
    expect(resolvePaymentSymbol(token, undefined)).toBe(TokenType.ERC20)
  })
})

const buildAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    addressC: USER_ADDRESS,
    addressBTC: '',
    addressAVM: '',
    addressPVM: '',
    addressSVM: '',
    ...overrides
  } as unknown as Account)

describe('resolveUserIsRecipient', () => {
  it('returns true when the NFT lands at the user address', () => {
    const nftToken = {
      type: TokenType.ERC721,
      from: { address: MARKETPLACE },
      to: { address: USER_ADDRESS }
    } as TxToken
    const tx = makeTx({ tokens: [nftToken] })

    expect(
      resolveUserIsRecipient({
        nftToken,
        userAddressLower: USER_ADDRESS.toLowerCase(),
        transaction: tx,
        account: buildAccount()
      })
    ).toBe(true)
  })

  it('returns false when the NFT leaves the user address', () => {
    const nftToken = {
      type: TokenType.ERC721,
      from: { address: USER_ADDRESS },
      to: { address: MARKETPLACE }
    } as TxToken
    const tx = makeTx({ tokens: [nftToken] })

    expect(
      resolveUserIsRecipient({
        nftToken,
        userAddressLower: USER_ADDRESS.toLowerCase(),
        transaction: tx,
        account: buildAccount()
      })
    ).toBe(false)
  })

  it('falls back to tx-level isSender flag when the NFT leg has no addresses', () => {
    const nftToken = { type: TokenType.ERC721 } as TxToken
    const tx = makeTx({ tokens: [nftToken], isSender: true })

    expect(
      resolveUserIsRecipient({
        nftToken,
        userAddressLower: USER_ADDRESS.toLowerCase(),
        transaction: tx,
        account: buildAccount()
      })
    ).toBe(false)
  })

  it('falls back to account-derived sender check when nftToken is undefined', () => {
    const tx = makeTx({ tokens: [], from: USER_ADDRESS })

    expect(
      resolveUserIsRecipient({
        nftToken: undefined,
        userAddressLower: USER_ADDRESS.toLowerCase(),
        transaction: tx,
        account: buildAccount({ addressC: USER_ADDRESS })
      })
    ).toBe(false)
  })
})

describe('findPaymentToken', () => {
  const userLower = USER_ADDRESS.toLowerCase()

  it('returns the directional payment token when the user is the buyer', () => {
    const payment = {
      type: TokenType.NATIVE,
      symbol: 'AVAX',
      amount: '0.075',
      from: { address: USER_ADDRESS },
      to: { address: MARKETPLACE }
    } as TxToken
    const nft = {
      type: TokenType.ERC721,
      from: { address: MARKETPLACE },
      to: { address: USER_ADDRESS }
    } as TxToken

    expect(findPaymentToken([payment, nft], true, userLower)).toBe(payment)
  })

  it('returns the directional payment token when the user is the seller', () => {
    const payment = {
      type: TokenType.ERC20,
      symbol: 'USDC',
      amount: '20',
      from: { address: MARKETPLACE },
      to: { address: USER_ADDRESS }
    } as TxToken
    const nft = {
      type: TokenType.ERC721,
      from: { address: USER_ADDRESS },
      to: { address: MARKETPLACE }
    } as TxToken

    expect(findPaymentToken([payment, nft], false, userLower)).toBe(payment)
  })

  it('falls back to a single payment token when direction info is missing', () => {
    const payment = {
      type: TokenType.NATIVE,
      symbol: 'AVAX',
      amount: '1'
    } as TxToken
    const nft = { type: TokenType.ERC721 } as TxToken

    expect(findPaymentToken([payment, nft], true, userLower)).toBe(payment)
  })

  it('does NOT fall back when multiple payment legs are ambiguous', () => {
    const payment1 = {
      type: TokenType.NATIVE,
      symbol: 'AVAX',
      amount: '1'
    } as TxToken
    const payment2 = {
      type: TokenType.ERC20,
      symbol: 'USDC',
      amount: '10'
    } as TxToken

    expect(
      findPaymentToken([payment1, payment2], true, userLower)
    ).toBeUndefined()
  })

  it('returns undefined when no NATIVE/ERC20 leg exists', () => {
    const nft = { type: TokenType.ERC721 } as TxToken
    expect(findPaymentToken([nft], true, userLower)).toBeUndefined()
  })
})

describe('getNftLabel', () => {
  it('combines name and symbol when distinct', () => {
    expect(
      getNftLabel({
        type: TokenType.ERC721,
        name: 'Cool NFT',
        symbol: 'COOL'
      } as TxToken)
    ).toBe('Cool NFT (COOL)')
  })

  it('avoids redundant "Name (SYMBOL)" when they match (case-insensitive)', () => {
    expect(
      getNftLabel({
        type: TokenType.ERC1155,
        name: 'AvaxApes',
        symbol: 'avaxapes'
      } as TxToken)
    ).toBe('AvaxApes')
  })

  it('returns the symbol alone when name is missing', () => {
    expect(
      getNftLabel({
        type: TokenType.ERC721,
        name: '',
        symbol: 'COOL'
      } as TxToken)
    ).toBe('COOL')
  })

  it('returns the name alone when symbol is missing', () => {
    expect(
      getNftLabel({
        type: TokenType.ERC721,
        name: 'Cool NFT',
        symbol: ''
      } as TxToken)
    ).toBe('Cool NFT')
  })

  it('falls back to "NFT" when both name and symbol are missing', () => {
    expect(
      getNftLabel({ type: TokenType.ERC721, name: '', symbol: '' } as TxToken)
    ).toBe('NFT')
    expect(getNftLabel(undefined)).toBe('NFT')
  })
})

describe('selectSwapTokens', () => {
  const ROUTER = '0xRouter'
  const POOL = '0xPool'

  const usdc = (from: string, to: string): TxToken => ({
    type: TokenType.ERC20,
    address: '0xUSDC',
    name: 'USD Coin',
    symbol: 'USDC',
    amount: '1',
    from: { address: from },
    to: { address: to }
  })

  const usdt = (from: string, to: string): TxToken => ({
    type: TokenType.ERC20,
    address: '0xUSDT',
    name: 'TetherToken',
    symbol: 'USDT',
    amount: '0.9914',
    from: { address: from },
    to: { address: to }
  })

  const avax = (from: string, to: string): TxToken => ({
    type: TokenType.NATIVE,
    name: 'Avalanche',
    symbol: 'AVAX',
    amount: '0.05',
    from: { address: from },
    to: { address: to }
  })

  it('prefers the ERC-20 input leg over a native fee leg (recurring-swap fill)', () => {
    // Recurring USDC→USDT fill: the user sends BOTH a 0.05 AVAX native fee leg
    // and the 1 USDC swap input; the native leg must not be chosen as the input.
    const tokens = [
      avax(USER_ADDRESS, ROUTER),
      usdt(POOL, USER_ADDRESS),
      usdc(USER_ADDRESS, ROUTER)
    ]

    const { inputToken, outputToken } = selectSwapTokens(tokens, USER_ADDRESS)

    expect(inputToken?.symbol).toBe('USDC')
    expect(inputToken?.amount).toBe('1')
    expect(outputToken?.symbol).toBe('USDT')
  })

  it('keeps the native leg as input for a genuine native-input swap', () => {
    // AVAX→USDT: the only leg from the user is native, so it IS the input.
    const tokens = [avax(USER_ADDRESS, ROUTER), usdt(POOL, USER_ADDRESS)]

    const { inputToken, outputToken } = selectSwapTokens(tokens, USER_ADDRESS)

    expect(inputToken?.symbol).toBe('AVAX')
    expect(outputToken?.symbol).toBe('USDT')
  })

  it('resolves a plain ERC-20 → ERC-20 swap', () => {
    const tokens = [usdc(USER_ADDRESS, ROUTER), usdt(POOL, USER_ADDRESS)]

    const { inputToken, outputToken } = selectSwapTokens(tokens, USER_ADDRESS)

    expect(inputToken?.symbol).toBe('USDC')
    expect(outputToken?.symbol).toBe('USDT')
  })

  it('returns input with no output when the destination leg is not to the user (cross-chain)', () => {
    const tokens = [usdc(USER_ADDRESS, ROUTER)]

    const { inputToken, outputToken } = selectSwapTokens(tokens, USER_ADDRESS)

    expect(inputToken?.symbol).toBe('USDC')
    expect(outputToken).toBeUndefined()
  })

  it('returns undefined for both when no leg involves the user', () => {
    const tokens = [usdc(POOL, ROUTER), usdt(POOL, ROUTER)]

    const { inputToken, outputToken } = selectSwapTokens(tokens, USER_ADDRESS)

    expect(inputToken).toBeUndefined()
    expect(outputToken).toBeUndefined()
  })
})

describe('isInputOnlyContractCall', () => {
  const ROUTER = '0xRouter'
  const POOL = '0xPool'

  const leg = (from: string, to: string): TxToken =>
    ({
      type: TokenType.ERC20,
      symbol: 'USDC',
      amount: '1',
      from: { address: from },
      to: { address: to }
    } as TxToken)

  it('is true when a leg leaves the user with nothing coming back', () => {
    // e.g. an ERC-20 approval or a cross-chain swap output on another chain
    expect(
      isInputOnlyContractCall([leg(USER_ADDRESS, ROUTER)], USER_ADDRESS)
    ).toBe(true)
  })

  it('is false for a genuine swap with an output leg back to the user', () => {
    expect(
      isInputOnlyContractCall(
        [leg(USER_ADDRESS, ROUTER), leg(POOL, USER_ADDRESS)],
        USER_ADDRESS
      )
    ).toBe(false)
  })

  it('is false when no leg involves the user', () => {
    expect(isInputOnlyContractCall([leg(POOL, ROUTER)], USER_ADDRESS)).toBe(
      false
    )
  })

  it('is false when the user address is unknown', () => {
    expect(
      isInputOnlyContractCall([leg(USER_ADDRESS, ROUTER)], undefined)
    ).toBe(false)
  })
})

describe('resolveTxUserAddress', () => {
  const account = { addressC: '0xEvmAddress' } as Account
  const evmNetwork = { vmName: NetworkVMType.EVM } as Network

  it('returns the per-network account address when account and network resolve', () => {
    const tx = makeTx({ tokens: [], from: '0xTxFrom' })
    expect(resolveTxUserAddress(tx, account, evmNetwork)).toBe('0xEvmAddress')
  })

  it('falls back to tx.from when the network is missing', () => {
    const tx = makeTx({ tokens: [], from: '0xTxFrom' })
    expect(resolveTxUserAddress(tx, account, undefined)).toBe('0xTxFrom')
  })

  it('falls back to tx.from when the account is missing', () => {
    const tx = makeTx({ tokens: [], from: '0xTxFrom' })
    expect(resolveTxUserAddress(tx, undefined, evmNetwork)).toBe('0xTxFrom')
  })
})

describe('transactionInvolvesTokenSymbol', () => {
  const ROUTER = '0xRouter'
  const POOL = '0xPool'

  const leg = (
    from: string,
    to: string,
    overrides: Partial<TxToken>
  ): TxToken =>
    ({
      type: TokenType.ERC20,
      amount: '1',
      from: { address: from },
      to: { address: to },
      ...overrides
    } as TxToken)

  const avaxFee = (from: string, to: string): TxToken =>
    leg(from, to, { type: TokenType.NATIVE, symbol: 'AVAX', amount: '0.05' })

  const wavax = (from: string, to: string): TxToken =>
    leg(from, to, { address: '0xWAVAX', symbol: 'WAVAX', amount: '0.01' })

  const pepe = (from: string, to: string): TxToken =>
    leg(from, to, { address: '0xPEPE', symbol: 'PEPE', amount: '26000' })

  // A recurring/DCA fill of WAVAX→PEPE: the native AVAX carries only the
  // protocol/gas fee, WAVAX is the real swap input, PEPE the output.
  const dcaFill = [
    avaxFee(USER_ADDRESS, ROUTER),
    wavax(USER_ADDRESS, ROUTER),
    pepe(POOL, USER_ADDRESS)
  ]

  it('files a recurring fill under its ERC-20 input (WAVAX) screen', () => {
    expect(
      transactionInvolvesTokenSymbol({
        tokens: dcaFill,
        tokenSymbol: 'WAVAX',
        userAddress: USER_ADDRESS,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
  })

  it('files a recurring fill under its output (PEPE) screen', () => {
    expect(
      transactionInvolvesTokenSymbol({
        tokens: dcaFill,
        tokenSymbol: 'PEPE',
        userAddress: USER_ADDRESS,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
  })

  it('does NOT file a recurring fill under the native AVAX screen (fee leg only)', () => {
    // The native leg is just the fee — matching the title, which reads
    // "WAVAX swapped for PEPE", the row must not appear on the AVAX screen.
    expect(
      transactionInvolvesTokenSymbol({
        tokens: dcaFill,
        tokenSymbol: 'AVAX',
        userAddress: USER_ADDRESS,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(false)
  })

  it('finds the ERC-20 leg even when it is ordered after the first two legs', () => {
    // WAVAX at index 2 — the old positional match (tokens[0]/tokens[1]) missed it.
    const reordered = [
      avaxFee(USER_ADDRESS, ROUTER),
      pepe(POOL, USER_ADDRESS),
      wavax(USER_ADDRESS, ROUTER)
    ]
    expect(
      transactionInvolvesTokenSymbol({
        tokens: reordered,
        tokenSymbol: 'WAVAX',
        userAddress: USER_ADDRESS,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
  })

  it('keeps a genuine native-input swap (AVAX→WAVAX) on the AVAX screen', () => {
    const nativeSwap = [
      avaxFee(USER_ADDRESS, ROUTER),
      wavax(POOL, USER_ADDRESS)
    ]
    expect(
      transactionInvolvesTokenSymbol({
        tokens: nativeSwap,
        tokenSymbol: 'AVAX',
        userAddress: USER_ADDRESS,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
  })

  it('resolves an empty native symbol via the network token symbol', () => {
    const nativeSend: TxToken[] = [
      {
        type: TokenType.NATIVE,
        symbol: '',
        amount: '1',
        from: { address: USER_ADDRESS },
        to: { address: ROUTER }
      } as TxToken
    ]
    expect(
      transactionInvolvesTokenSymbol({
        tokens: nativeSend,
        tokenSymbol: 'AVAX',
        userAddress: USER_ADDRESS,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
  })

  it('falls back to positional symbol match when the user address is unknown', () => {
    const tokens = [wavax(POOL, ROUTER), pepe(ROUTER, POOL)]
    expect(
      transactionInvolvesTokenSymbol({
        tokens,
        tokenSymbol: 'WAVAX',
        userAddress: undefined,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
    expect(
      transactionInvolvesTokenSymbol({
        tokens,
        tokenSymbol: 'PEPE',
        userAddress: undefined,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(true)
  })

  it('does not match an unrelated token via the positional fallback', () => {
    const tokens = [wavax(POOL, ROUTER), pepe(ROUTER, POOL)]
    expect(
      transactionInvolvesTokenSymbol({
        tokens,
        tokenSymbol: 'USDC',
        userAddress: undefined,
        networkTokenSymbol: 'AVAX'
      })
    ).toBe(false)
  })
})
