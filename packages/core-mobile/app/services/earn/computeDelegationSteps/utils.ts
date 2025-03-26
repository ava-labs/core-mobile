import {
  Address,
  avaxSerial,
  BigIntPr,
  Id,
  Int,
  OutputOwners,
  TransferOutput,
  Utxo
} from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { pvm, utils } from '@avalabs/avalanchejs'
import { getUnixTime } from 'date-fns'
import WalletService from 'services/wallet/WalletService'
import { getAssetId } from 'services/wallet/utils'
import { weiToNano } from 'utils/units/converter'
import { calculateCChainFee } from 'services/earn/calculateCrossChainFees'
import { extractNeededAmount } from 'hooks/earn/utils/extractNeededAmount'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import Logger from 'utils/Logger'

const DUMMY_AMOUNT = 1000000n
const DUMMY_UTXO_ID = 'dummy'

export const getDelegationFee = async ({
  stakeAmount,
  accountIndex,
  avaxXPNetwork,
  pAddress,
  feeState,
  provider,
  pFeeAdjustmentThreshold
}: {
  stakeAmount: bigint
  accountIndex: number
  avaxXPNetwork: Network
  pAddress: string
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
  pFeeAdjustmentThreshold: number
}): Promise<bigint> => {
  const unsignedTx = await WalletService.createAddDelegatorTx({
    accountIndex,
    avaxXPNetwork,
    nodeId: 'NodeID-1',
    stakeAmountInNAvax: stakeAmount,
    startDate: getUnixTime(new Date()),
    // setting this end date here for this dummy tx is okay. since the end date does not add complexity for this tx, so it doesn't affect the txFee that is returned.
    // get the end date 1 month from now
    endDate: getUnixTime(new Date()) + 60 * 60 * 24 * 30,
    rewardAddress: pAddress,
    isDevMode: Boolean(avaxXPNetwork.isTestnet),
    shouldValidateBurnedAmount: true,
    feeState,
    pFeeAdjustmentThreshold
  })

  const tx = await Avalanche.parseAvalancheTx(unsignedTx, provider, pAddress)

  return tx.txFee
}

export const getDelegationFeePostPImport = async ({
  stakeAmount,
  accountIndex,
  avaxXPNetwork,
  pAddress,
  feeState,
  pChainAtomicBalance,
  importPFee,
  provider
}: {
  stakeAmount: bigint
  accountIndex: number
  avaxXPNetwork: Network
  pAddress: string
  feeState: pvm.FeeState
  pChainAtomicBalance: bigint
  importPFee: bigint
  provider: Avalanche.JsonRpcProvider
}): Promise<bigint> => {
  const assetId = getAssetId(avaxXPNetwork)

  const pChainUTXOs = await WalletService.getPChainUTXOs({
    accountIndex,
    avaxXPNetwork
  })

  // put the incoming UTXO on top as if the import P already happened
  const simulatedUTXOs = [
    getTransferOutputUtxos({
      amt: pChainAtomicBalance - importPFee,
      assetId,
      address: pAddress
    }),
    ...pChainUTXOs.getUTXOs()
  ]

  const utxoSet = new utils.UtxoSet(simulatedUTXOs)

  const unsignedTx = await WalletService.simulateAddPermissionlessDelegatorTx({
    utxos: utxoSet,
    accountIndex,
    avaxXPNetwork,
    stakeAmountInNAvax: stakeAmount,
    destinationAddress: pAddress,
    feeState
  })

  const tx = await Avalanche.parseAvalancheTx(unsignedTx, provider, pAddress)

  return tx.txFee
}

export const getDelegationFeePostCExportAndPImport = async ({
  stakeAmount,
  accountIndex,
  avaxXPNetwork,
  pAddress,
  feeState,
  provider,
  pChainBalance = 0n,
  pFeeAdjustmentThreshold
}: {
  stakeAmount: bigint
  accountIndex: number
  avaxXPNetwork: Network
  pAddress: string
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
  pChainBalance?: bigint
  pFeeAdjustmentThreshold: number
}): Promise<bigint> => {
  const assetId = getAssetId(avaxXPNetwork)

  const pChainUTXOs = await WalletService.getPChainUTXOs({
    accountIndex,
    avaxXPNetwork
  })

  // put the incoming UTXO on top as if the export C + import P already happened
  // here we need to do a try catch to grab the missing amount since we don't
  // know the exact transfer amount as it depends on the delegation fee and
  // we are trying to find the delegation fee itself here
  const simulatedUTXOs = [
    getTransferOutputUtxos({
      // we need to get the absolute value of the difference since either the balance or the stake amount can be greater
      amt: bigIntDiff(stakeAmount, pChainBalance),
      assetId,
      address: pAddress
    }),
    ...pChainUTXOs.getUTXOs()
  ]

  let unsignedTx

  try {
    const utxoSet = new utils.UtxoSet(simulatedUTXOs)

    unsignedTx = await WalletService.simulateAddPermissionlessDelegatorTx({
      utxos: utxoSet,
      accountIndex,
      avaxXPNetwork,
      stakeAmountInNAvax: stakeAmount,
      destinationAddress: pAddress,
      feeState
    })
  } catch (error) {
    Logger.warn('unable to simulate add delegator tx', error)

    const missingAmount = extractNeededAmount(
      (error as Error).message,
      getAssetId(avaxXPNetwork)
    )

    if (!missingAmount) {
      // rethrow error if it's not an insufficient funds error
      throw error
    }
    Logger.info('missingAmount', missingAmount)
    const ratio = Number(missingAmount) / Number(stakeAmount)

    if (ratio > pFeeAdjustmentThreshold) {
      // rethrow insufficient funds error when missing fee is too much compared to total token amount
      Logger.error(
        'Failed to simulate add delegator transaction due to excessive fees',
        {
          missingAmount,
          ratio
        }
      )
      throw error
    }

    simulatedUTXOs[0] = getTransferOutputUtxos({
      amt: bigIntDiff(stakeAmount, pChainBalance) + missingAmount,
      assetId,
      address: pAddress
    })

    const utxoSet = new utils.UtxoSet(simulatedUTXOs)

    unsignedTx = await WalletService.simulateAddPermissionlessDelegatorTx({
      utxos: utxoSet,
      accountIndex,
      avaxXPNetwork,
      stakeAmountInNAvax: stakeAmount,
      destinationAddress: pAddress,
      feeState
    })
  }

  const tx = await Avalanche.parseAvalancheTx(unsignedTx, provider, pAddress)

  return tx.txFee
}

