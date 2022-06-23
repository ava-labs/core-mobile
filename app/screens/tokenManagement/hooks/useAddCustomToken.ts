import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from '@ethersproject/address'
import { selectActiveNetwork, selectNetworkContractTokens } from 'store/network'
import TokenService from 'services/token/TokenService'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect } from 'react'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'

const validateAddress = (
  tokenAddress: string,
  tokens: NetworkContractToken[]
) => {
  if (!tokenAddress || !isAddress(tokenAddress)) {
    throw 'Invalid ERC-20 token address.'
  }

  const tokenAlreadyExists = tokens.some(
    token => token.address === tokenAddress
  )

  if (tokenAlreadyExists) {
    throw 'Token already exists in the wallet.'
  }
}

const fetchTokenData = async (network: Network, tokenAddress: string) => {
  const networkContractToken = await TokenService.getTokenData(
    tokenAddress,
    network
  )

  if (!networkContractToken) {
    throw `ERC20 contract ${tokenAddress} does not exist.`
  }

  return networkContractToken
}

const useAddCustomToken = (callback: () => void) => {
  const [tokenAddress, setTokenAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [token, setToken] = useState<NetworkContractToken>()
  const network = useSelector(selectActiveNetwork)
  const tokens = useSelector(selectNetworkContractTokens)
  const dispatch = useDispatch()
  const chainId = network.chainId

  useEffect(() => {
    setErrorMessage('')
    setToken(undefined)

    try {
      validateAddress(tokenAddress, tokens)
    } catch (e: any) {
      // only start showing validation error after a certain length
      if (tokenAddress.length > 10) {
        setErrorMessage(e)
      }

      return
    }

    fetchTokenData(network, tokenAddress).then(setToken).catch(setErrorMessage)
  }, [network, tokenAddress, tokens])

  const addCustomToken = async () => {
    if (token) {
      dispatch(addCustomTokenAction({ chainId, token }))
      setTokenAddress('')
      callback()
    }
  }

  return { tokenAddress, setTokenAddress, errorMessage, token, addCustomToken }
}

export default useAddCustomToken
