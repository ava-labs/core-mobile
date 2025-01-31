import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from 'ethers'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect, useMemo } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import TokenService from 'services/token/TokenService'
import { useNetworks } from 'hooks/networks/useNetworks'
import {
  NetworkContractToken,
  TokenType,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'
import { selectTokensWithBalance } from 'store/balance'

enum AddressValidationStatus {
  Valid,
  TooShort,
  AlreadyExists,
  Invalid
}

const validateAddress = (
  tokenAddress: string,
  tokens: string[]
): AddressValidationStatus => {
  if (tokenAddress.length <= 10) {
    return AddressValidationStatus.TooShort
  }

  if (!isAddress(tokenAddress)) {
    return AddressValidationStatus.Invalid
  }

  if (tokens.some(token => token === tokenAddress)) {
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
  token: TokenWithBalanceERC20 | NetworkContractToken | undefined
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
  const tokensWithBalance = useSelector(selectTokensWithBalance)

  const tokenAddresses = useMemo(
    () => [
      ...new Set([
        ...tokens.map(t => t.address),
        ...tokensWithBalance
          .map(t => {
            if (t.type === TokenType.ERC20) {
              return t.address
            }
          })
          .filter(item => item !== undefined)
      ])
    ],
    [tokens, tokensWithBalance]
  )

  const existingToken = useMemo(
    () =>
      tokensWithBalance.find(
        t =>
          t.type === TokenType.ERC20 &&
          t.address.toLowerCase() === tokenAddress.toLowerCase()
      ) as TokenWithBalanceERC20 | undefined,
    [tokensWithBalance, tokenAddress]
  )

  const tokenData = useMemo(
    () => existingToken ?? token,
    [existingToken, token]
  )

  useEffect(() => {
    const validationStatus = validateAddress(tokenAddress, tokenAddresses)
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
          .then(t => {
            setToken(t)
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
  }, [activeNetwork, tokenAddress, tokenAddresses, tokens])

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
    token: tokenData,
    addCustomToken,
    isLoading
  }
}

export default useAddCustomToken
