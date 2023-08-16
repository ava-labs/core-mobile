import { getPvmApi } from 'utils/network/pvm'
import { Account } from 'store/account'
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
import { retry } from 'utils/js/retry'
import {
  AddDelegatorTransactionProps,
  CollectTokensForStakingParams,
  GetAllStakesParams,
  RecoveryEvents
} from 'services/earn/types'
import { getUnixTime } from 'date-fns'
import { GetCurrentSupplyResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/pvm'
import { Seconds } from 'types/siUnits'
import {
  BlockchainId,
  Network,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import { glacierSdk } from 'utils/network/glacier'
import { Avax } from 'types/Avax'
import { maxTransactionStatusCheckRetries } from './utils'

class EarnService {
  /**
   * Get all available nodes
   * @param isTestnet is testnet mode enabled
   */
  getCurrentValidators = (isTestnet: boolean) => {
    return getPvmApi(isTestnet).getCurrentValidators()
  }

  /**
   * Checks if there are any stuck atomic UTXOs and tries to import them.
   * You can pass Signal object to get events about progress of operation.
   * See {@link RecoveryEvents} for details on events.
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
    const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)
    const { pChainUtxo, cChainUtxo } = await WalletService.getAtomicUTXOs({
      accountIndex: activeAccount.index,
      avaxXPNetwork
    })
    if (pChainUtxo.getUTXOs().length !== 0) {
      progressEvents?.(RecoveryEvents.ImportPStart)
      await importPWithBalanceCheck({ activeAccount, isDevMode })
      progressEvents?.(RecoveryEvents.ImportPFinish)
    }

    if (cChainUtxo.getUTXOs().length !== 0) {
      progressEvents?.(RecoveryEvents.ImportCStart)
      await retry({
        operation: async () =>
          importC({
            activeAccount,
            isDevMode
          }),
        isSuccess: () => true,
        maxRetries: maxTransactionStatusCheckRetries
      })
      progressEvents?.(RecoveryEvents.ImportCFinish)
    }
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
    await retry({
      operation: async () =>
        importP({
          activeAccount,
          isDevMode
        }),
      isSuccess: () => true,
      maxRetries: maxTransactionStatusCheckRetries
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
  getAllStakes = async ({ isTestnet, addresses }: GetAllStakesParams) => {
    const addressesStr = addresses.join(',')
    let pageToken: string | undefined
    const transactions: PChainTransaction[] = []

    do {
      const response =
        await glacierSdk.primaryNetwork.listLatestPrimaryNetworkTransactions({
          network: isTestnet ? Network.FUJI : Network.MAINNET,
          blockchainId: BlockchainId.P_CHAIN,
          addresses: addressesStr,
          pageSize: 100,
          sortOrder: SortOrder.DESC,
          pageToken
        })

      pageToken = response.nextPageToken
      transactions.push(...(response.transactions as PChainTransaction[]))
    } while (pageToken)

    const stakes = transactions.filter(
      transaction =>
        transaction.txType === PChainTransactionType.ADD_DELEGATOR_TX
    )

    return stakes
  }
}

export default new EarnService()
