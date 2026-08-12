import { useDispatch, useSelector } from 'react-redux'
import { isAddress } from 'ethers'
import {
  addCustomToken as addCustomTokenAction,
  selectAllCustomTokens
} from 'store/customToken'
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
import {
  useSelectedNetwork,
  useTokenAddress
} from 'features/tokenManagement/store'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { tokenLookupKey, useTokenLookup } from 'common/hooks/useTokenLookup'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

enum AddressValidationStatus {
  Valid,
  TooShort,
  AlreadyExists,
  Invalid
}

const validateAddress = (
  tokenAddress: string,
  tokens: string[],
  existsInNetworkCatalog: boolean
): AddressValidationStatus => {
  if (tokenAddress.length <= 10) {
    return AddressValidationStatus.TooShort
  }

  if (!isAddress(tokenAddress)) {
    return AddressValidationStatus.Invalid
  }

  if (
    // Custom tokens are stored lowercased (store/customToken slice), while
    // user input may be checksummed -- compare case-insensitively.
    tokens.some(token => token.toLowerCase() === tokenAddress.toLowerCase()) ||
    existsInNetworkCatalog
  ) {
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
  const [tokenAddress, setTokenAddress] = useTokenAddress()
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<NetworkContractToken>()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNetwork] = useSelectedNetwork()
  const chainId = selectedNetwork?.chainId

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const allCustomTokens = useSelector(selectAllCustomTokens)
  const activeAccount = useSelector(selectActiveAccount)
  const { tokens: tokensWithBalance } = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    chainId
  )

  // A token the user already added or already holds counts as "already in
  // the wallet" -- no need to pull the network's full contract-token catalog
  // just to build this membership set.
  const customTokensForChain = useMemo(
    () =>
      chainId !== undefined && selectedNetwork?.isTestnet === isDeveloperMode
        ? allCustomTokens[chainId] ?? []
        : [],
    [allCustomTokens, chainId, isDeveloperMode, selectedNetwork?.isTestnet]
  )

  const tokenAddresses = useMemo(
    () => [
      ...new Set([
        ...customTokensForChain.map(t => t.address),
        ...tokensWithBalance
          .map(t => {
            if (t.type === TokenType.ERC20) {
              return t.address
            }
          })
          .filter(item => item !== undefined)
      ])
    ],
    [customTokensForChain, tokensWithBalance]
  )

  const selectedCaip2Id = useMemo(
    () => (chainId !== undefined ? getCaip2ChainId(chainId) : undefined),
    [chainId]
  )

  // Restores the old useNetworkContractTokens "already exists" check without
  // pulling the network's whole curated token list: look up just the single
  // address the user typed against the token aggregator.
  const networkCatalogLookupIds = useMemo(
    () =>
      selectedCaip2Id && isAddress(tokenAddress)
        ? [{ caip2Id: selectedCaip2Id, address: tokenAddress }]
        : [],
    [selectedCaip2Id, tokenAddress]
  )

  const { data: networkCatalogLookup, isLoading: isNetworkCatalogLoading } =
    useTokenLookup(networkCatalogLookupIds)

  const existsInNetworkCatalog = useMemo(
    () =>
      selectedCaip2Id !== undefined &&
      isAddress(tokenAddress) &&
      Boolean(
        networkCatalogLookup[tokenLookupKey(selectedCaip2Id, tokenAddress)]
      ),
    [networkCatalogLookup, selectedCaip2Id, tokenAddress]
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
    if (tokenAddress === '') {
      setErrorMessage('')
      setToken(undefined)
    }
  }, [tokenAddress])

  useEffect(() => {
    if (selectedNetwork === undefined) {
      if (tokenAddress) {
        setErrorMessage('Please select a network.')
      }
      return
    }

    // Hold off on validating while the network-catalog lookup for this exact
    // address is still in flight -- otherwise a token that turns out to
    // already be in the network's catalog could flash a "valid" verdict (and
    // kick off fetchTokenData) before the lookup resolves.
    if (isAddress(tokenAddress) && isNetworkCatalogLoading) {
      setIsLoading(true)
      return
    }

    const validationStatus = validateAddress(
      tokenAddress,
      tokenAddresses,
      existsInNetworkCatalog
    )

    // Unconditional: only the Valid branch below re-arms this via its own
    // fetchTokenData().finally() -- every other branch has no async work,
    // so without this reset the gate above would leave it stuck on.
    setIsLoading(false)

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
  }, [
    selectedNetwork,
    tokenAddress,
    tokenAddresses,
    isNetworkCatalogLoading,
    existsInNetworkCatalog
  ])

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
    isLoading
  }
}

export default useAddCustomToken
