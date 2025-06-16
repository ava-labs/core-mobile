import { Account, AccountCollection } from 'store/account/types'
import { importPWithBalanceCheck } from 'services/earn/importP'
import Big from 'big.js'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'
import { importC } from 'services/earn/importC'
import { exportP } from 'services/earn/exportP'
import WalletService from 'services/wallet/WalletService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { pvm, UnsignedTx } from '@avalabs/avalanchejs'
import Logger from 'utils/Logger'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import {
  AddDelegatorTransactionProps,
  RecoveryEvents
} from 'services/earn/types'
import { getUnixTime } from 'date-fns'
import {
  GetCurrentSupplyResponse,
  GetCurrentValidatorsResponse
} from '@avalabs/avalanchejs/dist/vms/pvm'
import { Seconds } from 'types/siUnits'
import {
  BlockchainId,
  Network as GlacierNetwork,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import { GetPeersResponse } from '@avalabs/avalanchejs/dist/info/model'
import { isOnGoing } from 'utils/earn/status'
import { glacierApi } from 'utils/network/glacier'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { AvaxXP } from 'types/AvaxXP'
import {
  getTransformedTransactions,
  maxGetAtomicUTXOsRetries,
  maxTransactionStatusCheckRetries
} from './utils'

class EarnService {
  /**
   * Get all available nodes
   * @param provider
   */
  getCurrentValidators = (
    provider: Avalanche.JsonRpcProvider
  ): Promise<GetCurrentValidatorsResponse> => {
    return provider.getApiP().getCurrentValidators()
  }

  /**
   * Checks if there are any stuck atomic UTXOs and tries to import them.
   * You can pass callback to get events about progress of operation.
   * See {@link RecoveryEvents} for details on events.
   * Also see {@link https://ava-labs.atlassian.net/wiki/spaces/EN/pages/2372141084/Cross+chain+retry+logic}
   * for additional explanation.
   */
  async importAnyStuckFunds({
    walletId,
    walletType,
    activeAccount,
    isDevMode,
    selectedCurrency,
    progressEvents,
    feeState,
    cBaseFeeMultiplier
  }: {
    walletId: string
    walletType: WalletType
    activeAccount: Account
    isDevMode: boolean
    selectedCurrency: string
    progressEvents?: (events: RecoveryEvents) => void
    feeState?: pvm.FeeState
    cBaseFeeMultiplier: number
  }): Promise<void> {
    Logger.trace('Start importAnyStuckFunds')
    const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)

    const { pChainUtxo, cChainUtxo } = await retry({
      operation: retryIndex => {
        if (retryIndex !== 0) {
          progressEvents?.(RecoveryEvents.GetAtomicUTXOsFailIng)
        }
        return WalletService.getAtomicUTXOs({
          walletId,
          walletType,
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
      await importPWithBalanceCheck({
        walletId,
        walletType,
        activeAccount,
        isDevMode,
        selectedCurrency,
        feeState
      })
      progressEvents?.(RecoveryEvents.ImportPFinish)
    }

    if (cChainUtxo.getUTXOs().length !== 0) {
      progressEvents?.(RecoveryEvents.ImportCStart)
      await importC({
        walletId,
        walletType,
        activeAccount,
        isDevMode,
        cBaseFeeMultiplier
      })
      progressEvents?.(RecoveryEvents.ImportCFinish)
    }
    Logger.trace('ImportAnyStuckFunds finished')
  }

  /**
   * Collect staking rewards by moving Avax from P to C-chain
   *
   * @param pChainBalance
   * @param requiredAmount
   * @param activeAccount
   * @param isDevMode
   */
  async claimRewards({
    walletId,
    walletType,
    pChainBalance,
    requiredAmount,
    activeAccount,
    isDevMode,
    feeState,
    cBaseFeeMultiplier
  }: {
    walletId: string
    walletType: WalletType
    pChainBalance: TokenUnit
    requiredAmount: TokenUnit
    activeAccount: Account
    isDevMode: boolean
    feeState?: pvm.FeeState
    cBaseFeeMultiplier: number
  }): Promise<void> {
    await exportP({
      walletId,
      walletType,
      pChainBalance,
      requiredAmount,
      activeAccount,
      isDevMode,
      feeState
    })
    await importC({
      walletId,
      walletType,
      activeAccount,
      isDevMode,
      cBaseFeeMultiplier
    })
  }

  /**
   *
   * @param amountNanoAvax in nAvax
   * @param duration in s
   * @param currentSupply
   * @param delegationFee in percent
   * @param isDeveloperMode
   */
  // eslint-disable-next-line max-params
  calcReward(
    amountNanoAvax: bigint,
    duration: Seconds,
    currentSupply: TokenUnit,
    delegationFee: number,
    isDeveloperMode: boolean
  ): TokenUnit {
    const amount = AvaxXP.fromNanoAvax(amountNanoAvax)

    const avaxPNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
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
    const nAvax = defPlatformVals.stakingConfig.RewardConfig.SupplyCap
    const supplyCap = new TokenUnit(
      nAvax,
      avaxPNetwork.networkToken.decimals,
      avaxPNetwork.networkToken.symbol
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
    walletId,
    walletType,
    activeAccount,
    nodeId,
    stakeAmountNanoAvax,
    startDate,
    endDate,
    isDevMode,
    feeState,
    pFeeAdjustmentThreshold
  }: AddDelegatorTransactionProps & {
    walletId: string
    walletType: WalletType
  }): Promise<string> {
    const startDateUnix = getUnixTime(startDate)
    const endDateUnix = getUnixTime(endDate)
    const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)
    const rewardAddress = activeAccount.addressPVM

    const unsignedTx = await WalletService.createAddDelegatorTx({
      walletId,
      walletType,
      accountIndex: activeAccount.index,
      avaxXPNetwork,
      rewardAddress,
      nodeId,
      startDate: startDateUnix,
      endDate: endDateUnix,
      stakeAmountInNAvax: stakeAmountNanoAvax,
      isDevMode,
      feeState,
      pFeeAdjustmentThreshold
    })

    const signedTxJson = await WalletService.sign({
      walletId,
      walletType,
      transaction: { tx: unsignedTx } as AvalancheTransactionRequest,
      accountIndex: activeAccount.index,
      network: avaxXPNetwork
    })
    const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

    const txID = await NetworkService.sendTransaction({
      signedTx,
      network: avaxXPNetwork
    })

    AnalyticsService.captureWithEncryption('StakeTransactionStarted', {
      txHash: txID,
      chainId: avaxXPNetwork.chainId
    })
    Logger.trace('txID', txID)

    const avaxProvider = await NetworkService.getAvalancheProviderXP(isDevMode)

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
  getCurrentSupply(
    provider: Avalanche.JsonRpcProvider
  ): Promise<GetCurrentSupplyResponse> {
    return provider.getApiP().getCurrentSupply()
  }

  /**
   * Retrieve all stakes for given addresses on P chain
   *
   * @param isTestnet
   * @param addresses
   */
  getAllStakes = async ({
    isTestnet,
    addresses,
    startTimestamp
  }: {
    isTestnet: boolean
    addresses: string[]
    startTimestamp?: number
  }): Promise<PChainTransaction[]> => {
    const addressesStr = addresses.join(',')
    let pageToken: string | undefined
    const transactions: PChainTransaction[] = []

    do {
      const response = await glacierApi.listLatestPrimaryNetworkTransactions({
        params: {
          network: isTestnet ? GlacierNetwork.FUJI : GlacierNetwork.MAINNET,
          blockchainId: BlockchainId.P_CHAIN
        },
        queries: {
          addresses: addressesStr,
          pageSize: 100,
          sortOrder: SortOrder.DESC,
          pageToken,
          txTypes: [
            PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX,
            PChainTransactionType.ADD_DELEGATOR_TX
          ],
          startTimestamp
        }
      })
      pageToken = response.nextPageToken
      transactions.push(...(response.transactions as PChainTransaction[]))
    } while (pageToken)

    return transactions
  }

  getTransformedStakesForAllAccounts = async ({
    walletId,
    walletType,
    accounts,
    network,
    startTimestamp
  }: {
    walletId: string
    walletType: WalletType
    accounts: AccountCollection
    network: Network
    startTimestamp?: number
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
    const isDeveloperMode = Boolean(network.isTestnet)
    const accountsArray = Object.values(accounts)

    try {
      const currentNetworkAddresses = accountsArray
        .map(account => account.addressPVM)
        .filter((address): address is string => address !== undefined)
      const currentNetworkTransactions = await getTransformedTransactions(
        currentNetworkAddresses,
        isDeveloperMode,
        startTimestamp
      )

      const oppositeNetworkAddresses = (
        await Promise.all(
          accountsArray.map(account =>
            WalletService.getAddresses({
              walletId,
              walletType,
              accountIndex: account.index,
              network
            })
          )
        )
      ).map(address => address.PVM)
      const oppositeNetworkTransactions = await getTransformedTransactions(
        oppositeNetworkAddresses,
        !isDeveloperMode,
        startTimestamp
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
   * @param provider
   * @param nodeIds
   */
  getPeers = (
    provider: Avalanche.JsonRpcProvider,
    nodeIds?: string[]
  ): Promise<GetPeersResponse> => {
    return provider.getInfo().peers(nodeIds)
  }
}

export default new EarnService()
