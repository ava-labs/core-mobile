import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from 'ethers'
import { selectActiveNetwork, selectNetworkContractTokens } from 'store/network'
import { getInstance } from 'services/token/TokenService'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect } from 'react'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import { usePostCapture } from 'hooks/usePosthogCapture'

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

const useAddCustomToken = (callback: () => void) => {
  const [tokenAddress, setTokenAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [token, setToken] = useState<NetworkContractToken>()
  const network = useSelector(selectActiveNetwork)
  const tokens = useSelector(selectNetworkContractTokens)
  const dispatch = useDispatch()
  const chainId = network.chainId
  const { capture } = usePostCapture()

  useEffect(() => {
    setErrorMessage('')
    setToken(undefined)

    try {
      validateAddress(tokenAddress, tokens)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // only start showing validation error after a certain length
      if (tokenAddress.length > 10) {
        setErrorMessage(e)
      }

      return
    }

    fetchTokenData(network, tokenAddress)
      .then(setToken)
      .catch(err => setErrorMessage(err.toString()))
  }, [network, tokenAddress, tokens])

  const addCustomToken = async () => {
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
