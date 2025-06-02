import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkToken,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { avaxSerial } from '@avalabs/avalanchejs'
import { TransactionResponse } from 'ethers'
import { ChainID, Networks } from 'store/network/types'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { DebankNetwork } from 'services/network/types'
import { addIdToPromise, settleAllIdPromises } from '@avalabs/evm-module'
import { Module } from '@avalabs/vm-module-types'
import { SpanName } from 'services/sentry/types'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { ChainInfo } from '@avalabs/glacier-sdk'
import GlacierService from 'services/glacier/GlacierService'
import { NETWORK_P, NETWORK_P_TEST, NETWORK_X, NETWORK_X_TEST } from './consts'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Network service is disabled.')

class NetworkService {
  async getNetworks({
    includeSolana
  }: {
    includeSolana: boolean
  }): Promise<Networks> {
    const erc20Networks = await this.fetchPrimaryNetworks({
      includeSolana
    }).catch(reason => {
      Logger.error(`[NetworkService][fetchERC20Networks]${reason}`)
      return {} as Networks
    })
    const deBankNetworks = await this.fetchDeBankNetworks().catch(reason => {
      Logger.error(`[NetworkService][fetchDeBankNetworks]${reason}`)
      return {} as Networks
    })

    delete erc20Networks[ChainId.AVALANCHE_LOCAL_ID]

    return {
      ...erc20Networks,
      ...deBankNetworks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
      [ChainId.AVALANCHE_P]: NETWORK_P,
      [ChainId.AVALANCHE_TEST_P]: NETWORK_P_TEST,
      [ChainId.AVALANCHE_X]: NETWORK_X,
      [ChainId.AVALANCHE_TEST_X]: NETWORK_X_TEST
    }
  }

  async getProviderForNetwork(
    network: Network
  ): ReturnType<Module['getProvider']> {
    const module = await ModuleManager.loadModuleByNetwork(network)
    return module.getProvider(mapToVmNetwork(network))
  }

