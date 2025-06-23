import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import {
  type NetworkContractToken,
  type TokenWithBalance,
  type Error,
  TokenType
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { NetworkVMType } from '@avalabs/core-chains-sdk'

export type BalancesForAccount = {
  accountId: string
  chainId: number
  accountAddress: string
  tokens: (TokenWithBalance | Error)[]
}

export class BalanceService {
  async getBalancesForAccount({
    network,
    account,
    currency,
    customTokens
  }: {
    network: Network
    account: Account
    currency: string
    customTokens?: NetworkContractToken[]
  }): Promise<BalancesForAccount> {
    const accountAddress = getAddressByNetwork(account, network)
    const module = await ModuleManager.loadModuleByNetwork(network)

    const tokenTypes =
      network.vmName === NetworkVMType.SVM
        ? [TokenType.NATIVE, TokenType.SPL]
        : [TokenType.NATIVE, TokenType.ERC20]

    const balancesResponse = await module.getBalances({
      customTokens,
      addresses: [accountAddress],
      currency,
      network: mapToVmNetwork(network),
      storage: coingeckoInMemoryCache,
      tokenTypes
    })

    const balances = balancesResponse[accountAddress] ?? {}
    if ('error' in balances) {
      return {
        accountId: account.id,
        chainId: network.chainId,
        tokens: [],
        accountAddress
      }
    }

    return {
      accountId: account.id,
      chainId: network.chainId,
      tokens: Object.values(balances),
      accountAddress
    }
  }
}

export default new BalanceService()
