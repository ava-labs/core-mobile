import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from 'ethers'
import {
  selectActiveNetwork,
  selectActiveNetworkContractTokens
} from 'store/network'
import { getInstance } from 'services/token/TokenService'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect } from 'react'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import { usePostCapture } from 'hooks/usePosthogCapture'

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
  const tokenService = getInstance()
  const networkContractToken = await tokenService.getTokenData(
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
  const [tokenAddress, setTokenAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<NetworkContractToken>()
  const network = useSelector(selectActiveNetwork)
  const tokens = useSelector(selectActiveNetworkContractTokens)
  const dispatch = useDispatch()
  const chainId = network.chainId
  const { capture } = usePostCapture()

  useEffect(() => {
    setErrorMessage('')
    setToken(undefined)

    const validationStatus = validateAddress(tokenAddress, tokens)
    switch (validationStatus) {
      case AddressValidationStatus.Invalid:
        setErrorMessage('Invalid ERC-20 token address.')
        break
      case AddressValidationStatus.AlreadyExists:
      case AddressValidationStatus.Valid:
        if (validationStatus === AddressValidationStatus.AlreadyExists) {
          setErrorMessage('Token already exists in the wallet.')
        }

        fetchTokenData(network, tokenAddress)
          .then(setToken)
          .catch(err => setErrorMessage(err.toString()))
        break
      case AddressValidationStatus.TooShort:
        // do not show error message for too short addresses
        break
    }
  }, [network, tokenAddress, tokens])

  const addCustomToken = (): void => {
    if (token) {
      dispatch(addCustomTokenAction({ chainId, token }))
      setTokenAddress('')
      callback()
      capture('ManageTokensAddCustomToken', {
        status: 'success',
        address: token.address
      })
    }
  }

  return { tokenAddress, setTokenAddress, errorMessage, token, addCustomToken }
}

export default useAddCustomToken
