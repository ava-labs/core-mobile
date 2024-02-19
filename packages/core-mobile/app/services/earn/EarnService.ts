import { getPvmApi } from 'utils/network/pvm'
import { Account, AccountCollection } from 'store/account'
import { exportC } from 'services/earn/exportC'
import { importP, importPWithBalanceCheck } from 'services/earn/importP'
import Big from 'big.js'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'
import { importC } from 'services/earn/importC'
import { exportP } from 'services/earn/exportP'
import WalletService from 'services/wallet/WalletService'
import {
  AddDelegatorProps,
  AvalancheTransactionRequest
} from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/wallets-sdk'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import {
  AddDelegatorTransactionProps,
  CollectTokensForStakingParams,
  GetAllStakesParams,
  RecoveryEvents
} from 'services/earn/types'
import { getUnixTime } from 'date-fns'
import {
  GetCurrentSupplyResponse,
  GetCurrentValidatorsResponse
} from '@avalabs/avalanchejs-v2/dist/vms/pvm'
import { Seconds } from 'types/siUnits'
import {
  BlockchainId,
  Network,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import { Avax } from 'types/Avax'
import { getInfoApi } from 'utils/network/info'
import { GetPeersResponse } from '@avalabs/avalanchejs-v2/dist/info/model'
import { isOnGoing } from 'utils/earn/status'
import { glacierApi } from 'utils/network/glacier'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  getTransformedTransactions,
  maxGetAtomicUTXOsRetries,
  maxTransactionStatusCheckRetries
} from './utils'

class EarnService {
  /**
   * Get all available nodes
   * @param isTestnet is testnet mode enabled
   */
  getCurrentValidators = (
    isTestnet: boolean
  ): Promise<GetCurrentValidatorsResponse> => {
    return getPvmApi(isTestnet).getCurrentValidators()
  }

  /**
   * Checks if there are any stuck atomic UTXOs and tries to import them.
   * You can pass callback to get events about progress of operation.
   * See {@link RecoveryEvents} for details on events.
   * Also see {@link https://ava-labs.atlassian.net/wiki/spaces/EN/pages/2372141084/Cross+chain+retry+logic}
   * for additional explanation.
   */
  async importAnyStuckFunds({
    activeAccount,
    isDevMode,
    progressEvents
  }: {
    activeAccount: Account
    isDevMode: boolean
    progressEvents?: (events: RecoveryEvents) => void
  }): Promise<void> {
    Logger.trace('Start importAnyStuckFunds')
    const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

    const { pChainUtxo, cChainUtxo } = await retry({
      operation: retryIndex => {
        if (retryIndex !== 0) {
          progressEvents?.(RecoveryEvents.GetAtomicUTXOsFailIng)
        }
        return WalletService.getAtomicUTXOs({
          accountIndex: activeAccount.index,
          avaxXPNetwork
        })
      },
      isSuccess: result => !!result.pChainUtxo && !!result.cChainUtxo,
      maxRetries: maxGetAtomicUTXOsRetries,
      backoffPolicy: RetryBackoffPolicy.constant(2)
    })
    progressEvents?.(RecoveryEvents.Idle)
    if (pChainUtxo.getUTXOs().length !== 0) {
      progressEvents?.(RecoveryEvents.ImportPStart)
      await importPWithBalanceCheck({ activeAccount, isDevMode })
      progressEvents?.(RecoveryEvents.ImportPFinish)
    }

    if (cChainUtxo.getUTXOs().length !== 0) {
      progressEvents?.(RecoveryEvents.ImportCStart)
      await importC({
        activeAccount,
        isDevMode
      })
      progressEvents?.(RecoveryEvents.ImportCFinish)
    }
    Logger.trace('ImportAnyStuckFunds finished')
  }

