import { isErc20 } from 'common/utils/isErc20'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useMemo } from 'react'
import { useCChainContractTokens } from './useCChainContractTokens'
import { useEthereumContractTokens } from './useEthereumContractTokens'

export const useErc20ContractTokens = (): NetworkContractToken[] => {
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const ethereumErc20ContractTokens = useEthereumErc20ContractTokens()

  return useMemo(
    () => [...avalancheErc20ContractTokens, ...ethereumErc20ContractTokens],
    [avalancheErc20ContractTokens, ethereumErc20ContractTokens]
  )
}

export const useAvalancheErc20ContractTokens = (): NetworkContractToken[] => {
  const avalancheContractTokens = useCChainContractTokens()
  return useMemo(
    () => avalancheContractTokens.filter(token => isErc20(token)),
    [avalancheContractTokens]
  )
}

export const useEthereumErc20ContractTokens = (): NetworkContractToken[] => {
  const ethereumContractTokens = useEthereumContractTokens()
  return useMemo(
    () => ethereumContractTokens.filter(token => isErc20(token)),
    [ethereumContractTokens]
  )
}
