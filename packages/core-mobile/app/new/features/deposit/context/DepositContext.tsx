import { Network } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useMemo,
  useState
} from 'react'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import { createPublicClient, http } from 'viem'
import { LocalTokenWithBalance } from 'store/balance'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { DefiAssetDetails, DefiMarket } from '../types'
import { useAvailableMarkets } from '../hooks/useAvailableMarkets'

interface DepositContextState {
  amount: TokenUnit | undefined
  setAmount: Dispatch<TokenUnit | undefined>
  network: Network | undefined
  resetAmount: () => void
  markets: DefiMarket[]
  isLoadingMarkets: boolean
  depositableTokens: DefiAssetDetails[]
  tokensWithBalance: LocalTokenWithBalance[]
}

export const DepositContext = createContext<DepositContextState>(
  {} as DepositContextState
)

export const DepositContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const [amount, setAmount] = useState<TokenUnit>()
  const cChainNetwork = useCChainNetwork()
  const networkClient = useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }

    const cChain = getViemChain(cChainNetwork)

    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])
  const activeAccount = useSelector(selectActiveAccount)
  const tokensWithBalance = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    cChainNetwork?.chainId
  )
  const { data: markets, isPending: isLoadingMarkets } = useAvailableMarkets({
    network: cChainNetwork,
    networkClient,
    tokensWithBalance
  })

  const resetAmount = (): void => {
    setAmount(undefined)
  }

  const depositableTokens = useMemo(() => {
    const uniqueAssets = new Map<string, DefiAssetDetails>()

    markets.forEach(market => {
      const asset = market.asset
      // Use contractAddress if available, otherwise use lowercase symbol
      const key = asset.contractAddress ?? asset.symbol.toLowerCase()

      // Only add if not already in map (keeps first occurrence)
      if (!uniqueAssets.has(key)) {
        uniqueAssets.set(key, asset)
      }
    })

    return Array.from(uniqueAssets.values()).sort((a, b) => {
      if (a.symbol.toLowerCase() === 'avax') return -1
      if (b.symbol.toLowerCase() === 'avax') return 1

      if (
        a.underlyingTokenBalance?.balanceInCurrency &&
        b.underlyingTokenBalance?.balanceInCurrency
      ) {
        return (
          b.underlyingTokenBalance.balanceInCurrency -
          a.underlyingTokenBalance.balanceInCurrency
        )
      }
      if (a.underlyingTokenBalance?.balanceInCurrency) return -1
      if (b.underlyingTokenBalance?.balanceInCurrency) return 1

      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase())
    })
  }, [markets])

  const state: DepositContextState = {
    amount,
    setAmount,
    resetAmount,
    network: cChainNetwork,
    markets,
    isLoadingMarkets,
    depositableTokens,
    tokensWithBalance
  }
  return (
    <DepositContext.Provider value={state}>{children}</DepositContext.Provider>
  )
}

export function useDepositContext(): DepositContextState {
  return useContext(DepositContext)
}
