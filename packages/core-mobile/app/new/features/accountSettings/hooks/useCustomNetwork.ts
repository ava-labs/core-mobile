import { ChainID, toggleFavorite, updateCustomNetwork } from 'store/network'

import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addCustomNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { constructCustomNetwork } from '../utils/constructCustomNetwork'

export type CustomNetworkType = {
  chainId?: string
  chainName?: string
  explorerUrl?: string
  logoUri?: string
  tokenSymbol?: string
  tokenName?: string
  rpcUrl?: string
}

export function useCustomNetwork(): {
  handleAddNetwork: (formState: CustomNetworkType) => void
  handleUpdateNetwork: (chainId: ChainID, formState: CustomNetworkType) => void
} {
  const dispatch = useDispatch()
  const isTestnet = useSelector(selectIsDeveloperMode)

  const handleAddNetwork = useCallback(
    (formState: CustomNetworkType) => {
      const newNetwork = constructCustomNetwork(formState, isTestnet)

      dispatch(addCustomNetwork(newNetwork))
      dispatch(toggleFavorite(newNetwork.chainId))
    },
    [dispatch, isTestnet]
  )

  const handleUpdateNetwork = useCallback(
    (chainId: ChainID, formState: CustomNetworkType): void => {
      const updatedNetwork = constructCustomNetwork(formState, isTestnet)

      dispatch(
        updateCustomNetwork({
          chainId,
          network: updatedNetwork
        })
      )
    },
    [isTestnet, dispatch]
  )

  return {
    handleAddNetwork,
    handleUpdateNetwork
  }
}
