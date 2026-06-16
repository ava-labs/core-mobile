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
