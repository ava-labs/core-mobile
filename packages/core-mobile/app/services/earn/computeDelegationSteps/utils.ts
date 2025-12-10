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
import { pvm, utils } from '@avalabs/avalanchejs'
import { getUnixTime } from 'date-fns'
import { getAvaxAssetId } from 'services/wallet/utils'
import { weiToNano } from 'utils/units/converter'
import { calculateCChainFee } from 'services/earn/calculateCrossChainFees'
import { extractNeededAmount } from 'hooks/earn/utils/extractNeededAmount'
import { addBufferToCChainBaseFee } from 'services/wallet/utils'
import Logger from 'utils/Logger'
import { Account } from 'store/account'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'

const DUMMY_AMOUNT = 1000000n
const DUMMY_UTXO_ID = 'dummy'

export const getDelegationFee = async ({
  stakeAmount,
  account,
  isTestnet,
  rewardAddress,
  feeState,
  provider,
  pFeeAdjustmentThreshold
}: {
  stakeAmount: bigint
  account: Account
  isTestnet: boolean
  rewardAddress: string
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
  pFeeAdjustmentThreshold: number
}): Promise<bigint> => {
  const unsignedTx = await AvalancheWalletService.createAddDelegatorTx({
    account,
    nodeId: 'NodeID-1',
    stakeAmountInNAvax: stakeAmount,
    startDate: getUnixTime(new Date()),
    // setting this end date here for this dummy tx is okay. since the end date does not add complexity for this tx, so it doesn't affect the txFee that is returned.
    // get the end date 1 month from now
    endDate: getUnixTime(new Date()) + 60 * 60 * 24 * 30,
    rewardAddress,
    isTestnet,
    shouldValidateBurnedAmount: true,
    feeState,
    pFeeAdjustmentThreshold
  })

  const tx = await Avalanche.parseAvalancheTx(
    unsignedTx,
    provider,
    rewardAddress
  )

  return tx.txFee
}

export const getDelegationFeePostPImport = async ({
  stakeAmount,
  account,
  isTestnet,
  feeState,
  pChainAtomicBalance,
  importPFee,
  provider
}: {
  stakeAmount: bigint
  account: Account
  isTestnet: boolean
  feeState: pvm.FeeState
  pChainAtomicBalance: bigint
  importPFee: bigint
  provider: Avalanche.JsonRpcProvider
}): Promise<bigint> => {
  const assetId = getAvaxAssetId(isTestnet)

  const pChainUTXOs = await AvalancheWalletService.getPChainUTXOs({
    account,
    isTestnet
  })

  // put the incoming UTXO on top as if the import P already happened
  const simulatedUTXOs = [
    getTransferOutputUtxos({
      amt: pChainAtomicBalance - importPFee,
      assetId,
      addresses: account.xpAddresses.map(address => address.address)
    }),
    ...pChainUTXOs.getUTXOs()
  ]

  const utxoSet = new utils.UtxoSet(simulatedUTXOs)

  const unsignedTx =
    await AvalancheWalletService.simulateAddPermissionlessDelegatorTx({
      utxos: utxoSet,
      account,
      isTestnet,
      stakeAmountInNAvax: stakeAmount,
      destinationAddress: account.addressPVM,
      feeState
    })

  const tx = await Avalanche.parseAvalancheTx(
    unsignedTx,
    provider,
    account.addressPVM
  )

  return tx.txFee
}

export const getDelegationFeePostCExportAndPImport = async ({
  stakeAmount,
  account,
  isTestnet,
  feeState,
  provider,
  pChainBalance = 0n,
  pFeeAdjustmentThreshold
}: {
  stakeAmount: bigint
  account: Account
  isTestnet: boolean
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
  pChainBalance?: bigint
  pFeeAdjustmentThreshold: number
}): Promise<bigint> => {
  const assetId = getAvaxAssetId(isTestnet)

  const pChainUTXOs = await AvalancheWalletService.getPChainUTXOs({
    account,
    isTestnet
  })

  const xpAddresses = account.xpAddresses.map(address => address.address)

  // put the incoming UTXO on top as if the export C + import P already happened
  // here we need to do a try catch to grab the missing amount since we don't
  // know the exact transfer amount as it depends on the delegation fee and
  // we are trying to find the delegation fee itself here
  const simulatedUTXOs = [
    getTransferOutputUtxos({
      // we need to get the absolute value of the difference since either the balance or the stake amount can be greater
      amt: bigIntDiff(stakeAmount, pChainBalance),
      assetId,
      addresses: xpAddresses
    }),
    ...pChainUTXOs.getUTXOs()
  ]

  let unsignedTx

  try {
    const utxoSet = new utils.UtxoSet(simulatedUTXOs)

    unsignedTx =
      await AvalancheWalletService.simulateAddPermissionlessDelegatorTx({
        utxos: utxoSet,
        account,
        isTestnet,
        stakeAmountInNAvax: stakeAmount,
        destinationAddress: account.addressPVM,
        feeState
      })
  } catch (error) {
    Logger.warn('unable to simulate add delegator tx', error)

    const missingAmount = extractNeededAmount((error as Error).message, assetId)

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
      addresses: xpAddresses
    })

    const utxoSet = new utils.UtxoSet(simulatedUTXOs)

    unsignedTx =
      await AvalancheWalletService.simulateAddPermissionlessDelegatorTx({
        utxos: utxoSet,
        account,
        isTestnet,
        stakeAmountInNAvax: stakeAmount,
        destinationAddress: account.addressPVM,
        feeState
      })
  }

  const tx = await Avalanche.parseAvalancheTx(
    unsignedTx,
    provider,
    account.addressPVM
  )

  return tx.txFee
}

