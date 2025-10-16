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
import { chunk } from 'lodash'

export type BalancesForAccount = {
  accountId: string
  chainId: number
  accountAddress: string
  tokens: (TokenWithBalance | Error)[]
  error: Error | null
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
        accountAddress,
        error: balances.error as Error
      }
    }

    return {
      accountId: account.id,
      chainId: network.chainId,
      tokens: Object.values(balances),
      accountAddress,
      error: null
    }
  }

  /**
   * Get balances for active addresses on XP chain
   */
  async getBalancesForAccountsXP({
    currency,
    network,
    activeAddresses
  }: {
    currency: string
    network: Network
    activeAddresses: string[]
  }): Promise<BalancesForAccount> {
    const allBalances: BalancesForAccount = {
      accountId: '',
      accountAddress: '',
      chainId: network.chainId,
      tokens: [],
      error: null
    }

    // avalancheModule.getBalances can only process up to 64 addresses at a time, so we need to split the addresses into chunks
    const chunkSize = 64
    const chunks = chunk(activeAddresses, chunkSize)

    await Promise.all(
      chunks.map(async c => {
        const balancesResponse =
          await ModuleManager.avalancheModule.getBalances({
            addresses: c,
            currency,
            network: mapToVmNetwork(network),
            storage: coingeckoInMemoryCache,
            tokenTypes: [TokenType.NATIVE]
          })

        for (const address in balancesResponse) {
          const balances = balancesResponse[address] ?? {}
          if ('error' in balances) {
            allBalances.error = balances.error as Error
          } else {
            allBalances.tokens.push(...Object.values(balances))
          }
        }
      })
    )
    return allBalances
  }
}

export default new BalanceService()
