import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Account } from 'store/account'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import {
  AvalancheBalanceItem,
  AvmGetBalancesResponse,
  BtcGetBalancesResponse,
  Erc20TokenBalance,
  EvmGetBalancesResponse,
  GetBalancesResponse,
  NativeTokenBalance,
  PvmGetBalancesResponse,
  SvmGetBalancesResponse
} from 'utils/apiClient/generated/balanceApi.client'
import { TokenType } from '@avalabs/vm-module-types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { AVAX_P_ID, AVAX_X_ID } from '../const'
import {
  AdjustedLocalTokenWithBalance,
  AdjustedNormalizedBalancesForAccount
} from '../types'

const isAvaxAssetId = (id: string): boolean =>
  id === Avalanche.MainnetContext.avaxAssetID ||
  id === Avalanche.FujiContext.avaxAssetID

type SvmTokenBalance =
  SvmGetBalancesResponse['balances']['splTokenBalances'][number]

type AvmTokenBalance = NativeTokenBalance & {
  networkType: 'avm'
  categories: AvmGetBalancesResponse['balances']['categories']
}

type PvmTokenBalance = NativeTokenBalance & {
  networkType: 'pvm'
  categories: PvmGetBalancesResponse['balances']['categories']
}

type BackendTokenBalance =
  | NativeTokenBalance
  | Erc20TokenBalance
  | BtcGetBalancesResponse['balances']['nativeTokenBalance']
  | SvmTokenBalance
  | AvmTokenBalance
  | PvmTokenBalance

// helper function to map asset to utxos object
const assetToUtxos = (
  asset: AvalancheBalanceItem
): {
  assetId: string
  name: string
  symbol: string
  amount: string
  denomination: number
} => ({
  assetId: asset.assetId,
  name: asset.name,
  symbol: asset.symbol,
  amount: asset.balance,
  denomination: asset.decimals
})

const addBtcFields = (
  token: BackendTokenBalance
): {
  unconfirmedBalance: bigint | undefined
  unconfirmedBalanceDisplayValue: string | undefined
  unconfirmedBalanceInCurrency: number | undefined
  unconfirmedBalanceCurrencyDisplayValue: string | undefined
  utxos: []
  utxosUnconfirmed: []
} => {
  let unconfirmedBalance: TokenUnit | undefined

  if ('unconfirmedBalance' in token) {
    unconfirmedBalance = new TokenUnit(
      token.unconfirmedBalance,
      token.decimals,
      token.symbol
    )
  }

  const unconfirmedBalanceInCurrency =
    token.price !== undefined && unconfirmedBalance !== undefined
      ? unconfirmedBalance.mul(token.price)
      : undefined

  return {
    unconfirmedBalance: unconfirmedBalance?.toSubUnit(),
    unconfirmedBalanceDisplayValue: unconfirmedBalance?.toDisplay(),
    unconfirmedBalanceInCurrency: unconfirmedBalanceInCurrency?.toDisplay({
      fixedDp: 2,
      asNumber: true
    }),
    unconfirmedBalanceCurrencyDisplayValue:
      unconfirmedBalanceInCurrency?.toDisplay({ fixedDp: 2 }),
    utxos: [],
    utxosUnconfirmed: []
  }
}

