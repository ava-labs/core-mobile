import { Account } from 'store/account/types'
import { importPWithBalanceCheck } from 'services/earn/importP'
import Big from 'big.js'
import { FujiParams, MainnetParams } from 'utils/NetworkParams'
import { importC } from 'services/earn/importC'
import { exportP } from 'services/earn/exportP'
import WalletService from 'services/wallet/WalletService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { pvm, UnsignedTx, info } from '@avalabs/avalanchejs'
import Logger from 'utils/Logger'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import {
  AddDelegatorTransactionProps,
  RecoveryEvents
} from 'services/earn/types'
import { getUnixTime } from 'date-fns'
import { Seconds } from 'types/siUnits'
import {
  BlockchainId,
  Network as GlacierNetwork,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import { isOnGoing } from 'utils/earn/status'
import { glacierApi } from 'utils/apiClient/glacier/glacierApi'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { AvaxXP } from 'types/AvaxXP'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { getAddressesFromXpubXP } from 'utils/getAddressesFromXpubXP'
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
  ): Promise<pvm.GetCurrentValidatorsResponse> => {
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
    account,
    isTestnet,
    selectedCurrency,
    progressEvents,
    feeState,
    cBaseFeeMultiplier
  }: {
    walletId: string
    walletType: WalletType
    account: Account
    isTestnet: boolean
    selectedCurrency: string
    progressEvents?: (events: RecoveryEvents) => void
    feeState?: pvm.FeeState
    cBaseFeeMultiplier: number
  }): Promise<void> {
    Logger.trace('Start importAnyStuckFunds')

    const { pChainUtxo, cChainUtxo } = await retry({
      operation: retryIndex => {
        if (retryIndex !== 0) {
          progressEvents?.(RecoveryEvents.GetAtomicUTXOsFailIng)
        }
        return AvalancheWalletService.getAtomicUTXOs({
          account,
          isTestnet
        })
      },
      shouldStop: result => !!result.pChainUtxo && !!result.cChainUtxo,
      maxRetries: maxGetAtomicUTXOsRetries,
      backoffPolicy: RetryBackoffPolicy.constant(2)
    })
    progressEvents?.(RecoveryEvents.Idle)
    if (pChainUtxo.getUTXOs().length !== 0) {
      progressEvents?.(RecoveryEvents.ImportPStart)
      await importPWithBalanceCheck({
        walletId,
        walletType,
        account,
        isTestnet,
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
        account,
        isTestnet,
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
   * @param account
   * @param isTestnet
   */
  async claimRewards({
    walletId,
    walletType,
    pChainBalance,
    requiredAmount,
    account,
    isTestnet,
    feeState,
    cBaseFeeMultiplier
  }: {
    walletId: string
    walletType: WalletType
    pChainBalance: TokenUnit
    requiredAmount: TokenUnit
    account: Account
    isTestnet: boolean
    feeState?: pvm.FeeState
    cBaseFeeMultiplier: number
  }): Promise<void> {
    await exportP({
      walletId,
      walletType,
      pChainBalance,
      requiredAmount,
      account,
      isTestnet,
      feeState
    })
    await importC({
      walletId,
      walletType,
      account,
      isTestnet,
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
    account,
    isTestnet,
    nodeId,
    stakeAmountNanoAvax,
    startDate,
    endDate,
    feeState,
    pFeeAdjustmentThreshold
  }: AddDelegatorTransactionProps & {
    walletId: string
    walletType: WalletType
  }): Promise<string> {
    const startDateUnix = getUnixTime(startDate)
    const endDateUnix = getUnixTime(endDate)
    const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isTestnet)
    const rewardAddress = account.addressPVM

    const unsignedTx = await AvalancheWalletService.createAddDelegatorTx({
      account,
      isTestnet,
      rewardAddress,
      nodeId,
      startDate: startDateUnix,
      endDate: endDateUnix,
      stakeAmountInNAvax: stakeAmountNanoAvax,
      feeState,
      pFeeAdjustmentThreshold
    })

    const signedTxJson = await WalletService.sign({
      walletId,
      walletType,
      transaction: {
        tx: unsignedTx,
        externalIndices: account.xpAddresses.map(xpAddress => xpAddress.index)
      } as AvalancheTransactionRequest,
      accountIndex: account.index,
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

    const avaxProvider = await NetworkService.getAvalancheProviderXP(isTestnet)

    try {
      await retry({
        operation: () => avaxProvider.getApiP().getTxStatus({ txID }),
        shouldStop: result => result.status === 'Committed',
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
  ): Promise<pvm.GetCurrentSupplyResponse> {
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
    startTimestamp,
    sortOrder = SortOrder.DESC
  }: {
    isTestnet: boolean
    addresses: string[]
    startTimestamp?: number
    sortOrder?: SortOrder
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
          sortOrder,
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
    isTestnet,
    startTimestamp
  }: {
    walletId: string
    walletType: WalletType
    accounts: Account[]
    isTestnet: boolean
    startTimestamp?: number
  }): Promise<
    | {
        txHash: string
        endTimestamp: number | undefined
        accountId: string
        isDeveloperMode: boolean
        isOnGoing: boolean
      }[]
    | undefined
  > => {
    try {
      const currentNetworkAddressResults = await Promise.all(
        accounts.map(account =>
          getAddressesFromXpubXP({
            isDeveloperMode: isTestnet,
            walletId,
            walletType,
            accountIndex: account.index,
            onlyWithActivity: true
          })
        )
      )
      const currentNetworkAddresses = currentNetworkAddressResults
        .flatMap(address => address.xpAddresses)
        .map(address => address.address)

      const currentNetworkTransactions =
        currentNetworkAddresses.length > 0
          ? await getTransformedTransactions(
              currentNetworkAddresses,
              isTestnet,
              startTimestamp
            )
          : []

      const oppositeNetworkAddressResults = await Promise.all(
        accounts.map(account =>
          getAddressesFromXpubXP({
            isDeveloperMode: !isTestnet,
            walletId,
            walletType,
            accountIndex: account.index,
            onlyWithActivity: true
          })
        )
      )
      const oppositeNetworkAddresses = oppositeNetworkAddressResults
        .flatMap(address => address.xpAddresses)
        .map(address => address.address)
      const oppositeNetworkTransactions = await getTransformedTransactions(
        oppositeNetworkAddresses,
        !isTestnet,
        startTimestamp
      )

      const now = new Date()
      return currentNetworkTransactions
        .concat(oppositeNetworkTransactions)
        .flatMap(transaction => {
          // find account that matches the transaction's index
          const account = accounts.find(acc => acc.index === transaction.index)

          // flat map will remove this
          if (!account) return []

          return {
            txHash: transaction.txHash,
            endTimestamp: transaction.endTimestamp,
            accountId: account.id,
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
  ): Promise<info.GetPeersResponse> => {
    return provider.getInfo().peers(nodeIds)
  }
}

export default new EarnService()
