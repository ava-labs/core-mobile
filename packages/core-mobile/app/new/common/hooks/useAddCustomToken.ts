import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from 'ethers'
import { addCustomToken as addCustomTokenAction } from 'store/customToken'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import TokenService from 'services/token/TokenService'
import {
  NetworkContractToken,
  TokenType,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'
import { selectTokensWithBalanceByNetwork } from 'store/balance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useEthereumNetwork } from 'hooks/networks/useEthereumNetwork'
import { useTokenAddress } from 'features/tokenManagement/store'

enum CustomTokenNetwork {
  AVALANCHE = 'Avalanche C-Chain',
  ETHEREUM = 'Ethereum'
}

export const CUSTOM_TOKEN_NETWORKS = [
  [CustomTokenNetwork.AVALANCHE, CustomTokenNetwork.ETHEREUM]
]

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
  changeNetwork: (network: CustomTokenNetwork) => void
}

const useAddCustomToken = (callback: () => void): CustomToken => {
  const [tokenAddress, setTokenAddress] = useTokenAddress()
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<NetworkContractToken>()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const cChainNetwork = useCChainNetwork()
  const ethereumNetwork = useEthereumNetwork()
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
    cChainNetwork
  )
  const chainId = useMemo(() => {
    return selectedNetwork?.chainId
  }, [selectedNetwork])

  const tokens = useNetworkContractTokens(selectedNetwork)
  const tokensWithBalance = useSelector(
    selectTokensWithBalanceByNetwork(chainId)
  )

  const changeNetwork = useCallback(
    (network: CustomTokenNetwork): void => {
      setSelectedNetwork(
        network === CustomTokenNetwork.ETHEREUM
          ? ethereumNetwork
          : cChainNetwork
      )
      setTokenAddress('')
      setToken(undefined)
      setErrorMessage('')
    },
    [ethereumNetwork, cChainNetwork, setTokenAddress]
  )

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

        if (selectedNetwork === undefined) {
          setErrorMessage('No network selected.')
          setIsLoading(false)
          return
        }
        fetchTokenData(selectedNetwork, tokenAddress)
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
  }, [selectedNetwork, tokenAddress, tokenAddresses, tokens])

  const addCustomToken = useCallback((): void => {
    if (token && chainId) {
      dispatch(addCustomTokenAction({ chainId, token }))
      setTokenAddress('')
      callback()
      AnalyticsService.capture('ManageTokensAddCustomToken', {
        status: 'success',
        address: token.address
      })
    }
  }, [token, chainId, dispatch, setTokenAddress, callback])

  return {
    tokenAddress,
    setTokenAddress,
    errorMessage,
    token: tokenData,
    addCustomToken,
    isLoading,
    changeNetwork
  }
}

export default useAddCustomToken
