import { AppListenerEffectAPI } from 'store/types'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { AccountCollection } from 'store/account'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { HandleResponse, RpcRequestHandler } from '../../types'

export type AvalancheGetAccountsRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNTS>

class AvalancheGetAccountsHandler
  implements RpcRequestHandler<AvalancheGetAccountsRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNTS]

  // Request deduplication - track pending requests
  private pendingRequests = new Map<string, Promise<HandleResponse>>()

  private generateRequestKey(
    accounts: AccountCollection,
    activeAccountId: string
  ): string {
    // Create a key based on current state to identify identical requests
    const accountIds = Object.keys(accounts).sort().join(',')
    return `${accountIds}-${activeAccountId}`
  }

  handle = async (
    request: AvalancheGetAccountsRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const accounts = selectAccounts(listenerApi.getState())
    const activeAccount = selectActiveAccount(listenerApi.getState())

    if (!activeAccount) {
      return {
        success: false,
        error: rpcErrors.internal('no active account')
      }
    }

    const requestKey = this.generateRequestKey(accounts, activeAccount.id)

    // Check if identical request is already pending
    if (this.pendingRequests.has(requestKey)) {
      const existingRequest = this.pendingRequests.get(requestKey)
      if (existingRequest) {
        return await existingRequest
      }
    }

    // Create new request promise
    const requestPromise = this.processRequest(
      accounts,
      activeAccount.id,
      request.data.id
    )
    this.pendingRequests.set(requestKey, requestPromise)

    try {
      return await requestPromise
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey)
    }
  }

  private async processRequest(
    accounts: AccountCollection,
    activeAccountId: string,
    _requestId: number
  ): Promise<HandleResponse> {
    const accountsArray = Object.values(accounts).map(account => {
      return {
        ...account,
        active: account.id === activeAccountId
      }
    })

    return { success: true, value: accountsArray }
  }
}

export const avalancheGetAccountsHandler = new AvalancheGetAccountsHandler()
