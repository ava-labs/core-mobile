import { BlockchainNamespace, ChainId, Network } from '@avalabs/core-chains-sdk'
import { SPAN_STATUS_ERROR } from '@sentry/core'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import {
  type NetworkContractToken,
  type TokenWithBalance,
  type Error,
  TokenType,
  GetBalancesResponse as VmGetBalancesResponse
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  isPChain,
  isXChain,
  isXPNetwork
} from 'utils/network/isAvalancheNetwork'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { NormalizedBalancesForAccount } from './types'
import { AVAX_P_ID, AVAX_X_ID } from './const'
import { getLocalTokenId } from './utils'
import {
  AvalancheXpGetBalancesRequestItem,
  AvmGetBalancesResponse,
  BtcGetBalancesRequestItem,
  BtcGetBalancesResponse,
  EvmGetBalancesRequestItem,
  EvmGetBalancesResponse,
  GetBalancesRequestBody,
  GetBalancesResponse,
  PvmGetBalancesResponse,
  SvmGetBalancesRequestItem,
  SvmGetBalancesResponse
} from 'utils/apiClient/generated/balanceApi.client'
import { balanceApi } from 'utils/apiClient/balance/balanceApi'
import { xpAddressWithoutPrefix } from 'common/utils/xpAddressWIthoutPrefix'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'

type AccountId = string

const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr))

const NEWLINE = '\n'

function convertToNormalizedBalances(
  response: GetBalancesResponse
): Omit<NormalizedBalancesForAccount, 'accountId'> | null {
  if ('error' in response && Object.keys(response).length === 1) {
    // TODO: Handle error
    return null
  }

  if ('error' in response && response.error !== null) {
    if (!('caip2Id' in response)) {
      // TODO: Handle error
      return null
    }

    const chainId = getChainIdFromCaip2(response.caip2Id)

    if (chainId === undefined) return null

    return {
      chainId,
      accountAddress: response.id,
      dataAccurate: false,
      error: { error: response.error },
      tokens: []
    }
  }

  const chainId = getChainIdFromCaip2(response.caip2Id)

  if (chainId === undefined) return null

  const address = response.id

  switch (response.networkType) {
    case 'evm': {
      const evm = response as EvmGetBalancesResponse

      // const tokens = Object.values(balances)
      // .filter((t): t is TokenWithBalance => !('error' in t))
      // .map(token => {
      //   const localId = isPChain(network.chainId)
      //     ? AVAX_P_ID
      //     : isXChain(network.chainId)
      //     ? AVAX_X_ID
      //     : getLocalTokenId(token)

      //   return {
      //     ...token,
      //     localId,
      //     networkChainId: network.chainId,
      //     isDataAccurate: true
      //   }
      // })

      return {
        chainId,
        accountAddress: address,
        dataAccurate: true,
        error: null,
        tokens: [
          evm.balances.nativeTokenBalance,
          ...(evm.balances.erc20TokenBalances ?? [])
        ]
      }
    }

    case 'btc': {
      const btc = response as BtcGetBalancesResponse
      return {
        chainId,
        accountAddress: address,
        dataAccurate: true,
        error: null,
        tokens: [btc.balances.nativeTokenBalance]
      }
    }

    case 'svm': {
      const svm = response as SvmGetBalancesResponse
      return {
        chainId,
        accountAddress: address,
        dataAccurate: true,
        error: null,
        tokens: [
          svm.balances.nativeTokenBalance,
          ...(svm.balances.splTokenBalances ?? [])
        ]
      }
    }

    case 'avm': {
      const avm = response as AvmGetBalancesResponse
      const cats = avm.balances.categories
      return {
        chainId,
        accountAddress: address,
        dataAccurate: true,
        error: null,
        tokens: [
          avm.balances.nativeTokenBalance,
          ...cats.unlocked,
          ...cats.locked,
          ...Object.values(cats.atomicMemoryUnlocked).flat(),
          ...Object.values(cats.atomicMemoryLocked).flat()
        ]
      }
    }

    case 'pvm': {
      const pvm = response as PvmGetBalancesResponse
      const cats = pvm.balances.categories
      return {
        chainId,
        accountAddress: address,
        dataAccurate: true,
        error: null,
        tokens: [
          pvm.balances.nativeTokenBalance
          // P-chain categories are strings (amounts), so wrap into your token type
        ]
      }
    }

    default: {
      // TODO: Handle error
      return null
    }
  }
}

