import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  Network
} from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { AvatarType } from '@avalabs/k2-alpine'
import { useContacts } from 'common/hooks/useContacts'
import { AddressType } from 'features/accountSettings/consts'
import { isValidAddress } from 'features/accountSettings/utils/isValidAddress'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import {
  AVALANCHE_MAINNET_NETWORK,
  AVALANCHE_TESTNET_NETWORK
} from 'services/network/consts'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import {
  getAvalancheNetwork,
  getBitcoinNetwork,
  getEthereumNetwork
} from 'services/network/utils/providerUtils'
import { AddrBookItemType, Contact } from 'store/addressBook'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isXPChain } from '../../../../utils/network/isAvalancheNetwork'
import { useSendSelectedToken } from '../store'
import { getNetworks } from '../utils/getNetworks'

interface TokenAddresses {
  name?: string
  avatar?: AvatarType
  address?: string
  addressXP?: string
  addressBTC?: string
}

export type ToAddress = {
  to: string // accountIndex | contactUID | address
  recipientType: AddrBookItemType | 'address'
}

interface SendContextState {
  amount: TokenUnit | undefined
  setAmount: Dispatch<TokenUnit | undefined>
  recipient?: Contact | TokenAddresses
  setToAddress: (valu: ToAddress) => void
  maxAmount: TokenUnit | undefined
  setMaxAmount: Dispatch<TokenUnit>
  maxFee: bigint
  error: string | undefined
  setError: Dispatch<string | undefined>
  isSending: boolean
  setIsSending: Dispatch<boolean>
  canValidate: boolean
  setCanValidate: Dispatch<boolean>
  isValid: boolean
  network: Network
  addressToSend?: string
  resetAmount: () => void
}

export const SendContext = createContext<SendContextState>(
  {} as SendContextState
)

export const SendContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const { allNetworks, getFromPopulatedNetwork } = useNetworks()
  const { accounts, contacts } = useContacts()
  const [maxAmount, setMaxAmount] = useState<TokenUnit>()
  const [amount, setAmount] = useState<TokenUnit>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [toAddress, setToAddress] = useState<ToAddress>()
  const [error, setError] = useState<string | undefined>(NOT_TOUCHED_ERROR)
  const [isSending, setIsSending] = useState(false)
  const [canValidate, setCanValidate] = useState(false)
  const [defaultMaxFeePerGas, setDefaultMaxFeePerGas] = useState<bigint>(0n)
  const [selectedToken] = useSendSelectedToken()

  const defaultNetwork = useMemo(() => {
    const networks = getNetworks({
      to: toAddress?.to,
      recipientType: toAddress?.recipientType,
      allNetworks,
      isDeveloperMode,
      contacts: accounts.concat(contacts)
    })
    const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)
    const avalancheCChain = getAvalancheNetwork(allNetworks, isDeveloperMode)
    if (
      networks.find(n => n.chainId && isAvalancheCChainId(n.chainId)) &&
      avalancheCChain
    ) {
      return avalancheCChain
    }
    if (networks.find(n => n.chainId && isXPChain(n.chainId))) {
      return isDeveloperMode ? AVALANCHE_XP_TEST_NETWORK : AVALANCHE_XP_NETWORK
    }
    if (
      networks.find(n => n.chainId && isEthereumChainId(n.chainId)) &&
      ethereumNetwork
    ) {
      return ethereumNetwork
    }
    if (networks.find(n => n.chainId && isBitcoinChainId(n.chainId))) {
      return getBitcoinNetwork(isDeveloperMode)
    }
    return isDeveloperMode
      ? AVALANCHE_TESTNET_NETWORK
      : AVALANCHE_MAINNET_NETWORK
  }, [
    accounts,
    allNetworks,
    contacts,
    isDeveloperMode,
    toAddress?.recipientType,
    toAddress?.to
  ])

  const network = useMemo(
    () =>
      getFromPopulatedNetwork(selectedToken?.networkChainId) ?? defaultNetwork,
    [defaultNetwork, getFromPopulatedNetwork, selectedToken?.networkChainId]
  )

  const { data: networkFee } = useNetworkFee(network)

  // setting maxFeePerGas to lowest network fee to calculate max amount in Send screen
  useEffect(() => {
    if (!networkFee) return
    setDefaultMaxFeePerGas(networkFee.low.maxFeePerGas)
  }, [networkFee])

  const resetAmount = (): void => {
    setAmount(undefined)
    setMaxAmount(undefined)
  }

  const recipient = useMemo(() => {
    if (toAddress === undefined) return undefined

    if (
      toAddress.recipientType === 'contact' ||
      toAddress.recipientType === 'account'
    ) {
      return accounts
        .concat(contacts)
        .find(account => account.id === toAddress.to)
    }

    if (
      isValidAddress({
        address: toAddress.to,
        addressType: AddressType.EVM,
        isDeveloperMode
      })
    ) {
      return {
        address: toAddress.to
      }
    }
    if (
      isValidAddress({
        address: toAddress.to,
        addressType: AddressType.XP,
        isDeveloperMode
      })
    ) {
      return {
        addressXP: toAddress.to
      }
    }
    if (
      isValidAddress({
        address: toAddress.to,
        addressType: AddressType.BTC,
        isDeveloperMode
      })
    ) {
      return {
        addressBTC: toAddress.to
      }
    }
    return undefined
  }, [accounts, contacts, toAddress, isDeveloperMode])

  const addressToSend = useMemo(() => {
    if (selectedToken === undefined) {
      return toAddress?.recipientType === 'address' ? toAddress.to : undefined
    }
    if (isBitcoinChainId(selectedToken?.networkChainId)) {
      return recipient?.addressBTC ? recipient.addressBTC : undefined
    }
    if (
      isTokenWithBalanceAVM(selectedToken) ||
      isTokenWithBalancePVM(selectedToken)
    ) {
      return recipient?.addressXP ? recipient.addressXP : undefined
    }
    if (
      isAvalancheCChainId(selectedToken.networkChainId) ||
      isEthereumChainId(selectedToken?.networkChainId)
    ) {
      return recipient?.address ? recipient.address : undefined
    }
    return undefined
  }, [
    selectedToken,
    toAddress?.recipientType,
    toAddress?.to,
    recipient?.addressBTC,
    recipient?.addressXP,
    recipient?.address
  ])

  const state: SendContextState = {
    amount,
    setAmount,
    recipient,
    setToAddress,
    maxAmount,
    setMaxAmount,
    maxFee: defaultMaxFeePerGas,
    error,
    setError,
    isSending,
    setIsSending,
    canValidate,
    setCanValidate,
    network,
    isValid: error === undefined,
    resetAmount,
    addressToSend
  }
  return <SendContext.Provider value={state}>{children}</SendContext.Provider>
}

export function useSendContext(): SendContextState {
  return useContext(SendContext)
}

const NOT_TOUCHED_ERROR = ''
