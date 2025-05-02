import { RpcRequest, DetailItem, RpcMethod } from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'

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
  const isNonContractRecipient = Boolean(
    request.context?.[RequestContext.NON_CONTRACT_RECIPIENT]
  )
  if (item.label.toLowerCase() === 'contract' && isNonContractRecipient) {
    return { ...item, label: 'To' }
  }

  return item
}
