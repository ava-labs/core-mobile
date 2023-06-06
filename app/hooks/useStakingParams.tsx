import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { stringToBN } from '@avalabs/utils-sdk'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import BN from 'bn.js'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/chains-sdk'

export interface StakeParamsHook {
  minStakeAmount: BN
  nativeTokenBalance: BN | undefined
}

export default function useStakingParams(): StakeParamsHook {
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = useSelector(selectNetwork(chainId))
  const minStakeAmount = stringToBN(
    isDeveloperMode ? '1' : '25',
    avaxNetwork?.networkToken.decimals ?? 18
  )
  const nativeTokenBalance = useSelector(
    selectNativeTokenBalanceForNetworkAndAccount(chainId, activeAccount?.index)
  )

  return {
    minStakeAmount,
    nativeTokenBalance
  } as StakeParamsHook
}