export const getImportPFee = async ({
  accountIndex,
  avaxXPNetwork,
  pAddress,
  feeState,
  provider
}: {
  accountIndex: number
  avaxXPNetwork: Network
  pAddress: string
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
}): Promise<bigint> => {
  const unsignedTx = await WalletService.createImportPTx({
    accountIndex,
    avaxXPNetwork,
    sourceChain: 'C',
    destinationAddress: pAddress,
    shouldValidateBurnedAmount: true,
    feeState
  })

  const tx = await Avalanche.parseAvalancheTx(unsignedTx, provider, pAddress)

  return tx.txFee
}

export const getImportPFeePostCExport = async ({
  accountIndex,
  avaxXPNetwork,
  pAddress,
  feeState,
  provider
}: {
  accountIndex: number
  avaxXPNetwork: Network
  pAddress: string
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
}): Promise<bigint> => {
  const assetId = getAssetId(avaxXPNetwork)

  const { pChainUtxo: atomicPChainUTXOs } = await WalletService.getAtomicUTXOs({
    accountIndex,
    avaxXPNetwork
  })
  // put the incoming UTXO on top as if the export C already happened
  // using a dummy amount as it doesn't affect fee, only the number of UTXOs matter
  const simulatedAtomicUTXOs = [
    getTransferOutputUtxos({
      amt: DUMMY_AMOUNT,
      assetId,
      address: pAddress
    }),
    ...atomicPChainUTXOs.getUTXOs()
  ]

  const utxoSet = new utils.UtxoSet(simulatedAtomicUTXOs)

  const unsignedTx = await WalletService.simulateImportPTx({
    utxos: utxoSet,
    accountIndex,
    avaxXPNetwork,
    sourceChain: 'C',
    destinationAddress: pAddress,
    feeState
  })

  const tx = await Avalanche.parseAvalancheTx(unsignedTx, provider, pAddress)

  return tx.txFee
}

export const getExportCFee = async ({
  cChainBaseFee,
  accountIndex,
  avaxXPNetwork,
  pAddress,
  cBaseFeeMultiplier
}: {
  cChainBaseFee: TokenUnit
  accountIndex: number
  avaxXPNetwork: Network
  pAddress: string
  cBaseFeeMultiplier: number
}): Promise<bigint> => {
  const paddedCChainBaseFee = addBufferToCChainBaseFee(
    cChainBaseFee,
    cBaseFeeMultiplier
  )

  // using a dummy amount as the amount doesn't affect fee
  const unsignedTx = await WalletService.createExportCTx({
    amountInNAvax: DUMMY_AMOUNT,
    baseFeeInNAvax: weiToNano(paddedCChainBaseFee.toSubUnit()),
    accountIndex: accountIndex,
    avaxXPNetwork,
    destinationChain: 'P',
    destinationAddress: pAddress,
    shouldValidateBurnedAmount: true
  })

  const exportCFee = calculateCChainFee(paddedCChainBaseFee, unsignedTx)

  return weiToNano(exportCFee.toSubUnit())
}

export const getPChainAtomicBalance = async ({
  avaxXPNetwork,
  accountIndex
}: {
  avaxXPNetwork: Network
  accountIndex: number
}): Promise<bigint> => {
  const atomicUTXOs = await WalletService.getAtomicUTXOs({
    accountIndex,
    avaxXPNetwork
  })

  const assetId = getAssetId(avaxXPNetwork)

  const assetBalance = Avalanche.getAssetBalance(
    atomicUTXOs.pChainUtxo,
    assetId
  )

  return assetBalance.available
}

const getTransferOutputUtxos = ({
  amt,
  assetId,
  address
}: {
  amt: bigint
  assetId: string
  address: string
}): Utxo<TransferOutput> =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(DUMMY_UTXO_ID), new Int(0)),
    Id.fromString(assetId),
    new TransferOutput(
      new BigIntPr(amt),
      OutputOwners.fromNative([Address.fromString(address).toBytes()])
    )
  )

export const bigIntDiff = (a: bigint, b: bigint): bigint => {
  return a > b ? a - b : b - a
}
