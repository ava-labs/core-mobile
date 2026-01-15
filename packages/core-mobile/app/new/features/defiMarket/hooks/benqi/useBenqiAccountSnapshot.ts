import { QueryObserverResult, skipToken, useQuery } from '@tanstack/react-query'
import { readContract } from 'viem/actions'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { PublicClient, Address } from 'viem'
import { BENQI_LENS_ABI } from 'features/defiMarket/abis/benqiLens'
import { BENQI_LENS_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export type BenqiAccountSnapshot = {
  accountMarketSnapshots: readonly {
    // Market === qiToken Address
    market: Address
    balance: bigint
    allowance: bigint
    supplyBalance: bigint
    borrowBalance: bigint
    collateralEnabled: boolean
  }[]
  rewards: {
    unclaimedAvax: bigint
    // Typo exists in Benqi's Solidity implementation
    unclaimdQi: bigint
    markets: readonly Address[]
  }
}

export const useBenqiAccountSnapshot = ({
  networkClient
}: {
  networkClient: PublicClient | undefined
}): QueryObserverResult<BenqiAccountSnapshot> => {
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC as Address | undefined

  return useQuery<BenqiAccountSnapshot>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT,
      addressEVM,
      networkClient?.chain?.id
    ],
    queryFn:
      networkClient && addressEVM
        ? async () => {
            return await readContract(networkClient, {
              address: BENQI_LENS_C_CHAIN_ADDRESS,
              abi: BENQI_LENS_ABI,
              functionName: 'getAccountSnapshot',
              args: [addressEVM]
            })
          }
        : skipToken
  })
}
