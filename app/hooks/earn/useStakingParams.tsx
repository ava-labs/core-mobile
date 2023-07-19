import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/chains-sdk'
import { BigIntWeiAvax } from 'types/denominations'

export interface StakeParamsHook {
  minStakeAmount: BigIntWeiAvax
  nativeTokenBalance: BigIntWeiAvax | undefined
}

export default function useStakingParams(): StakeParamsHook {
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const minStakeAmount = isDeveloperMode ? BigInt(1e18) : BigInt(25e18)
  const nativeTokenBalance = useSelector(
    selectNativeTokenBalanceForNetworkAndAccount(chainId, activeAccount?.index)
  )

  return {
    minStakeAmount,
    nativeTokenBalance
  } as StakeParamsHook
}