  /**
   * Collect tokens for staking by moving Avax from C to P-chain
   */
  async collectTokensForStaking({
    cChainBalance,
    requiredAmount,
    activeAccount,
    isDevMode
  }: CollectTokensForStakingParams): Promise<void> {
    if (requiredAmount.isZero()) {
      Logger.info('no need to cross chain')
      return
    }
    await exportC({
      cChainBalance,
      requiredAmount,
      activeAccount,
      isDevMode
    })
    await importP({
      activeAccount,
      isDevMode
    })
  }

  /**
   * Collect staking rewards by moving Avax from P to C-chain
   *
   * @param pChainBalance
   * @param requiredAmount
   * @param activeAccount
   * @param isDevMode
   */
  // eslint-disable-next-line max-params
  async claimRewards(
    pChainBalance: Avax,
    requiredAmount: Avax,
    activeAccount: Account,
    isDevMode: boolean
  ): Promise<void> {
    await exportP({
      pChainBalance,
      requiredAmount,
      activeAccount,
      isDevMode
    })
    await importC({
      activeAccount,
      isDevMode
    })
  }

  /**
   *
   * @param amount
   * @param duration in s
   * @param currentSupply
   * @param delegationFee in percent
   * @param isDeveloperMode
   */
  // eslint-disable-next-line max-params
  calcReward(
    amount: Avax,
    duration: Seconds,
    currentSupply: Avax,
    delegationFee: number,
    isDeveloperMode: boolean
  ): Avax {
    const defPlatformVals = isDeveloperMode ? FujiParams : MainnetParams
    const minConsumptionRateRatio = new Big(
      defPlatformVals.stakingConfig.RewardConfig.MinConsumptionRate
    )
    const maxConsumptionRateRatio = new Big(
      defPlatformVals.stakingConfig.RewardConfig.MaxConsumptionRate
    )
    const stakingPeriodOverMintingPeriod = new Big(duration.toString()).div(
      new Big(defPlatformVals.stakingConfig.RewardConfig.MintingPeriod)
    )
    const effectiveConsumptionRate = minConsumptionRateRatio
      .mul(new Big(1).minus(stakingPeriodOverMintingPeriod))
      .add(maxConsumptionRateRatio.mul(stakingPeriodOverMintingPeriod))

    const stakeOverSupply = amount.div(currentSupply)
    const supplyCap = Avax.fromNanoAvax(
      defPlatformVals.stakingConfig.RewardConfig.SupplyCap
    )
    const unmintedSupply = supplyCap.sub(currentSupply)
    const fullReward = unmintedSupply
      .mul(stakeOverSupply)
      .mul(stakingPeriodOverMintingPeriod)
      .mul(effectiveConsumptionRate)

    const delegationFeeRatio = Big(delegationFee).div(100)
    return fullReward.mul(Big(1).minus(delegationFeeRatio))
  }

  async issueAddDelegatorTransaction({
    activeAccount,
    nodeId,
    stakeAmount,
    startDate,
    endDate,
    isDevMode
  }: AddDelegatorTransactionProps): Promise<string> {
    const startDateUnix = getUnixTime(startDate)
    const endDateUnix = getUnixTime(endDate)
    const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)
    const rewardAddress = activeAccount.addressPVM
    const unsignedTx = await WalletService.createAddDelegatorTx({
      accountIndex: activeAccount.index,
      avaxXPNetwork,
      rewardAddress,
      nodeId,
      startDate: startDateUnix,
      endDate: endDateUnix,
      stakeAmount,
      isDevMode
    } as AddDelegatorProps)

    const signedTxJson = await WalletService.sign(
      { tx: unsignedTx } as AvalancheTransactionRequest,
      activeAccount.index,
      avaxXPNetwork
    )
    const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

    const txID = await NetworkService.sendTransaction(signedTx, avaxXPNetwork)

    AnalyticsService.captureWithEncryption('StakeTransactionStarted', {
      txHash: txID,
      chainId: avaxXPNetwork.chainId
    })
    Logger.trace('txID', txID)

