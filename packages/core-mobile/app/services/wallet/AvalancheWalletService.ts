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
import { getPvmAddresses } from 'services/earn/computeDelegationSteps/utils'
import {
  AddDelegatorProps,
  CreateExportCTxParams,
  CreateExportPTxParams,
  CreateImportCTxParams,
  CreateImportPTxParams,
  CreateSendPTxParams,
  CreateSendXTxParams
} from './types'
import { getAvaxAssetId } from './utils'
import { filterOutSmallUtxos } from './filterSmallUtxos'
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
   * Get importable atomic UTXOs for every CCT route across the primary network
   * (C/P/X), one read-only signer call per (destination, source) pair. Used by
   * the stuck-funds banner to detect AVAX stranded in atomic memory after an
   * incomplete cross-chain transfer. Read-only: never prompts the device.
   */
  public async getAllAtomicUTXOs({
    account,
    isTestnet,
    xpAddresses
  }: {
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
  }): Promise<
    {
      dest: Avalanche.ChainIDAlias
      source: Avalanche.ChainIDAlias
      utxos: utils.UtxoSet
    }[]
  > {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const routes: [Avalanche.ChainIDAlias, Avalanche.ChainIDAlias][] = [
      ['P', 'C'],
      ['P', 'X'],
      ['C', 'P'],
      ['C', 'X'],
      ['X', 'C'],
      ['X', 'P']
    ]

    // allSettled (not all): a single flaky route must not reject the whole
    // detection query, or one bad chain would hide genuinely stuck funds that
    // loaded fine on the other routes. Drop only the routes that failed.
    const settled = await Promise.allSettled(
      routes.map(async ([dest, source]) => ({
        dest,
        source,
        utxos: await readOnlySigner.getAtomicUTXOs(dest, source)
      }))
    )

    // Log dropped routes so intermittent RPC/chain failures are observable on
    // the 60s poll without breaking detection for the routes that succeeded.
    settled.forEach((result, index) => {
      if (result.status === 'rejected') {
        const [dest, source] = routes[index] as [
          Avalanche.ChainIDAlias,
          Avalanche.ChainIDAlias
        ]
        Logger.warn(
          `[getAllAtomicUTXOs] atomic UTXO fetch failed for ${source}->${dest}`,
          result.reason
        )
      }
    })

    return settled
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<{
          dest: Avalanche.ChainIDAlias
          source: Avalanche.ChainIDAlias
          utxos: utils.UtxoSet
        }> => result.status === 'fulfilled'
      )
      .map(result => result.value)
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

    if (shouldValidateBurnedAmount) {
      await this.validateFee({
        isTestnet,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })
    }

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

    if (shouldValidateBurnedAmount) {
      await this.validateFee({
        isTestnet,
        unsignedTx,
        pChainFeePriceInNAvax: feeState?.price
      })
    }

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

    if (shouldValidateBurnedAmount) {
      await this.validateFee({
        isTestnet,
        unsignedTx,
        pChainFeePriceInNAvax: feeState?.price
      })
    }

    return unsignedTx
  }

  /**
   * The exact UTXO set the send tx builders spend from: full set for X,
   * size-capped for P (64KB tx limit), minus dust when the small-UTXO
   * filter is on. Max-amount derivation MUST use this same set — deriving
   * Max from the (unfiltered) displayed balance builds an over-spend.
   */
  private async getSendUtxoSet({
    readOnlySigner,
    chain,
    isTestnet,
    feeState,
    filterSmallUtxos
  }: {
    readOnlySigner: Avalanche.AddressWallet
    chain: 'P' | 'X'
    isTestnet: boolean
    feeState?: pvm.FeeState
    filterSmallUtxos?: boolean
  }): Promise<utils.UtxoSet> {
    const utxoSet = await readOnlySigner.getUTXOs(chain)
    let filteredUtxos = utxoSet.getUTXOs()
    if (chain === 'P') {
      // P-chain has a tx size limit of 64KB
      filteredUtxos = Avalanche.getMaximumUtxoSet({
        wallet: readOnlySigner,
        utxos: filteredUtxos,
        sizeSupportedTx: Avalanche.SizeSupportedTx.BaseP,
        feeState
      })
    }
    if (filterSmallUtxos === true) {
      filteredUtxos = filterOutSmallUtxos(
        filteredUtxos,
        getAvaxAssetId(isTestnet)
      )
    }
    return new utils.UtxoSet(filteredUtxos)
  }

  /**
   * Spendable AVAX (nAVAX) computed from the same UTXO set
   * createSendPTx/createSendXTx will spend, so Max amounts stay consistent
   * with what a send can actually consume (CP-13903).
   */
  public async getSpendableAvaxBalance({
    chain,
    account,
    isTestnet,
    xpAddresses,
    feeState,
    filterSmallUtxos
  }: {
    chain: 'P' | 'X'
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
    feeState?: pvm.FeeState
    filterSmallUtxos?: boolean
  }): Promise<bigint> {
    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await this.getSendUtxoSet({
      readOnlySigner,
      chain,
      isTestnet,
      feeState,
      filterSmallUtxos
    })

    return Avalanche.getAssetBalance(utxoSet, getAvaxAssetId(isTestnet))
      .available
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
    xpAddresses,
    filterSmallUtxos
  }: CreateSendPTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await this.getSendUtxoSet({
      readOnlySigner,
      chain: 'P',
      isTestnet,
      feeState,
      filterSmallUtxos
    })
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
    xpAddresses,
    filterSmallUtxos
  }: CreateSendXTxParams): Promise<UnsignedTx> {
    if (!destinationAddress) {
      throw new Error('destination address must be set')
    }

    const readOnlySigner = await this.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })

    const utxoSet = await this.getSendUtxoSet({
      readOnlySigner,
      chain: 'X',
      isTestnet,
      filterSmallUtxos
    })
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

    if (shouldValidateBurnedAmount) {
      await this.validateFee({
        isTestnet,
        unsignedTx,
        evmBaseFeeInNAvax: baseFeeInNAvax
      })
    }

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
    xpAddresses,
    additionalOutputs
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
        feeState,
        // Only forward when non-empty so the wallet-sdk's `additionalOutputs`
        // path stays opt-in; passing an empty array would still trigger the
        // extra-output handling on the builder.
        ...(additionalOutputs && additionalOutputs.length > 0
          ? { additionalOutputs }
          : {})
      })
    } catch (error) {
      Logger.warn('unable to create add delegator tx', error)
      // rethrow error
      throw error
    }

    if (shouldValidateBurnedAmount) {
      await this.validateFee({
        isTestnet,
        unsignedTx,
        pChainFeePriceInNAvax: feeState?.price
      })
    }

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
      fromAddresses: getPvmAddresses(xpAddresses),
      rewardAddresses: [destinationAddress ?? ''],
      start: BigInt(getUnixTime(new Date())),
      // setting this end date here for this dummy tx is okay. since the end date does not add complexity for this tx, so it doesn't affect the txFee that is returned.
      // get the end date 1 month from now
      end: BigInt(getUnixTime(new Date()) + 60 * 60 * 24 * 30),
      utxoSet: utxos,
      feeState
    })
  }

  public async getReadOnlySigner({
    account,
    isTestnet,
    xpAddresses
  }: {
    account: Account
    isTestnet: boolean
    xpAddresses: string[]
  }): Promise<Avalanche.AddressWallet> {
    const provXP = await NetworkService.getAvalancheProviderXP(isTestnet)

    if (!account.addressPVM) {
      throw new Error('P-Chain address not available for account')
    }

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
    evmBaseFeeInNAvax,
    pChainFeePriceInNAvax
  }: {
    isTestnet: boolean
    unsignedTx: UnsignedTx
    evmBaseFeeInNAvax?: bigint
    pChainFeePriceInNAvax?: bigint
  }): Promise<void> {
    const avalancheProvider = await NetworkService.getAvalancheProviderXP(
      isTestnet
    )

    // validateBurnedAmount interprets `baseFee` per VM: the EVM base fee for
    // C-chain atomic txs, the P-chain dynamic fee price for PVM txs. The
    // static X-chain path ignores it.
    let baseFee: bigint
    const vm = unsignedTx.getVM()
    if (vm === 'EVM') {
      if (evmBaseFeeInNAvax === undefined) {
        throw new Error('Missing evm fee data')
      }
      baseFee = evmBaseFeeInNAvax
    } else if (vm === 'PVM') {
      let price = pChainFeePriceInNAvax
      if (price === undefined) {
        try {
          price = (await avalancheProvider.getApiP().getFeeState()).price
        } catch (error) {
          // Fail open: without a reference price the check can't run, and a
          // transient RPC failure must not block staking/claim actions.
          // (Substituting 0 would be worse — a zero expected fee makes any
          // real burn look excessive and fails the validation.)
          Logger.warn(
            'skipping burned amount validation, unable to fetch P-Chain fee state',
            error
          )
          return
        }
      }
      baseFee = price
    } else {
      baseFee = 0n
    }

    Logger.info('validating burned amount')

    const { isValid, txFee } = utils.validateBurnedAmount({
      unsignedTx,
      context: avalancheProvider.getContext(),
      baseFee,
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