export const getImportPFee = async ({
  account,
  isTestnet,
  destinationAddress,
  feeState,
  provider
}: {
  account: Account
  isTestnet: boolean
  destinationAddress: string
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
}): Promise<bigint> => {
  const unsignedTx = await AvalancheWalletService.createImportPTx({
    account,
    isTestnet,
    sourceChain: 'C',
    destinationAddress,
    shouldValidateBurnedAmount: true,
    feeState
  })

  const tx = await Avalanche.parseAvalancheTx(
    unsignedTx,
    provider,
    destinationAddress
  )

  return tx.txFee
}

export const getImportPFeePostCExport = async ({
  account,
  isTestnet,
  feeState,
  provider
}: {
  account: Account
  isTestnet: boolean
  feeState: pvm.FeeState
  provider: Avalanche.JsonRpcProvider
}): Promise<bigint> => {
  const assetId = getAvaxAssetId(isTestnet)

  const { pChainUtxo: atomicPChainUTXOs } =
    await AvalancheWalletService.getAtomicUTXOs({
      account,
      isTestnet
    })
  // put the incoming UTXO on top as if the export C already happened
  // using a dummy amount as it doesn't affect fee, only the number of UTXOs matter
  const simulatedAtomicUTXOs = [
    getTransferOutputUtxos({
      amt: DUMMY_AMOUNT,
      assetId,
      addresses: account.xpAddresses.map(address => address.address)
    }),
    ...atomicPChainUTXOs.getUTXOs()
  ]

  const utxoSet = new utils.UtxoSet(simulatedAtomicUTXOs)

  const unsignedTx = await AvalancheWalletService.simulateImportPTx({
    utxos: utxoSet,
    account,
    isTestnet,
    sourceChain: 'C',
    destinationAddress: account.addressPVM,
    feeState
  })

  const tx = await Avalanche.parseAvalancheTx(
    unsignedTx,
    provider,
    account.addressPVM
  )

  return tx.txFee
}

export const getExportCFee = async ({
  cChainBaseFee,
  account,
  isTestnet,
  cBaseFeeMultiplier
}: {
  cChainBaseFee: TokenUnit
  account: Account
  isTestnet: boolean
  cBaseFeeMultiplier: number
}): Promise<bigint> => {
  const paddedCChainBaseFee = addBufferToCChainBaseFee(
    cChainBaseFee,
    cBaseFeeMultiplier
  )

  // using a dummy amount as the amount doesn't affect fee
  const unsignedTx = await AvalancheWalletService.createExportCTx({
    amountInNAvax: DUMMY_AMOUNT,
    baseFeeInNAvax: weiToNano(paddedCChainBaseFee.toSubUnit()),
    account,
    isTestnet,
    destinationChain: 'P',
    destinationAddress: account.addressPVM,
    shouldValidateBurnedAmount: true
  })

  const exportCFee = calculateCChainFee(paddedCChainBaseFee, unsignedTx)

  return weiToNano(exportCFee.toSubUnit())
}

export const getPChainAtomicBalance = async ({
  isTestnet,
  account
}: {
  isTestnet: boolean
  account: Account
}): Promise<bigint> => {
  const atomicUTXOs = await AvalancheWalletService.getAtomicUTXOs({
    account,
    isTestnet
  })

  const assetId = getAvaxAssetId(isTestnet)

  const assetBalance = Avalanche.getAssetBalance(
    atomicUTXOs.pChainUtxo,
    assetId
  )

  return assetBalance.available
}

const getTransferOutputUtxos = ({
  amt,
  assetId,
  addresses
}: {
  amt: bigint
  assetId: string
  addresses: string[]
}): Utxo<TransferOutput> =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(DUMMY_UTXO_ID), new Int(0)),
    Id.fromString(assetId),
    new TransferOutput(
      new BigIntPr(amt),
      OutputOwners.fromNative(
        addresses.map(address => Address.fromString(address).toBytes())
      )
    )
  )

export const bigIntDiff = (a: bigint, b: bigint): bigint => {
  return a > b ? a - b : b - a
}
