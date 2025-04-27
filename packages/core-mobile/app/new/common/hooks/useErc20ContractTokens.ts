import { isErc20 } from 'common/utils/isErc20'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useCChainContractTokens } from './useCChainContractTokens'
import { useEthereumContractTokens } from './useEthereumContractTokens'

export const useErc20ContractTokens = (): NetworkContractToken[] => {
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const ethereumErc20ContractTokens = useEthereumErc20ContractTokens()

  return [...avalancheErc20ContractTokens, ...ethereumErc20ContractTokens]
}

export const useAvalancheErc20ContractTokens = (): NetworkContractToken[] => {
  const avalancheContractTokens = useCChainContractTokens()
  return avalancheContractTokens.filter(token => isErc20(token))
}

export const useEthereumErc20ContractTokens = (): NetworkContractToken[] => {
  const ethereumContractTokens = useEthereumContractTokens()
  return ethereumContractTokens.filter(token => isErc20(token))
}