  async sendTransaction({
    signedTx,
    network,
    sentrySpanName = 'send-transaction',
    handleWaitToPost
  }: {
    signedTx: string | avaxSerial.SignedTx
    network: Network
    sentrySpanName?: SpanName
    handleWaitToPost?: (txResponse: TransactionResponse) => void
  }): Promise<string> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.network.send_transaction' },
      async () => {
        if (!network) {
          throw new Error('No active network')
        }

        let txID: string | undefined
        const provider = await this.getProviderForNetwork(network)

        if (
          signedTx instanceof avaxSerial.SignedTx &&
          provider instanceof Avalanche.JsonRpcProvider
        ) {
          txID = (await provider.issueTx(signedTx)).txID
        } else if (typeof signedTx === 'string') {
          if (provider instanceof JsonRpcBatchInternal) {
            const tx = await provider.broadcastTransaction(signedTx)
            handleWaitToPost?.(tx)
            txID = tx.hash
          } else if (provider instanceof BitcoinProvider) {
            txID = await provider.issueRawTx(signedTx)
          }
        }

        if (txID === undefined) {
          throw new Error('No provider found')
        }

        return txID
      }
    )
  }

  /**
   * Returns the network object for Avalanche P Chain
   */
  getAvalancheNetworkP(isDeveloperMode: boolean): Network {
    return isDeveloperMode ? NETWORK_P_TEST : NETWORK_P
  }

  /**
   * Returns the network object for Avalanche X Chain
   */
  getAvalancheNetworkX(isDeveloperMode: boolean): Network {
    return isDeveloperMode ? NETWORK_X_TEST : NETWORK_X
  }

  /**
   * Returns the provider used by Avalanche X/P/CoreEth chains.
   * Using either X or P Network will result in same provider.
   */
  async getAvalancheProviderXP(
    isDeveloperMode: boolean
  ): Promise<Avalanche.JsonRpcProvider> {
    const network = this.getAvalancheNetworkP(isDeveloperMode)
    return ModuleManager.avalancheModule.getProvider(mapToVmNetwork(network))
  }

  private async fetchPrimaryNetworks({
    includeSolana
  }: {
    includeSolana: boolean
  }): Promise<Networks> {
    const url = includeSolana
      ? `${Config.PROXY_URL}/networks?includeSolana`
      : `${Config.PROXY_URL}/networks`

    const response = await fetch(url)
    const networks: Network[] = await response.json()

    return networks.reduce((acc, network) => {
      acc[network.chainId] = network
      return acc
    }, {} as Networks)
  }

  private async fetchDeBankNetworks(): Promise<Networks> {
    const response = await fetch(
      `${Config.PROXY_URL}/proxy/debank/v1/chain/list`
    )
    if (!response.ok) {
      throw Error('fetchDeBankNetworks failed: ' + response.statusText)
    }
    const deBankNetworks: DebankNetwork[] = await response.json()

    const networks = deBankNetworks
      .filter(network =>
        ['arb', 'bsc', 'op', 'matic', 'base'].includes(network.id)
      )
      .reduce(
        (acc, network) => {
          acc[network.community_id] = {
            platformChainId: network.id,
            chainId: network.community_id,
            chainName: network.name,
            logoUri: network.logo_url,
            vmName: NetworkVMType.EVM,
            vmId: network.id,
            isTestnet: false,
            networkToken: {} as NetworkToken,
            nativeTokenId: network.native_token_id
          } as Network & { nativeTokenId: string }
          return acc
        },
        {} as {
          [chainId: ChainID]: Network & { nativeTokenId: string }
        }
      )

    //fetch info about native tokens
    const promises = Object.keys(networks).map(chainId => {
      const network = networks[Number(chainId)]
      if (!network) {
        return Promise.reject('invalid chain id: ' + chainId)
      }
      return addIdToPromise(
        (async () => {
          const tokenResponse = await fetch(
            `${Config.PROXY_URL}/proxy/debank/v1/token?chain_id=${chainId}&id=${network.nativeTokenId}`
          )
          if (!tokenResponse.ok) {
            throw Error('Failed to fetch debank/v1/token')
          }
          return await tokenResponse.json() //as DeBankToken
        })(),
        chainId
      )
    })

    const nativeTokenInfos = await settleAllIdPromises(promises)
    const networksWithToken: Networks = {}
    for (const chainId in nativeTokenInfos) {
      const nativeTokenInfo = nativeTokenInfos[chainId]
      if (!nativeTokenInfo || 'error' in nativeTokenInfo) {
        continue
      }
      const { nativeTokenId, ...networkWithToken } = {
        ...networks[Number(chainId)],
        networkToken: {
          symbol: nativeTokenInfo.symbol,
          logoUri: nativeTokenInfo.logo_url,
          decimals: nativeTokenInfo.decimals,
          name: nativeTokenInfo.name
        } as NetworkToken
      }
      networksWithToken[Number(chainId)] = networkWithToken as Network
    }

    return networksWithToken
  }

  async fetchLastTransactedERC20Networks({
    address
  }: {
    address: string
  }): Promise<Networks> {
    const response = await GlacierService.listAddressChains({ address })
    if (
      response.indexedChains === undefined ||
      response.indexedChains?.length === 0
    ) {
      return {}
    }

    return response.indexedChains.reduce((acc, chainInfo) => {
      acc[Number(chainInfo.chainId)] = this.formatChainInfo(chainInfo)
      return acc
    }, {} as Networks)
  }

  private formatChainInfo(chainInfo: ChainInfo): Network {
    return {
      ...chainInfo,
      chainId: Number(chainInfo.chainId),
      logoUri: chainInfo.chainLogoUri ?? '',
      explorerUrl: chainInfo.explorerUrl ?? '',
      vmName: NetworkVMType.EVM,
      description: chainInfo.description ?? '',
      networkToken: {
        ...chainInfo.networkToken,
        description: chainInfo.description ?? '',
        logoUri: chainInfo.networkToken?.logoUri ?? ''
      },
      utilityAddresses: {
        multicall: chainInfo.utilityAddresses?.multicall ?? ''
      }
    }
  }
}

export default new NetworkService()
