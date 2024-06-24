import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { getAddressByNetwork } from 'store/account/utils'
import ModuleManager from 'vmModule/ModuleManager'
import { NULL_ADDRESS } from 'screens/bridge/utils/bridgeUtils'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import Logger from 'utils/Logger'
import BtcActivityService from './BtcActivityService'
import PrimaryActivityService from './PrimaryActivityService'
import {
  GetActivitiesForAccountParams,
  ActivityResponse,
  NetworkActivityService
} from './types'
import { convertTransaction } from './utils/evmTransactionConverter'

const serviceMap: { [K in NetworkVMType]?: NetworkActivityService } = {
  [NetworkVMType.BITCOIN]: BtcActivityService,
  [NetworkVMType.PVM]: PrimaryActivityService,
  [NetworkVMType.AVM]: PrimaryActivityService
}

class ActivityServiceFactory {
  static getService(k: NetworkVMType): NetworkActivityService | undefined {
    return serviceMap[k]
  }
}

export class ActivityService {
  private getActivityServiceForNetwork(
    network: Network
  ): NetworkActivityService {
    const balanceService = ActivityServiceFactory.getService(network.vmName)

    if (!balanceService)
      throw new Error(
        `no activity service found for network ${network.chainId}`
      )

    return balanceService
  }

  async getActivities({
    network,
    account,
    nextPageToken,
    pageSize = 30,
    criticalConfig
  }: GetActivitiesForAccountParams): Promise<ActivityResponse> {
    const address = getAddressByNetwork(account, network)
    try {
      // todo: remove convertChainIdToCaip2 once all modules are implmeneted
      const caip2ChainId = ModuleManager.convertChainIdToCaip2(network)
      const module = await ModuleManager.loadModule(network)
      // todo: remove if statement once all modules are implmeneted
      if (module.getManifest()?.network.chainIds.includes(caip2ChainId)) {
        const rawTxHistory = await module.getTransactionHistory({
          chainId: network.chainId,
          networkToken: network.networkToken,
          isTestnet: network.isTestnet ?? false,
          explorerUrl: network.explorerUrl ?? '',
          address,
          nextPageToken,
          offset: pageSize
        })

        const bridgeAddresses = [
          ...UnifiedBridgeService.getBridgeAddresses().map(item =>
            item.toLowerCase()
          ),
          NULL_ADDRESS
        ]

        const transactions = rawTxHistory.transactions.map(tx =>
          convertTransaction(tx, bridgeAddresses)
        )

        return {
          transactions,
          nextPageToken: rawTxHistory.nextPageToken
        }
      }
    } catch (error) {
      Logger.error('Failed to get transaction', error)
    }

    const activityService = this.getActivityServiceForNetwork(network)
    return activityService.getActivities({
      network,
      address,
      nextPageToken,
      pageSize,
      criticalConfig
    })
  }
}

export default new ActivityService()