    const avaxProvider = NetworkService.getProviderForNetwork(
      avaxXPNetwork
    ) as Avalanche.JsonRpcProvider

    try {
      await retry({
        operation: () => avaxProvider.getApiP().getTxStatus({ txID }),
        isSuccess: result => result.status === 'Committed',
        maxRetries: maxTransactionStatusCheckRetries
      })
    } catch (e) {
      Logger.error('issueAddDelegatorTransaction failed', e)
      throw Error(`AddDelegator failed. txId = ${txID}. ${e}`)
    }
    return txID
  }

  /**
   * Retrieve the upper bound on the number of tokens that exist in P-chain
   * This is an upper bound because it does not account for burnt tokens, including transaction fees.
   */
  getCurrentSupply(isTestnet: boolean): Promise<GetCurrentSupplyResponse> {
    return getPvmApi(isTestnet).getCurrentSupply()
  }

  /**
   * Retrieve all stakes for given addresses on P chain
   *
   * @param isTestnet
   * @param addresses
   */
  getAllStakes = async ({
    isTestnet,
    addresses
  }: GetAllStakesParams): Promise<PChainTransaction[]> => {
    const addressesStr = addresses.join(',')
    let pageToken: string | undefined
    const transactions: PChainTransaction[] = []

    do {
      const response = await glacierApi.listLatestPrimaryNetworkTransactions({
        params: {
          network: isTestnet ? Network.FUJI : Network.MAINNET,
          blockchainId: BlockchainId.P_CHAIN
        },
        queries: {
          addresses: addressesStr,
          pageSize: 100,
          sortOrder: SortOrder.DESC,
          pageToken
        }
      })
      pageToken = response.nextPageToken
      transactions.push(...(response.transactions as PChainTransaction[]))
    } while (pageToken)

    return transactions.filter(
      transaction =>
        transaction.txType ===
          PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX ||
        transaction.txType === PChainTransactionType.ADD_DELEGATOR_TX
    )
  }

  getTransformedStakesForAllAccounts = async ({
    isDeveloperMode,
    accounts
  }: {
    isDeveloperMode: boolean
    accounts: AccountCollection
  }): Promise<
    | {
        txHash: string
        endTimestamp: number | undefined
        accountIndex: number
        isDeveloperMode: boolean
        isOnGoing: boolean
      }[]
    | undefined
  > => {
    const accountsArray = Object.values(accounts)

    try {
      const currentNetworkAddresses = accountsArray
        .map(account => account.addressPVM)
        .filter((address): address is string => address !== undefined)
      const currentNetworkTransactions = await getTransformedTransactions(
        currentNetworkAddresses,
        isDeveloperMode
      )

      const oppositeNetworkAddresses = (
        await Promise.all(
          accountsArray.map(account =>
            WalletService.getAddresses(account.index, !isDeveloperMode)
          )
        )
      ).map(address => address.PVM)
      const oppositeNetworkTransactions = await getTransformedTransactions(
        oppositeNetworkAddresses,
        !isDeveloperMode
      )

      const now = new Date()
      return currentNetworkTransactions
        .concat(oppositeNetworkTransactions)
        .map(transaction => {
          return {
            txHash: transaction.txHash,
            endTimestamp: transaction.endTimestamp,
            accountIndex: Number(transaction.index),
            isDeveloperMode: transaction.isDeveloperMode,
            isOnGoing: isOnGoing(transaction, now)
          }
        })
    } catch (error) {
      Logger.error('getTransformedStakesForAllAccounts failed: ', error)
    }
  }

  /**
   * Get a description of peer connections.
   * @param nodeIds
   */
  getPeers = (
    isTestnet: boolean,
    nodeIds?: string[]
  ): Promise<GetPeersResponse> => {
    return getInfoApi(isTestnet).peers(nodeIds)
  }
}

export default new EarnService()
