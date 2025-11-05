import { Network } from '@avalabs/core-chains-sdk'
import { SPAN_STATUS_ERROR } from '@sentry/core'
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
import { isPChain } from 'utils/network/isAvalancheNetwork'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { LocalTokenWithBalance } from 'store/balance/types'
import {
  NormalizedBalancesForAccount,
  NormalizedBalancesForXpAddress
} from './types'
import { AVAX_P_ID, AVAX_X_ID } from './const'
import { getLocalTokenId } from './utils'

type NonXpNetwork = Exclude<
  Network,
  { vmName: NetworkVMType.AVM | NetworkVMType.PVM }
>

export class BalanceService {
  /**
   * Fetch balances for an account on a given non XP network
   * and return normalized results with accuracy + localId mapping.
   */
  async getBalancesForAccount({
    network,
    account,
    currency,
    customTokens
  }: {
    network: NonXpNetwork
    account: Account
    currency: string
    customTokens?: NetworkContractToken[]
  }): Promise<NormalizedBalancesForAccount> {
    return SentryWrapper.startSpan(
      {
        name: 'get-balances',
        contextName: 'svc.balance.get_for_account',
        attributes: {
          chainId: network.chainId,
          chainName: network.chainName
        }
      },
      async span => {
        const accountAddress = getAddressByNetwork(account, network)
        const module = await ModuleManager.loadModuleByNetwork(network)

        const tokenTypes =
          network.vmName === NetworkVMType.SVM
            ? [TokenType.NATIVE, TokenType.SPL]
            : [TokenType.NATIVE, TokenType.ERC20]

        try {
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
            throw balances.error
          }

          const tokens = Object.values(balances)
            // Keep only successful token entries
            .filter((t): t is TokenWithBalance => !('error' in t))
            .map(token => {
              const localId = getLocalTokenId(token)
              return {
                ...token,
                localId,
                networkChainId: network.chainId,
                isDataAccurate: true
              }
            })

          return {
            accountId: account.id,
            chainId: network.chainId,
            accountAddress,
            tokens,
            dataAccurate: true,
            error: null
          }
        } catch (err) {
          span?.setStatus({
            code: SPAN_STATUS_ERROR,
            message: err instanceof Error ? err.message : 'unknown error'
          })
          Logger.error(
            `[BalanceService][getBalancesForAccount] failed to fetch balances for network ${network.chainId}`,
            err
          )
          return {
            accountId: account.id,
            chainId: network.chainId,
            accountAddress,
            tokens: [],
            dataAccurate: false,
            error: err as Error
          }
        } finally {
          span?.end()
        }
      }
    )
  }

  /**
   * Get balances for active addresses on XP chains (P-Chain / X-Chain).
   *
   * Handles batching up to 64 addresses per request and returns
   * a map of address → normalized balance object (including token metadata and accuracy flags).
   */
  async getXPBalances({
    currency,
    network,
    addresses
  }: {
    currency: string
    network: Network & { vmName: NetworkVMType.AVM | NetworkVMType.PVM }
    addresses: string[]
  }): Promise<Record<string, NormalizedBalancesForXpAddress>> {
    const allBalances: Record<string, NormalizedBalancesForXpAddress> = {}

    // avalancheModule.getBalances can only process up to 64 addresses at a time
    const chunkSize = 64
    const chunks = chunk(addresses, chunkSize)

    await Promise.all(
      // eslint-disable-next-line sonarjs/cognitive-complexity
      chunks.map(async (batch: string[]) => {
        return SentryWrapper.startSpan(
          {
            name: 'get-balances',
            contextName: 'svc.balance.get_for_xp_networks',
            attributes: {
              chainId: network.chainId,
              chainName: network.chainName,
              batchSize: batch.length
            }
          },
          async span => {
            try {
              const balancesResponse =
                await ModuleManager.avalancheModule.getBalances({
                  addresses: batch,
                  currency,
                  network: mapToVmNetwork(network),
                  storage: coingeckoInMemoryCache,
                  tokenTypes: [TokenType.NATIVE]
                })

              for (const address in balancesResponse) {
                const balances = balancesResponse[address] ?? {}

                // Handle RPC or Glacier error per address
                if ('error' in balances) {
                  allBalances[address] = {
                    accountAddress: address,
                    chainId: network.chainId,
                    tokens: [],
                    dataAccurate: false,
                    error: balances.error as Error
                  }

                  continue
                }

                // Normalize tokens
                const tokens = Object.values(balances).map(token => ({
                  ...token,
                  localId: isPChain(network.chainId) ? AVAX_P_ID : AVAX_X_ID,
                  networkChainId: network.chainId,
                  isDataAccurate: !('error' in token),
                  error: 'error' in token ? token.error : null
                })) as LocalTokenWithBalance[]

                const dataAccurate = tokens.every(t => t.isDataAccurate)

                allBalances[address] = {
                  accountAddress: address,
                  chainId: network.chainId,
                  tokens,
                  dataAccurate,
                  error: null
                }
              }
            } catch (err) {
              span?.setStatus({
                code: SPAN_STATUS_ERROR,
                message: err instanceof Error ? err.message : 'unknown error'
              })
              Logger.error(
                `[BalanceService][getXPBalances] failed to fetch balances for network ${network.chainId}`,
                err
              )
              // Handle chunk-level error gracefully
              batch.forEach(address => {
                allBalances[address] = {
                  accountAddress: address,
                  chainId: network.chainId,
                  tokens: [],
                  dataAccurate: false,
                  error: err as Error
                }
              })
            } finally {
              span?.end()
            }
          }
        )
      })
    )

    return allBalances
  }
}

export default new BalanceService()
