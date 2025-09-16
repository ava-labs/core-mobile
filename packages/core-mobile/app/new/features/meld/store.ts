import { createZustandStore } from 'common/utils/createZustandStore'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { create } from 'zustand'
import { ChainId } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { CryptoCurrency, CryptoCurrencyWithBalance } from './types'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  PaymentMethods,
  ServiceProviders,
  SOLANA_MELD_CHAIN_ID
} from './consts'

export const useMeldCountryCode = createZustandStore<string | undefined>(
  undefined
)

export const useMeldToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useMeldServiceProvider = createZustandStore<
  ServiceProviders | undefined
>(undefined)

export const useMeldPaymentMethod = createZustandStore<
  PaymentMethods | undefined
>(undefined)

export const useMeldFiatAmount = createZustandStore<number | undefined>(
  undefined
)

export const useMeldCryptoAmount = createZustandStore<TokenUnit | undefined>(
  undefined
)

export const offrampSessionIdStore = create<{
  sessionId: string | undefined
  setSessionId: (sessionId?: string) => void
}>(set => ({
  sessionId: undefined,
  setSessionId: (sessionId?: string) => set({ sessionId })
}))

export const useOfframpSessionId = (): {
  sessionId: string | undefined
  setSessionId: (sessionId?: string) => void
} => {
  return offrampSessionIdStore()
}

export const offrampActivityIndicatorStore = create<{
  animating: boolean
  setAnimating: (animating: boolean) => void
}>(set => ({
  animating: false,
  setAnimating: (animating: boolean) => set({ animating })
}))

export const useOfframpActivityIndicator = (): {
  animating: boolean
  setAnimating: (animating: boolean) => void
} => {
  return offrampActivityIndicatorStore()
}

type TokenIndex = {
  nativeMap: Map<string, LocalTokenWithBalance>
  erc20Map: Map<string, LocalTokenWithBalance>
}

type SplTokenIndex = {
  splMap: Map<string, LocalTokenWithBalance>
}

type TokenIndexStore = {
  tokenIndex: TokenIndex | null
  splTokenIndex: SplTokenIndex | null
  setTokenIndex: (tokens: LocalTokenWithBalance[]) => void
  setSplTokenIndex: (tokens: LocalTokenWithBalance[]) => void
  reset: () => void
}

const tokenIndexStore = create<TokenIndexStore>((set, get) => ({
  tokenIndex: null,
  splTokenIndex: null,
  setTokenIndex: tokens => {
    if (get().tokenIndex) return // already built, skip

    const nativeMap = new Map<string, LocalTokenWithBalance>()
    const erc20Map = new Map<string, LocalTokenWithBalance>()

    for (const token of tokens) {
      if (token.type === 'NATIVE') {
        nativeMap.set(token.networkChainId.toString(), token)
      }
      if ('chainId' in token && token.address) {
        erc20Map.set(`${token.chainId}-${token.address.toLowerCase()}`, token)
      }
    }

    set({ tokenIndex: { nativeMap, erc20Map } })
  },
  setSplTokenIndex: tokens => {
    if (get().splTokenIndex) return // already built, skip

    const splMap = new Map<string, LocalTokenWithBalance>()

    for (const token of tokens) {
      if (
        token.type === 'SPL' &&
        token.networkChainId === ChainId.SOLANA_MAINNET_ID
      ) {
        splMap.set(
          `${ChainId.SOLANA_MAINNET_ID}-${token.address.toLowerCase()}`,
          token
        )
      }
    }

    set({ splTokenIndex: { splMap } })
  },
  reset: () => set({ tokenIndex: null, splTokenIndex: null })
}))

export const useTokenIndex = (): TokenIndexStore => {
  return tokenIndexStore()
}

type SupportedCryptoCurrenciesStore = {
  supportedErc20AndNativeCryptoCurrencies: CryptoCurrencyWithBalance[]
  supportedSplCryptoCurrencies: CryptoCurrencyWithBalance[]
  setSupportedCryptoCurrencies: (
    cryptos: CryptoCurrency[],
    tokenIndexes: TokenIndex
  ) => void
  setSupportedSplCryptoCurrencies: (
    cryptos: CryptoCurrency[],
    tokenIndexes: SplTokenIndex
  ) => void
  reset: () => void
}

const supportedCryptoCurrenciesStore = create<SupportedCryptoCurrenciesStore>(
  (set, get) => ({
    supportedErc20AndNativeCryptoCurrencies: [],
    supportedSplCryptoCurrencies: [],
    setSupportedCryptoCurrencies: (cryptos, tokenIndexes) => {
      if (get().supportedErc20AndNativeCryptoCurrencies.length > 0) return // already built, skip

      const result: CryptoCurrencyWithBalance[] = []

      for (const crypto of cryptos) {
        let match: LocalTokenWithBalance | undefined

        // Native token
        if (crypto.currencyCode === 'BTC') {
          match = tokenIndexes.nativeMap.get(ChainId.BITCOIN.toString())
        }
        if (crypto.currencyCode === 'SOL') {
          match = tokenIndexes.nativeMap.get(
            ChainId.SOLANA_MAINNET_ID.toString()
          )
        }

        if (
          crypto.name === 'Ethereum' &&
          crypto.chainId &&
          crypto.contractAddress === NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS
        ) {
          match = tokenIndexes.nativeMap.get(crypto.chainId.toString())
        }

        // ERC-20 token
        if (!match && crypto.contractAddress && crypto.chainId) {
          match = tokenIndexes.erc20Map.get(
            `${crypto.chainId}-${crypto.contractAddress.toLowerCase()}`
          )
        }

        if (match) {
          result.push({
            ...crypto,
            tokenWithBalance: match
          })
        }
      }
      set({ supportedErc20AndNativeCryptoCurrencies: result })
    },
    setSupportedSplCryptoCurrencies: (cryptos, tokenIndexes) => {
      if (get().supportedSplCryptoCurrencies.length > 0) return // already built, skip

      const result: CryptoCurrencyWithBalance[] = []

      for (const crypto of cryptos) {
        let match: LocalTokenWithBalance | undefined

        // SPL token
        if (
          !match &&
          crypto.contractAddress &&
          crypto.chainId === SOLANA_MELD_CHAIN_ID.toString()
        ) {
          match = tokenIndexes.splMap.get(
            `${
              ChainId.SOLANA_MAINNET_ID
            }-${crypto.contractAddress.toLowerCase()}`
          )
        }

        if (match) {
          result.push({
            ...crypto,
            tokenWithBalance: match
          })
        }
      }

      set({ supportedSplCryptoCurrencies: result })
    },
    reset: () =>
      set({
        supportedErc20AndNativeCryptoCurrencies: [],
        supportedSplCryptoCurrencies: []
      })
  })
)

export const useSupportedCryptoCurrencies =
  (): SupportedCryptoCurrenciesStore => {
    return supportedCryptoCurrenciesStore()
  }
