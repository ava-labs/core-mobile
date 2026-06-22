import {
  RpcRequest,
  DetailItem,
  RpcMethod,
  DetailItemType,
  SigningData,
  BalanceChange,
  NetworkTokenWithBalance
} from '@avalabs/vm-module-types'
import { validateFee } from 'common/hooks/send/utils/evm/validate'
import { SendErrorMessage } from 'common/hooks/send/utils/types'
import { RequestContext } from 'store/rpc/types'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { Account } from 'store/account/types'
import {
  selectAccountByAddressAndWalletId,
  selectAccountByIndex,
  selectActiveAccount
} from 'store/account/slice'

export const removeWebsiteItemIfNecessary = (
  item: DetailItem,
  request: RpcRequest
): boolean => {
  if (typeof item === 'string') return true

  if (!isInAppRequest(request)) {
    // show everything for non-in-app requests
    return true
  }

  // hide website for in-app requests
  const label = item.label.toLowerCase()
  return label !== 'website'
}

export const overrideContractItem = (
  item: DetailItem,
  request: RpcRequest
): DetailItem => {
  if (typeof item === 'string') return item

  if (request.method !== RpcMethod.ETH_SEND_TRANSACTION) {
    return item
  }

  // evm module hardcodes "Contract" for the to field for all transactions
  // we are overriding this with "To" for non-contract recipients
  const nonContractRecipientAddress =
    request.context?.[RequestContext.NON_CONTRACT_RECIPIENT_ADDRESS]

  if (
    item.label.toLowerCase() === 'contract' &&
    nonContractRecipientAddress &&
    typeof nonContractRecipientAddress === 'string' &&
    item.type === DetailItemType.ADDRESS
  ) {
    return { ...item, label: 'To', value: nonContractRecipientAddress }
  }

  return item
}

export const getAccountSelector = (
  signingData: SigningData,
  walletId: string
): typeof selectActiveAccount => {
  if ('account' in signingData) {
    // Scope to the active wallet that signs: an address from another wallet
    // resolves to undefined (disabling approval) rather than being displayed
    // while a different key signs
    return selectAccountByAddressAndWalletId(walletId, signingData.account)
  }
  if (
    'accountIndex' in signingData &&
    signingData.accountIndex !== undefined &&
    signingData.accountIndex !== null
  ) {
    return selectAccountByIndex(walletId, signingData.accountIndex)
  }
  return selectActiveAccount
}

// True when the request targets a specific account that isn't part of the active
// wallet — `getAccountSelector` then resolves to undefined, disabling approval.
// Used to explain to the user why they can't approve (CP-14468).
export const isRequestedAccountUnavailable = (
  signingData: SigningData,
  resolvedAccount: Account | undefined
): boolean => 'account' in signingData && !resolvedAccount

// Message for the disabled-approval state. Names the owning account/wallet when
// the requested address belongs to one of the user's other wallets, so they know
// exactly where to switch; falls back to a generic hint otherwise (CP-14468).
export const getAccountUnavailableMessage = (
  walletName?: string,
  accountName?: string
): string => {
  if (walletName && accountName) {
    return `Your active account can't sign this request. Switch to "${accountName}" in "${walletName}" to continue.`
  }
  if (walletName) {
    return `Your active account can't sign this request. Switch to "${walletName}" to continue.`
  }
  return "Your active account can't sign this request. It belongs to a different wallet - switch to that wallet to continue."
}

export const getInitialGasLimit = (data: SigningData): number | undefined => {
  if (typeof data.data === 'object' && 'gasLimit' in data.data) {
    return Number(data.data.gasLimit || 0)
  }
  return undefined
}

export const getHasBalanceChange = (
  balanceChange: BalanceChange | undefined
): boolean => {
  return (
    !!balanceChange &&
    (balanceChange.ins.length > 0 || balanceChange.outs.length > 0)
  )
}

export const getEthSendTxValidationError = ({
  gasLimit,
  maxFeePerGas,
  sendValue,
  nativeToken
}: {
  gasLimit: number | undefined
  maxFeePerGas: bigint | undefined
  sendValue?: string | number | bigint | null
  nativeToken: NetworkTokenWithBalance
}): string | undefined => {
  try {
    const gasLimitToValidate = gasLimit ? BigInt(gasLimit) : 0n
    const amount = sendValue ? BigInt(sendValue) : 0n

    validateFee({
      gasLimit: gasLimitToValidate,
      maxFee: maxFeePerGas || 0n,
      amount,
      nativeToken,
      token: nativeToken
    })

    return undefined
  } catch (err) {
    if (err instanceof Error) {
      return err.message
    }
    return SendErrorMessage.UNKNOWN_ERROR
  }
}