export class BalanceService {
  /**
   * Fetch balances for multiple accounts across multiple networks.
   * Uses Promise.allSettled so each network resolves independently.
   *
   * @returns a map of accountId → NormalizedBalancesForAccount[]
   * @example
   * {
   *   'some-account-id': [
   *     {
   *       accountId: 'some-account-id',
   *       chainId: 43114,
   *       accountAddress: '0x123',
   *       tokens: [
   *         {
   *           address: '0x123',
   *           balance: '100',
   *           decimals: 18,
   *           symbol: 'ETH',
   *           name: 'Ethereum'
   *         }
   *       ],
   *       dataAccurate: true,
   *       error: null
   *     }
   *   ]
   * }
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async getBalancesForAccounts({
    networks,
    accounts,
    currency,
    customTokens,
    onBalanceLoaded
  }: {
    networks: Network[]
    accounts: Account[]
    currency: string
    customTokens: Record<string, NetworkContractToken[] | undefined>
    onBalanceLoaded?: (
      networkChainId: number,
      partial: Record<AccountId, NormalizedBalancesForAccount>
    ) => void
  }): Promise<Record<AccountId, NormalizedBalancesForAccount[]>> {
    // Final aggregated result
    const finalResults: Record<AccountId, NormalizedBalancesForAccount[]> = {}
    for (const account of accounts) {
      finalResults[account.id] = []
    }

    const networkPromises = networks.map(network =>
      SentryWrapper.startSpan(
        {
          name: 'get-balances',
          contextName: 'svc.balance.get_for_accounts',
          attributes: {
            chainId: network.chainId,
            chainName: network.chainName,
            accountLength: accounts.length
          }
        },
        async span => {
          // Prepare partial result for this single network
          const partial: Record<AccountId, NormalizedBalancesForAccount> = {}

          try {
            const module = await ModuleManager.loadModuleByNetwork(network)

            // Map address → account
            const addressMap = accounts.reduce((acc, account) => {
              acc[getAddressByNetwork(account, network)] = account
              return acc
            }, {} as Record<string, Account>)

            const addresses = Object.keys(addressMap)
            const customTokensForNetwork =
              customTokens[network.chainId.toString()] ?? []
            const storage = coingeckoInMemoryCache

            let balancesResponse: VmGetBalancesResponse

            /**
             * SPECIAL CASE:
             * For AVM / PVM network, module.getBalances()
             * only returns the first address.
             * → We must loop each address and run getBalances in parallel.
             */
            if (isXPNetwork(network)) {
              const perAddressPromises = addresses.map(address =>
                module
                  .getBalances({
                    customTokens: customTokensForNetwork,
                    addresses: [address],
                    currency,
                    network: mapToVmNetwork(network),
                    storage,
                    tokenTypes: [TokenType.NATIVE]
                  })
                  .then(res => ({ address, res }))
                  .catch(err => ({
                    address,
                    res: { [address]: { error: err as Error } }
                  }))
              )

              const settled = await Promise.allSettled(perAddressPromises)

              balancesResponse = settled.reduce((acc, r) => {
                if (r.status === 'fulfilled') {
                  const { address, res } = r.value
                  acc[address] = Object.assign({}, res[address])
                }
                return acc
              }, {} as VmGetBalancesResponse)

              /**
               * NORMAL CASE :
               * For other networks, module.getBalances() handles batching correctly
               * For AVM / PVM network, module.getBalances()
               */
            } else {
              const tokenTypes =
                network.vmName === NetworkVMType.SVM
                  ? [TokenType.NATIVE, TokenType.SPL]
                  : [TokenType.NATIVE, TokenType.ERC20]

              balancesResponse = await module.getBalances({
                customTokens: customTokensForNetwork,
                addresses,
                currency,
                network: mapToVmNetwork(network),
                storage,
                tokenTypes
              })
            }

            console.log('network', network.chainName, network.chainId)
            console.log(
              'balancesResponse',
              JSON.stringify(balancesResponse, null, 2)
            )
            console.log('--------------------------------')
            // Process accounts
            for (const address of addresses) {
              const account = addressMap[address]
              const balances = balancesResponse[address]

              if (!account || !balances) continue

              if ('error' in balances) {
                partial[account.id] = {
                  accountId: account.id,
                  chainId: network.chainId,
                  accountAddress: address,
                  tokens: [],
                  dataAccurate: false,
                  error: balances.error as Error
                }
                continue
              }

              const tokens = Object.values(balances)
                .filter((t): t is TokenWithBalance => !('error' in t))
                .map(token => {
                  const localId = isPChain(network.chainId)
                    ? AVAX_P_ID
                    : isXChain(network.chainId)
                    ? AVAX_X_ID
                    : getLocalTokenId(token)

                  return {
                    ...token,
                    localId,
                    networkChainId: network.chainId,
                    isDataAccurate: true
                  }
                })

              partial[account.id] = {
                accountId: account.id,
                chainId: network.chainId,
                accountAddress: address,
                tokens,
                dataAccurate: true,
                error: null
              }
            }

