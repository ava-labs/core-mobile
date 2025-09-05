import { createZustandStore } from 'common/utils/createZustandStore'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { create } from 'zustand'
import { LocalTokenWithBalance } from 'store/balance'
import { CryptoCurrency, CryptoCurrencyWithBalance } from './types'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  PaymentMethods,
  ServiceProviders
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
  btcToken?: LocalTokenWithBalance
}

type TokenIndexStore = {
  tokenIndex: TokenIndex | null
  setTokenIndex: (tokens: LocalTokenWithBalance[]) => void
  reset: () => void
}

const tokenIndexStore = create<TokenIndexStore>((set, get) => ({
  tokenIndex: null,
  setTokenIndex: tokens => {
    if (get().tokenIndex) return // already built, skip

    const nativeMap = new Map<string, LocalTokenWithBalance>()
    const erc20Map = new Map<string, LocalTokenWithBalance>()
    let btcToken: LocalTokenWithBalance | undefined

    for (const token of tokens) {
      if (token.type === 'NATIVE') {
        nativeMap.set(token.networkChainId.toString(), token)
      }
      if ('chainId' in token && token.address) {
        erc20Map.set(`${token.chainId}-${token.address.toLowerCase()}`, token)
      }
      if (token.symbol === 'BTC') {
        btcToken = token
      }
    }

    set({ tokenIndex: { nativeMap, erc20Map, btcToken } })
  },
  reset: () => set({ tokenIndex: null })
}))

export const useTokenIndex = (): TokenIndexStore => {
  return tokenIndexStore()
}

type SupportedCryptoCurrenciesStore = {
  supportedCryptoCurrencies: CryptoCurrencyWithBalance[]
  setSupportedCryptoCurrencies: (
    cryptos: CryptoCurrency[],
    tokenIndexes: TokenIndex
  ) => void
  reset: () => void
}

const supportedCryptoCurrenciesStore = create<SupportedCryptoCurrenciesStore>(
  (set, get) => ({
    supportedCryptoCurrencies: [],
    setSupportedCryptoCurrencies: (cryptos, tokenIndexes) => {
      if (get().supportedCryptoCurrencies.length > 0) return // already built, skip

      const result: CryptoCurrencyWithBalance[] = []

      for (const crypto of cryptos) {
        let match: LocalTokenWithBalance | undefined

        // Native token
        if (
          crypto.chainId &&
          crypto.contractAddress?.toLowerCase() ===
            NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS.toLowerCase()
        ) {
          match = tokenIndexes.nativeMap.get(crypto.chainId)
        }

        // ERC-20 token
        if (!match && crypto.contractAddress && crypto.chainId) {
          match = tokenIndexes.erc20Map.get(
            `${crypto.chainId}-${crypto.contractAddress.toLowerCase()}`
          )
        }

        // BTC
        if (!match && crypto.currencyCode === 'BTC') {
          match = tokenIndexes.btcToken
        }

        if (match) {
          result.push({
            ...crypto,
            tokenWithBalance: match
          })
        }
      }

      set({ supportedCryptoCurrencies: result })
    },
    reset: () => set({ supportedCryptoCurrencies: [] })
  })
)

export const useSupportedCryptoCurrencies =
  (): SupportedCryptoCurrenciesStore => {
    return supportedCryptoCurrenciesStore()
  }
