import { useDispatch } from 'react-redux'
import { isAddress } from 'ethers'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect, useMemo } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import TokenService from 'services/token/TokenService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'

enum AddressValidationStatus {
  Valid,
  TooShort,
  AlreadyExists,
  Invalid
}

const validateAddress = (
  tokenAddress: string,
  tokens: NetworkContractToken[]
): AddressValidationStatus => {
  if (tokenAddress.length <= 10) {
    return AddressValidationStatus.TooShort
  }

  if (!isAddress(tokenAddress)) {
    return AddressValidationStatus.Invalid
  }

  if (tokens.some(token => token.address === tokenAddress)) {
    return AddressValidationStatus.AlreadyExists
  }

  return AddressValidationStatus.Valid
}

const fetchTokenData = async (
  network: Network,
  tokenAddress: string
): Promise<NetworkContractToken> => {
  const networkContractToken = await TokenService.getTokenData(
    tokenAddress,
    network
  )

  if (!networkContractToken) {
    throw `ERC20 contract ${tokenAddress} does not exist.`
  }

  return networkContractToken
}

type CustomToken = {
  tokenAddress: string
  setTokenAddress: (tokenAddress: string) => void
  errorMessage: string
  token: NetworkContractToken | undefined
  addCustomToken: () => void
  isLoading: boolean
}

const useAddCustomToken = (callback: () => void): CustomToken => {
  const { activeNetwork } = useNetworks()
  const tokens = useNetworkContractTokens(activeNetwork)
  const [tokenAddress, setTokenAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<NetworkContractToken>()
  const dispatch = useDispatch()
  const chainId = activeNetwork.chainId
  const [isLoading, setIsLoading] = useState(false)

  
  const memoizedTokens = useMemo(() => tokens, [activeNetwork])

  useEffect(() => {
    const validationStatus = validateAddress(tokenAddress, memoizedTokens)
    switch (validationStatus) {
      case AddressValidationStatus.Invalid:
        setToken(undefined)
        setErrorMessage('Not a valid ERC-20 token address.')
        break
      case AddressValidationStatus.AlreadyExists:
        setToken(undefined)
        setErrorMessage('Token already exists in the wallet.')
        break
      case AddressValidationStatus.Valid:
        setIsLoading(true)
        fetchTokenData(activeNetwork, tokenAddress)
          .then(token => {
            setToken(token)
            setErrorMessage('')
          })
          .catch(err => {
            setToken(undefined)
            setErrorMessage('Not a valid ERC-20 token address.')
            Logger.error(err)
          })
          .finally(() => {
            setIsLoading(false)
          })
        break
      case AddressValidationStatus.TooShort:
      default:
        // do not show error message for too short addresses or default case
        setErrorMessage('')
        setToken(undefined)
    }
  }, [activeNetwork, tokenAddress, memoizedTokens])

  const addCustomToken = (): void => {
    if (token) {
      dispatch(addCustomTokenAction({ chainId, token }))
      setTokenAddress('')
      callback()
      AnalyticsService.capture('ManageTokensAddCustomToken', {
        status: 'success',
        address: token.address
      })
    }
  }

  return {
    tokenAddress,
    setTokenAddress,
    errorMessage,
    token,
    addCustomToken,
    isLoading
  }
}

export default useAddCustomToken