const addAvmFields = (
  token: AvmTokenBalance
): {
  available: bigint
  availableInCurrency: number | undefined
  utxos: {
    unlocked: {
      assetId: string
      name: string
      symbol: string
      amount: string
      denomination: number
    }[]
    locked: {
      assetId: string
      name: string
      symbol: string
      amount: string
      denomination: number
    }[]
    atomicMemoryUnlocked: {
      assetId: string
      name: string
      symbol: string
      amount: string
      denomination: number
    }[]
  }
  balancePerType: {
    unlocked: bigint
    locked: bigint
    atomicMemoryUnlocked: bigint
    atomicMemoryLocked: bigint
  }
} => {
  const categories = token.categories

  const utxos = {
    unlocked: [...categories.unlocked.map(assetToUtxos)],
    locked: [...categories.locked.map(assetToUtxos)],
    atomicMemoryUnlocked: [
      ...Object.values(categories.atomicMemoryUnlocked ?? {})
        .flat()
        .map(assetToUtxos)
    ],
    atomicMemoryLocked: [
      ...Object.values(categories.atomicMemoryLocked ?? {})
        .flat()
        .map(assetToUtxos)
    ]
  }

  const balancePerType = {
    unlocked: categories.unlocked
      .filter(asset => isAvaxAssetId(asset.assetId))
      .reduce((acc, current) => acc + BigInt(current.balance), 0n),
    locked: categories.locked
      .filter(asset => isAvaxAssetId(asset.assetId))
      .reduce((acc, current) => acc + BigInt(current.balance), 0n),
    atomicMemoryUnlocked: Object.values(categories.atomicMemoryUnlocked)
      .flat()
      .filter(asset => isAvaxAssetId(asset.assetId))
      .reduce((acc, current) => acc + BigInt(current.balance), 0n),
    atomicMemoryLocked: Object.values(token.categories.atomicMemoryLocked ?? {})
      .flat()
      .filter(asset => isAvaxAssetId(asset.assetId))
      .reduce((acc, current) => acc + BigInt(current.balance), 0n)
  }

  const available = balancePerType.unlocked

  const availableInCurrency = token.price
    ? new TokenUnit(available, token.decimals, token.symbol)
        .mul(token.price)
        .toDisplay({ fixedDp: 2, asNumber: true })
    : undefined

  return {
    available: available,
    availableInCurrency,
    utxos,
    balancePerType
  }
}

const addPvmFields = (
  token: PvmTokenBalance
): {
  available: bigint
  availableInCurrency: number | undefined
  balancePerType: {
    lockedStaked: bigint
    lockedStakeable: bigint
    lockedPlatform: bigint
    atomicMemoryLocked: bigint
    atomicMemoryUnlocked: bigint
    unlockedUnstaked: bigint
    unlockedStaked: bigint
  }
} => {
  const categories = token.categories

  const balancePerType = {
    lockedStaked: BigInt(categories.lockedStaked),
    lockedStakeable: BigInt(categories.lockedStakeable),
    lockedPlatform: BigInt(categories.lockedPlatform),
    atomicMemoryLocked: Object.values(categories.atomicMemoryLocked).reduce(
      (acc, current) => acc + BigInt(current),
      0n
    ),
    atomicMemoryUnlocked: Object.values(categories.atomicMemoryUnlocked).reduce(
      (acc, current) => acc + BigInt(current),
      0n
    ),
    unlockedUnstaked: BigInt(categories.unlockedUnstaked),
    unlockedStaked: BigInt(categories.unlockedStaked)
  }

  const available = balancePerType.unlockedUnstaked

  const availableInCurrency = token.price
    ? new TokenUnit(available, token.decimals, token.symbol)
        .mul(token.price)
        .toDisplay({ fixedDp: 2, asNumber: true })
    : undefined

  return {
    available: available,
    availableInCurrency,
    balancePerType
  }
}

export const getLocalTokenId = (token: BackendTokenBalance): string => {
  switch (token.type) {
    case 'native':
      return `NATIVE-${token.symbol}`
    case 'erc20':
    case 'spl':
      return token.address
    default:
      return ''
  }
}

const getTokenType = (
  token: BackendTokenBalance
): TokenType.NATIVE | TokenType.ERC20 | TokenType.SPL | null => {
  if (token.type === 'native') return TokenType.NATIVE
  if (token.type === 'erc20') return TokenType.ERC20
  if (token.type === 'spl') return TokenType.SPL
  return null
}

