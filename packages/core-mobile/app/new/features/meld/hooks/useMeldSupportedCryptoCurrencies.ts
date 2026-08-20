import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  SOLANA_MELD_CHAIN_ID,
  ServiceProviderCategories
} from '../consts'
import { CryptoCurrency, CryptoCurrencyWithBalance } from '../types'
import {
  asZeroBalanceToken,
  meldContractTokenKey,
  meldCurrencyTokenKey,
  MeldListFilterOptions,
  passesMeldListFilters
} from '../utils'
import { useMeldContractTokenMap } from './useMeldContractTokenMap'

// Stable identity so an absent currency list doesn't churn the lookup memos
// downstream on every render.
const NO_CURRENCIES: CryptoCurrency[] = []

type HeldTokenMaps = {
  heldNativeMap: Map<string, LocalTokenWithBalance>
  heldTokenMap: Map<string, LocalTokenWithBalance>
}

const buildHeldTokenMaps = (
  tokensWithBalance: LocalTokenWithBalance[],
  filterOptions: MeldListFilterOptions
): HeldTokenMaps => {
  const heldNativeMap = new Map<string, LocalTokenWithBalance>()
  const heldTokenMap = new Map<string, LocalTokenWithBalance>()

  for (const token of tokensWithBalance) {
    if (!passesMeldListFilters(token, filterOptions)) continue
    if (token.type === TokenType.NATIVE) {
      heldNativeMap.set(token.networkChainId.toString(), token)
    }
    if ('chainId' in token && token.chainId && token.address) {
      heldTokenMap.set(
        meldContractTokenKey(token.chainId, token.address),
        token
      )
    }
    // Held SPL tokens carry only networkChainId — the balance mapper omits
    // chainId for the spl branch — so they need their own keying to be
    // findable under the SOLANA_MAINNET_ID-based lookup key.
    if (
      token.type === TokenType.SPL &&
      token.networkChainId === ChainId.SOLANA_MAINNET_ID &&
      token.address
    ) {
      heldTokenMap.set(
        meldContractTokenKey(ChainId.SOLANA_MAINNET_ID, token.address),
        token
      )
    }
  }

  return { heldNativeMap, heldTokenMap }
}

const resolveTokenWithBalance = ({
  crypto,
  heldNativeMap,
  heldTokenMap,
  contractTokenMap,
  filterOptions
}: HeldTokenMaps & {
  crypto: CryptoCurrency
  contractTokenMap: Map<string, NetworkContractToken>
  filterOptions: MeldListFilterOptions
}): LocalTokenWithBalance | undefined => {
  if (crypto.currencyCode === 'BTC') {
    return heldNativeMap.get(ChainId.BITCOIN.toString())
  }
  if (crypto.currencyCode === 'SOL') {
    return heldNativeMap.get(ChainId.SOLANA_MAINNET_ID.toString())
  }
  if (
    crypto.chainId &&
    crypto.contractAddress === NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS
  ) {
    return heldNativeMap.get(crypto.chainId.toString())
  }

  const key = meldCurrencyTokenKey(crypto)
  if (key === undefined) return undefined

  const held = heldTokenMap.get(key)
  if (held) return held

  if (!filterOptions.includeZeroBalance) return undefined

  const contractToken = contractTokenMap.get(key)
  if (contractToken) {
    const stub = asZeroBalanceToken(contractToken)
    return passesMeldListFilters(stub, filterOptions) ? stub : undefined
  }
  return undefined
}

/**
 * Joins Meld's supported crypto currencies (~dozens) against the account's
 * tokens. Deliberately joins FROM the currency side rather than indexing the
 * ~57k contract tokens per balance update, which stalls the buy flow on every
 * balance tick. The contract-token map is memoized on the stable
 * contract-token query arrays, so balance updates only rebuild the small
 * held-token maps.
 */
export const useMeldSupportedCryptoCurrencies = ({
  category,
  cryptoCurrencies
}: {
  category: ServiceProviderCategories
  cryptoCurrencies?: CryptoCurrency[]
}): CryptoCurrencyWithBalance[] => {
  const account = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const tokensWithBalance = useTokensWithBalanceForAccount({ account })
  const contractTokenMap = useMeldContractTokenMap(
    cryptoCurrencies ?? NO_CURRENCIES
  )
  const includeZeroBalance =
    category === ServiceProviderCategories.CRYPTO_ONRAMP

  return useMemo(() => {
    if (cryptoCurrencies === undefined) return []

    const filterOptions: MeldListFilterOptions = {
      includeZeroBalance,
      tokenVisibility,
      enabledChainIds
    }
    const heldTokenMaps = buildHeldTokenMaps(tokensWithBalance, filterOptions)

    // erc20/native results come before SPL: the balance sort downstream is
    // stable for zero-balance ties, so this pass order fixes their display
    // order.
    const erc20AndNative: CryptoCurrencyWithBalance[] = []
    const spl: CryptoCurrencyWithBalance[] = []
    for (const crypto of cryptoCurrencies) {
      const match = resolveTokenWithBalance({
        crypto,
        ...heldTokenMaps,
        contractTokenMap,
        filterOptions
      })
      if (match) {
        const isSpl = crypto.chainId === SOLANA_MELD_CHAIN_ID.toString()
        ;(isSpl ? spl : erc20AndNative).push({
          ...crypto,
          tokenWithBalance: match
        })
      }
    }
    return [...erc20AndNative, ...spl]
  }, [
    cryptoCurrencies,
    tokensWithBalance,
    contractTokenMap,
    tokenVisibility,
    enabledChainIds,
    includeZeroBalance
  ])
}