            // Progressive update callback
            onBalanceLoaded?.(network.chainId, partial)

            // Merge into final result
            for (const accountId of Object.keys(partial)) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              finalResults[accountId]!.push(partial[accountId]!)
            }
          } catch (err) {
            span?.setStatus({
              code: SPAN_STATUS_ERROR,
              message: err instanceof Error ? err.message : 'unknown error'
            })

            Logger.error(
              `[BalanceService][getBalancesForAccounts] failed for network ${network.chainId}`,
              err
            )

            // Create error partial for this network
            const errorPartial: Record<
              AccountId,
              NormalizedBalancesForAccount
            > = {}

            // Mark all accounts errored for this network
            for (const account of accounts) {
              const address = getAddressByNetwork(account, network)

              errorPartial[account.id] = {
                accountId: account.id,
                chainId: network.chainId,
                accountAddress: address,
                tokens: [],
                dataAccurate: false,
                error: err as Error
              }

              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              finalResults[account.id]!.push(errorPartial[account.id]!)
            }
            // Still notify UI for progressive updates
            onBalanceLoaded?.(network.chainId, errorPartial)
          } finally {
            span?.end()
          }
        }
      )
    )

    // Execute everything in parallel
    await Promise.allSettled(networkPromises)

    return finalResults
  }

  async getBalancesForAccounts2({
    networks,
    accounts,
    currency,
    customTokens,
    onBalanceLoaded
  }: {
    networks: Network[]
    accounts: Account[]
    currency: string
    customTokens: Record<string, NetworkContractToken[] | undefined>
    onBalanceLoaded?: (
      networkChainId: number,
      partial: Record<AccountId, NormalizedBalancesForAccount>
    ) => void
  }): Promise<Record<AccountId, NormalizedBalancesForAccount[]>> {
    // Final aggregated result
    const finalResults: Record<AccountId, NormalizedBalancesForAccount[]> = {}
    for (const account of accounts) {
      finalResults[account.id] = []
    }

    // ---- 1) Namespace buckets -------------------------------------------------
    // We'll accumulate into these and then emit one entry per namespace
    let evmBucket: EvmGetBalancesRequestItem | undefined
    let btcBucket: BtcGetBalancesRequestItem | undefined
    let svmBucket: SvmGetBalancesRequestItem | undefined

    const avaxXpBucket: {
      references: AvalancheXpGetBalancesRequestItem['references']
      addresses: string[]
    } = {
      references: [],
      addresses: []
    }

    // ---- 2) Fill buckets from networks ----------------------------------------
    for (const network of networks) {
      // Per-network: map address -> account so you can decode responses later
      const accountsByAddress: Record<string, Account> = {}
      const addresses = accounts.map(acc => {
        const addr = getAddressByNetwork(acc, network)
        accountsByAddress[addr] = acc
        return addr
      })

      switch (network.vmName) {
        case NetworkVMType.EVM: {
          const chainRef = String(network.chainId)
          if (!evmBucket) {
            evmBucket = {
              namespace: BlockchainNamespace.EIP155,
              addresses: uniq(addresses),
              references: [chainRef]
            }
          } else {
            evmBucket.addresses = uniq([...evmBucket.addresses, ...addresses])
            evmBucket.references = uniq([...evmBucket.references, chainRef])
          }
          break
        }

        case NetworkVMType.BITCOIN: {
          const ref = network.isTestnet
            ? '000000000933ea01ad0ee984209779ba'
            : '000000000019d6689c085ae165831e93'

          if (!btcBucket) {
            btcBucket = {
              namespace: BlockchainNamespace.BIP122,
              addresses: uniq(addresses),
              references: [ref]
            }
          } else {
            btcBucket.addresses = uniq([...btcBucket.addresses, ...addresses])
            btcBucket.references = uniq([...btcBucket.references, ref])
          }
          break
        }

        case NetworkVMType.SVM: {
          const ref = network.isTestnet
            ? // TODO use chain id constants
              'EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
            : '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'

          if (!svmBucket) {
            svmBucket = {
              namespace: BlockchainNamespace.SOLANA,
              addresses: uniq(addresses),
              references: [ref]
            }
          } else {
            svmBucket.addresses = uniq([...svmBucket.addresses, ...addresses])
            svmBucket.references = uniq([...svmBucket.references, ref])
          }
          break
        }

        case NetworkVMType.AVM: {
          // Avalanche X-Chain → AVAX XP bucket
          const ref = network.isTestnet
            ? '8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl'
            : 'imji8papUf2EhV3le337w1vgFauqkJg-'

          avaxXpBucket.references = uniq([...avaxXpBucket.references, ref])
          avaxXpBucket.addresses = uniq([
            ...avaxXpBucket.addresses,
            ...addresses.map(xpAddressWithoutPrefix)
          ])
          break
        }

        case NetworkVMType.PVM: {
          // Avalanche P-Chain → AVAX XP bucket
          const ref = network.isTestnet
            ? 'Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG'
            : 'Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo'

          avaxXpBucket.references = uniq([...avaxXpBucket.references, ref])
          avaxXpBucket.addresses = uniq([
            ...avaxXpBucket.addresses,
            ...addresses.map(xpAddressWithoutPrefix)
          ])
          break
        }

        default:
          // ignore unsupported vm types for now
          break
      }
    }

    // ---- 3) Build final requestItems array ------------------------------------
    const requestItems: GetBalancesRequestBody['data'] = []

    if (evmBucket) requestItems.push(evmBucket)
    if (btcBucket) requestItems.push(btcBucket)
    if (svmBucket) requestItems.push(svmBucket)

    // Only add AVAX XP if we actually have addresses + references
    if (
      avaxXpBucket.addresses.length > 0 &&
      avaxXpBucket.references.length > 0
    ) {
      requestItems.push({
        namespace: BlockchainNamespace.AVAX,
        references: avaxXpBucket.references,
        addressDetails: [
          {
            walletId: 'default',
            addresses: avaxXpBucket.addresses
          }
        ],
        filterOutDustUtxos: false
      })
    }

    const body = {
      data: requestItems,
      currency: currency as GetBalancesRequestBody['currency'],
      showUntrustedTokens: false
    }

    console.log('requestItems', JSON.stringify(requestItems, null, 2))
    // const onUpdateWrapper = (update: MarkrQuote[]): void => {
    //   if (abortSignal.aborted) {
    //     throw new Error('aborted')
    //   }
    //   onUpdate(update)
    // }

    const response = await balanceApi.getBalances(body)

    if (!response.body) {
      throw new Error('ReadableStream unavailable')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ''

    console.log('📡 Streaming balances…')

    let done = false

    while (!done) {
      const result = await reader.read()
      done = result.done

      if (result.value) {
        // Append decoded chunk to buffer
        buffer += decoder.decode(result.value, { stream: true })
      }

      // Process complete lines
      let newlineIndex
      while ((newlineIndex = buffer.indexOf(NEWLINE)) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (!line) continue

        // Remove "data: " prefix
        let jsonLine = line
        if (jsonLine.startsWith('data:')) {
          jsonLine = jsonLine.slice(5).trim()
        }

        try {
          const response = JSON.parse(jsonLine) as GetBalancesResponse

          const normalized = convertToNormalizedBalances(response)
          // console.log('response', JSON.stringify(response, null, 2))
          // console.log('normalized', JSON.stringify(normalized, null, 2))
          // console.log('--------------------------------')
          if (!normalized) continue

          // const account = findAccountByAddress(normalized.accountAddress, accounts)
          // if (!account) continue

          // Prepare partial result for this single network
          // const partial: Record<AccountId, NormalizedBalancesForAccount> = {}

          // if ('error' in balances) {
          //   partial[account.id] = {
          //     accountId: account.id,
          //     chainId: network.chainId,
          //     accountAddress: address,
          //     tokens: [],
          //     dataAccurate: false,
          //     error: balances.error as Error
          //   }
          //   continue
          // }

          // const tokens = Object.values(balances)
          //   .filter((t): t is TokenWithBalance => !('error' in t))
          //   .map(token => {
          //     const localId = isPChain(network.chainId)
          //       ? AVAX_P_ID
          //       : isXChain(network.chainId)
          //       ? AVAX_X_ID
          //       : getLocalTokenId(token)

          //     return {
          //       ...token,
          //       localId,
          //       networkChainId: network.chainId,
          //       isDataAccurate: true
          //     }
          //   })

          // partial[account.id] = {
          //   accountId: account.id,
          //   chainId: network.chainId,
          //   accountAddress: address,
          //   tokens,
          //   dataAccurate: true,
          //   error: null
          // }

          // Progressive update callback
          // onBalanceLoaded?.(network.chainId, partial)
        } catch (err) {
          console.error('⚠️ Failed to parse line:', jsonLine, err)
        }
      }
    }

    console.log('✅ Stream finished')

    return finalResults
  }
}

export default new BalanceService()