export const mapBalanceResponseToLegacy = (
  account: Account,
  response: GetBalancesResponse
  // eslint-disable-next-line sonarjs/cognitive-complexity
): AdjustedNormalizedBalancesForAccount | null => {
  // TODO: handle error in balance response
  if ('error' in response && response.error !== null) {
    if (!('caip2Id' in response)) {
      return null
    }

    // const chainId = getChainIdFromCaip2(response.caip2Id)
    // if (chainId === undefined) return null

    // return {
    //   accountId: account.id,
    //   chainId,
    //   accountAddress: '', // unknown
    //   dataAccurate: false,
    //   error: { error: response.error },
    //   tokens: []
    // }

    return null
  }

  // STEP 1 — normalize chainId + determine correct address
  const chainId = getChainIdFromCaip2(response.caip2Id)
  if (chainId === undefined) return null

  let tokens: Array<BackendTokenBalance> = []

  switch (response.networkType) {
    case 'evm': {
      const evm = response as EvmGetBalancesResponse
      tokens = [
        evm.balances.nativeTokenBalance,
        ...(evm.balances.erc20TokenBalances ?? [])
      ]
      break
    }

    case 'btc': {
      const btc = response as BtcGetBalancesResponse
      tokens = [btc.balances.nativeTokenBalance]
      break
    }

    case 'svm': {
      const svm = response as SvmGetBalancesResponse
      tokens = [
        svm.balances.nativeTokenBalance,
        ...(svm.balances.splTokenBalances ?? [])
      ]
      break
    }

    case 'avm': {
      const avm = response as AvmGetBalancesResponse

      tokens = [
        {
          ...avm.balances.nativeTokenBalance,
          categories: avm.balances.categories,
          networkType: 'avm'
        }
      ]
      break
    }

    case 'pvm': {
      const pvm = response as PvmGetBalancesResponse
      tokens = [
        {
          ...pvm.balances.nativeTokenBalance,
          categories: pvm.balances.categories,
          networkType: 'pvm'
        }
      ]
      break
    }

    default:
      return null
  }

  // STEP 2 — Legacy transformation for each token
  const legacyTokens: AdjustedLocalTokenWithBalance[] = tokens
    .map(token => {
      const decimals = token.decimals ?? 0

      const localId =
        response.networkType === 'pvm'
          ? AVAX_P_ID
          : response.networkType === 'avm'
          ? AVAX_X_ID
          : getLocalTokenId(token)

      const tokenType = getTokenType(token)

      if (tokenType === null) return null

      const balanceInCurrency =
        token.price !== undefined
          ? new TokenUnit(token.balance, token.decimals, token.symbol).mul(
              token.price
            )
          : undefined

      return {
        // ------------- Identifiers -------------
        localId,
        networkChainId: chainId,

        // ------------- Basic meta -------------
        name: token.name,
        symbol: token.symbol,
        decimals,
        type: tokenType,
        logoUri: token.logoUri ?? '',
        internalId: token.internalId,

        // ------------- Balances -------------
        balance: BigInt(token.balance ?? '0'),
        balanceDisplayValue: new TokenUnit(
          token.balance,
          token.decimals,
          token.symbol
        ).toDisplay(),
        balanceInCurrency: balanceInCurrency?.toDisplay({
          fixedDp: 2,
          asNumber: true
        }),
        balanceCurrencyDisplayValue: balanceInCurrency?.toDisplay({
          fixedDp: 2
        }),

        // ------------- Price info -------------
        priceInCurrency: token.price,
        change24: token.priceChangePercentage24h,

        // ------------- Accuracy -------------
        isDataAccurate: true,

        // ------------- ERC20 Only -------------
        ...(token.type === 'erc20'
          ? {
              address: token.address,
              chainId: chainId,
              reputation: token.scanResult
            }
          : {}),

        // ------------- SPL Only -------------
        ...(token.type === 'spl'
          ? {
              address: token.address,
              reputation: token.scanResult
            }
          : {}),

        // ------------- BTC Only -------------
        ...(response.networkType === 'btc' && addBtcFields(token)),

        // ------------- AVM Only -------------
        ...('networkType' in token &&
          token.networkType === 'avm' &&
          addAvmFields(token)),

        // ------------- AVM Only -------------
        ...('networkType' in token &&
          token.networkType === 'pvm' &&
          addPvmFields(token))
      }
    })
    .filter(token => token !== null)

  // STEP 3 — return final legacy object
  return {
    accountId: account.id,
    chainId,
    tokens: legacyTokens,
    dataAccurate: true,
    error: null
  }
}
