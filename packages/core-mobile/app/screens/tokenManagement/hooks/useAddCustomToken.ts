import { useDispatch } from 'react-redux'
import { isAddress } from 'ethers'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect } from 'react'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import TokenService from 'services/token/TokenService'
import { useNetworks } from 'hooks/useNetworks'

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
}

const useAddCustomToken = (callback: () => void): CustomToken => {
  const { activeNetworkContractTokens: tokens, activeNetwork } = useNetworks()
  const [tokenAddress, setTokenAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<NetworkContractToken>()
  const dispatch = useDispatch()
  const chainId = activeNetwork.chainId

  useEffect(() => {
    setErrorMessage('')
    setToken(undefined)

    const validationStatus = validateAddress(tokenAddress, tokens)
    switch (validationStatus) {
      case AddressValidationStatus.Invalid:
        setErrorMessage('Not a valid ERC-20 token address.')
        break
      case AddressValidationStatus.AlreadyExists:
      case AddressValidationStatus.Valid:
        if (validationStatus === AddressValidationStatus.AlreadyExists) {
          setErrorMessage('Token already exists in the wallet.')
        }

        fetchTokenData(activeNetwork, tokenAddress)
          .then(setToken)
          .catch(err => {
            setErrorMessage('Not a valid ERC-20 token address.')
            Logger.error(err)
          })
        break
      case AddressValidationStatus.TooShort:
        // do not show error message for too short addresses
        break
    }
  }, [activeNetwork, tokenAddress, tokens])

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

  return { tokenAddress, setTokenAddress, errorMessage, token, addCustomToken }
}

export default useAddCustomToken
