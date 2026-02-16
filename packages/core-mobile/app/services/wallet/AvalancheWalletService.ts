import { Avalanche } from '@avalabs/core-wallets-sdk'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import { pvm, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { nanoToWei } from 'utils/units/converter'
import Logger from 'utils/Logger'
import { getUnixTime, secondsToMilliseconds } from 'date-fns'
import { getMinimumStakeEndTime } from 'services/earn/utils'
import { PChainId } from '@avalabs/glacier-sdk'
import { UTCDate } from '@date-fns/utc'
import {
  AddDelegatorProps,
  CreateExportCTxParams,
  CreateExportPTxParams,
  CreateImportCTxParams,
  CreateImportPTxParams,
  CreateSendPTxParams
} from './types'
import { getAvaxAssetId } from './utils'
class AvalancheWalletService {
  /**
   * Get atomic transactions that are in VM memory.
   */
  public async getAtomicUTXOs({
    account,
    isTestnet,
    xpAddresses
  }: {
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
  }): Promise<{
    pChainUtxo: utils.UtxoSet
    cChainUtxo: utils.UtxoSet
  }> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const pChainUtxo = await readOnlySigner.getAtomicUTXOs('P', 'C')
    const cChainUtxo = await readOnlySigner.getAtomicUTXOs('C', 'P')

    return {
      pChainUtxo,
      cChainUtxo
    }
  }

  /**
   * Get atomic UTXOs for P-Chain.
   */
  public async getPChainAtomicUTXOs({
    account,
    isTestnet,
    xpAddresses
  }: {
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
  }): Promise<utils.UtxoSet> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    return readOnlySigner.getAtomicUTXOs('P', 'C')
  }

  /**
   * Get UTXOs on P-Chain.
   */
  public async getPChainUTXOs({
    account,
    isTestnet,
    xpAddresses
  }: {
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
  }): Promise<utils.UtxoSet> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    return readOnlySigner.getUTXOs('P')
  }

  public async createExportCTx({
    amountInNAvax,
    baseFeeInNAvax,
    account,
    isTestnet,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    avalancheEvmProvider,
    xpAddresses
  }: CreateExportCTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    // Get nonce from C-Chain EVM provider
    const evmAddress = readOnlySigner.getAddressEVM()

    const nonce = await avalancheEvmProvider.getTransactionCount(evmAddress)

    const unsignedTx = readOnlySigner.exportC(
      amountInNAvax,
      destinationChain,
      BigInt(nonce),
      nanoToWei(baseFeeInNAvax),
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateFee({
        isTestnet,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })

    return unsignedTx
  }

  public async createImportPTx({
    account,
    isTestnet,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState,
    xpAddresses
  }: CreateImportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await readOnlySigner.getAtomicUTXOs('P', sourceChain)

    const unsignedTx = readOnlySigner.importP({
      utxoSet,
      sourceChain,
      toAddress: destinationAddress,
      feeState
    })

    shouldValidateBurnedAmount &&
      this.validateFee({
        isTestnet,
        unsignedTx
      })

    return unsignedTx
  }

  public async createExportPTx({
    amountInNAvax,
    account,
    isTestnet,
    destinationChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    feeState,
    xpAddresses
  }: CreateExportPTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await readOnlySigner.getUTXOs('P')

    const unsignedTx = readOnlySigner.exportP({
      amount: amountInNAvax,
      utxoSet,
      destination: destinationChain,
      toAddress: destinationAddress,
      feeState
    })

    shouldValidateBurnedAmount &&
      this.validateFee({
        isTestnet,
        unsignedTx
      })

    return unsignedTx
  }

  /**
   * Create UnsignedTx for sending on P-chain
   */
  public async createSendPTx({
    amountInNAvax,
    account,
    isTestnet,
    destinationAddress,
    sourceAddress,
    feeState,
    xpAddresses
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    // P-chain has a tx size limit of 64KB
    let utxoSet = await readOnlySigner.getUTXOs('P')
    const filteredUtxos = Avalanche.getMaximumUtxoSet({
      wallet: readOnlySigner,
      utxos: utxoSet.getUTXOs(),
      sizeSupportedTx: Avalanche.SizeSupportedTx.BaseP,
      feeState
    })
    utxoSet = new utils.UtxoSet(filteredUtxos)
    const changeAddress = utils.parse(sourceAddress)[2]

    return readOnlySigner.baseTX({
      utxoSet,
      chain: 'P',
      toAddress: destinationAddress,
      amountsPerAsset: {
        [getAvaxAssetId(isTestnet)]: amountInNAvax
      },
      options: {
        changeAddresses: [changeAddress]
      },
      feeState
    })
  }

  /**
   * Create UnsignedTx for sending on X-chain
   */
  public async createSendXTx({
    amountInNAvax,
    account,
    isTestnet,
    destinationAddress,
    sourceAddress,
    xpAddresses
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    // P-chain has a tx size limit of 64KB
    const utxoSet = await readOnlySigner.getUTXOs('X')
    const changeAddress = utils.parse(sourceAddress)[2]
    return readOnlySigner.baseTX({
      utxoSet,
      chain: 'X',
      toAddress: destinationAddress,
      amountsPerAsset: {
        [getAvaxAssetId(isTestnet)]: amountInNAvax
      },
      options: {
        changeAddresses: [changeAddress]
      }
    })
  }

  public async createImportCTx({
    account,
    baseFeeInNAvax,
    isTestnet,
    sourceChain,
    destinationAddress,
    shouldValidateBurnedAmount = true,
    xpAddresses
  }: CreateImportCTxParams): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await readOnlySigner.getAtomicUTXOs('C', sourceChain)

    const unsignedTx = readOnlySigner.importC(
      utxoSet,
      sourceChain,
      baseFeeInNAvax,
      undefined,
      destinationAddress
    )

    shouldValidateBurnedAmount &&
      this.validateFee({
        isTestnet,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })

    return unsignedTx
  }

  public async createAddDelegatorTx({
    account,
    isTestnet,
    nodeId,
    stakeAmountInNAvax,
    startDate,
    endDate,
    rewardAddress,
    shouldValidateBurnedAmount = true,
    feeState,
    xpAddresses
  }: AddDelegatorProps): Promise<UnsignedTx> {
    if (!nodeId.startsWith('NodeID-')) {
      throw Error('Invalid node id: ' + nodeId)
    }

    const oneAvax = BigInt(1e9)
    const minStakingAmount = isTestnet ? oneAvax : BigInt(25) * oneAvax
    if (stakeAmountInNAvax < minStakingAmount) {
      throw Error('Stake amount less than minimum')
    }

    const unixNow = getUnixTime(new Date())
    if (unixNow > startDate) {
      throw Error('Start date must be in future: ' + startDate)
    }

    const minimalStakeEndDate = getMinimumStakeEndTime(
      isTestnet,
      new UTCDate(secondsToMilliseconds(startDate))
    )

    if (endDate < getUnixTime(minimalStakeEndDate)) {
      throw Error('Stake duration too short')
    }

    if (
      !rewardAddress.startsWith('P-') ||
      !Avalanche.isBech32Address(rewardAddress, true)
    ) {
      throw Error('Reward address must be from P chain')
    }

    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await readOnlySigner.getUTXOs('P')

    let unsignedTx

    try {
      unsignedTx = readOnlySigner.addPermissionlessDelegator({
        utxoSet,
        nodeId,
        start: BigInt(startDate),
        end: BigInt(endDate),
        weight: stakeAmountInNAvax,
        subnetId: PChainId._11111111111111111111111111111111LPO_YY,
        rewardAddresses: [rewardAddress],
        feeState
      })
    } catch (error) {
      Logger.warn('unable to create add delegator tx', error)
      // rethrow error
      throw error
    }

    shouldValidateBurnedAmount &&
      this.validateFee({
        isTestnet,
        unsignedTx
      })

    return unsignedTx
  }

  public async simulateImportPTx({
    utxos,
    account,
    isTestnet,
    sourceChain,
    destinationAddress,
    feeState,
    xpAddresses
  }: {
    utxos: utils.UtxoSet
    account: Account
    isTestnet: boolean
    sourceChain: 'C' | 'X'
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
    xpAddresses: string[]
  }): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    return readOnlySigner.importP({
      utxoSet: utxos,
      sourceChain,
      toAddress: destinationAddress,
      feeState
    })
  }

  public async simulateAddPermissionlessDelegatorTx({
    utxos,
    stakeAmountInNAvax,
    account,
    isTestnet,
    destinationAddress,
    feeState,
    xpAddresses
  }: {
    utxos: utils.UtxoSet
    stakeAmountInNAvax: bigint
    account: Account
    isTestnet: boolean
    destinationAddress: string
    shouldValidateBurnedAmount?: boolean
    feeState?: pvm.FeeState
    xpAddresses: string[]
  }): Promise<UnsignedTx> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    return readOnlySigner.addPermissionlessDelegator({
      weight: stakeAmountInNAvax,
      nodeId: 'NodeID-1',
      subnetId: PChainId._11111111111111111111111111111111LPO_YY,
      fromAddresses: xpAddresses.map(addr => `P-${addr}`),
      rewardAddresses: [destinationAddress ?? ''],
      start: BigInt(getUnixTime(new Date())),
      // setting this end date here for this dummy tx is okay. since the end date does not add complexity for this tx, so it doesn't affect the txFee that is returned.
      // get the end date 1 month from now
      end: BigInt(getUnixTime(new Date()) + 60 * 60 * 24 * 30),
      utxoSet: utxos,
      feeState
    })
  }

  private async getReadOnlySigner({
    account,
    isTestnet,
    xpAddresses
  }: {
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
  }): Promise<Avalanche.AddressWallet> {
    const provXP = await NetworkService.getAvalancheProviderXP(isTestnet)

    return new Avalanche.AddressWallet(
      account.addressC,
      stripAddressPrefix(account.addressCoreEth),
      xpAddresses,
      stripAddressPrefix(account.addressPVM),
      provXP
    )
  }

  private async validateFee({
    isTestnet,
    unsignedTx,
    evmBaseFeeInNAvax
  }: {
    isTestnet: boolean
    unsignedTx: UnsignedTx
    evmBaseFeeInNAvax?: bigint
  }): Promise<void> {
    if (evmBaseFeeInNAvax === undefined) {
      throw new Error('Missing evm fee data')
    }

    Logger.info('validating burned amount')

    const avalancheProvider = await NetworkService.getAvalancheProviderXP(
      isTestnet
    )

    const { isValid, txFee } = utils.validateBurnedAmount({
      unsignedTx,
      context: avalancheProvider.getContext(),
      baseFee: evmBaseFeeInNAvax,
      feeTolerance: EVM_FEE_TOLERANCE
    })

    if (!isValid) {
      Logger.error(`Excessive burn amount. Expected ${txFee} nAvax.`)
      throw Error('Excessive burn amount')
    }

    Logger.info('burned amount is valid')
  }
}

// Tolerate 50% buffer for burn amount for EVM transactions
const EVM_FEE_TOLERANCE = 50

export default new AvalancheWalletService()
