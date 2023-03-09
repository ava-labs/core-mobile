import {
  pvmSerial,
  avmSerial,
  evmSerial,
  TransferableOutput,
  TransferableInput,
  utils,
  VM,
  Context,
  Common,
  TransferOutput
} from '@avalabs/avalanchejs-v2'
import { Avalanche } from '@avalabs/wallets-sdk'

import xss from 'xss'
import {
  AddDelegatorTx,
  AddValidatorTx,
  AvalancheBaseTx,
  AvalancheTxType,
  ExportTx,
  ImportTx,
  UnknownTx
} from 'store/walletConnect/handlers/types'

export enum AvalancheChainStrings {
  AVM = 'X Chain',
  PVM = 'P Chain',
  EVM = 'C Chain'
}

function sumOutputs(outs: TransferableOutput[], assetID: string) {
  return outs.reduce((acc, val) => {
    // If asset id does not match, skip
    if (assetID !== val.assetId.value()) {
      return acc
    }

    return acc + val.amount()
  }, BigInt(0))
}

function sumInputs(outs: TransferableInput[], assetID: string) {
  return outs.reduce((acc, val) => {
    // If asset id does not match, skip
    if (assetID !== val.assetId.value()) {
      return acc
    }
    return acc + val.amount()
  }, BigInt(0))
}

function sumEvmInputs(ins: evmSerial.Input[], assetID: string) {
  return ins.reduce((acc, val) => {
    // If asset id does not match, skip
    if (assetID !== val.assetId.value()) {
      return acc
    }
    return acc + val.amount.value()
  }, BigInt(0))
}

function sumEvmOutputs(outs: evmSerial.Output[], assetID: string) {
  return outs.reduce((acc, val) => {
    // If asset id does not match, skip
    if (assetID !== val.assetId.value()) {
      return acc
    }
    return acc + val.amount.value()
  }, BigInt(0))
}

function calculateBurn(
  tx: Common.Transaction,
  vm: VM,
  context: Context.Context
) {
  const inputsArray: TransferableInput[] = []
  const outputsArray: TransferableOutput[] = []
  const evmInsArray: evmSerial.Input[] = []
  const evmOutsArray: evmSerial.Output[] = []

  if (vm === 'PVM' || vm === 'AVM') {
    if (pvmSerial.isAddValidatorTx(tx) || pvmSerial.isAddDelegatorTx(tx)) {
      inputsArray.push(...tx.baseTx.inputs)
      outputsArray.push(...tx.baseTx.outputs)
    } else if (pvmSerial.isImportTx(tx) || avmSerial.isImportTx(tx)) {
      inputsArray.push(...tx.baseTx.inputs)
      outputsArray.push(...tx.baseTx.outputs)
      inputsArray.push(...tx.ins)
    } else if (pvmSerial.isExportTx(tx) || avmSerial.isExportTx(tx)) {
      inputsArray.push(...tx.baseTx.inputs)
      outputsArray.push(...tx.baseTx.outputs)
      outputsArray.push(...tx.outs)
    }
  } else if (vm === 'EVM') {
    if (evmSerial.isExportTx(tx)) {
      evmInsArray.push(...tx.ins)
      outputsArray.push(...tx.exportedOutputs)
    } else if (evmSerial.isImportTx(tx)) {
      inputsArray.push(...tx.importedInputs)
      evmOutsArray.push(...tx.Outs)
    }
  }
  const insTotal = sumInputs(inputsArray, context.avaxAssetID)
  const outsTotal = sumOutputs(outputsArray, context.avaxAssetID)
  const evmInsTotal = sumEvmInputs(evmInsArray, context.avaxAssetID)
  const evmOutsTotal = sumEvmOutputs(evmOutsArray, context.avaxAssetID)

  return insTotal + evmInsTotal - (outsTotal + evmOutsTotal)
}

/**
 * Returns the vm type given a chain id. Support mainnet and Fuji only.
 * @param id ID of the chain
 */
function chainIdToVM(id: string): VM {
  if (
    [
      Avalanche.MainnetContext.xBlockchainID,
      Avalanche.FujiContext.xBlockchainID
    ].includes(id)
  ) {
    return 'AVM'
  } else if (
    [
      Avalanche.MainnetContext.pBlockchainID,
      Avalanche.FujiContext.pBlockchainID
    ].includes(id)
  ) {
    return 'PVM'
  } else if (
    [
      Avalanche.MainnetContext.cBlockchainID,
      Avalanche.FujiContext.cBlockchainID
    ].includes(id)
  ) {
    return 'EVM'
  }

  throw new Error('Unknown chain id. Failed to get alias.')
}

/**
 * Returns human readable data from a given a transaction buffer,
 */
export async function parseAvalancheTx(
  txBuff: Buffer | Uint8Array,
  vm: VM,
  provider: Avalanche.JsonRpcProvider,
  currentAddress: string
): Promise<AvalancheTxType> {
  const context = provider.getContext()
  const tx = utils.unpackWithManager(vm, txBuff)
  const burn = calculateBurn(tx, vm, context)

  if (vm === 'PVM') {
    if (pvmSerial.isAddValidatorTx(tx)) {
      // Calculate stake
      const totStake = sumOutputs(tx.stake, context.avaxAssetID)
      return {
        type: 'add_validator',
        chain: vm,
        nodeID: tx.validator.nodeId.value(),
        fee: tx.shares.value(),
        start: tx.validator.startTime.value().toString(),
        end: tx.validator.endTime.value().toString(),
        rewardOwner: tx.rewardsOwner,
        stakeOuts: tx.stake,
        stake: totStake,
        txFee: burn
      } as AddValidatorTx
    } else if (pvmSerial.isAddDelegatorTx(tx)) {
      const totStake = sumOutputs(tx.stake, context.avaxAssetID)
      return {
        type: 'add_delegator',
        chain: vm,
        nodeID: tx.validator.nodeId.value(),
        start: tx.validator.startTime.value().toString(),
        end: tx.validator.endTime.value().toString(),
        rewardOwner: tx.rewardsOwner,
        stakeOuts: tx.stake,
        stake: totStake,
        txFee: burn
      } as AddDelegatorTx
    } else if (pvmSerial.isImportTx(tx)) {
      const tot = sumInputs(tx.ins, context.avaxAssetID)
      return {
        type: 'import',
        chain: vm,
        source: chainIdToVM(tx.sourceChain.value()),
        amount: tot,
        txFee: burn
      } as ImportTx
    } else if (pvmSerial.isExportTx(tx)) {
      const tot = sumOutputs(tx.outs, context.avaxAssetID)
      return {
        type: 'export',
        chain: vm,
        destination: chainIdToVM(tx.destination.value()),
        amount: tot,
        txFee: burn
      } as ExportTx
    }
  } else if (vm === 'AVM') {
    if (avmSerial.isImportTx(tx)) {
      const inputs = tx.getInputs()
      const tot = inputs.length
        ? sumInputs(tx.getInputs(), context.avaxAssetID)
        : sumInputs(tx.ins, context.avaxAssetID)
      return {
        type: 'import',
        chain: vm,
        source: chainIdToVM(tx.sourceChain.value()),
        amount: tot,
        txFee: burn
      } as ImportTx
    } else if (avmSerial.isExportTx(tx)) {
      const sumExportOuts = sumOutputs(tx.outs, context.avaxAssetID)
      //TODO: Show change outs? (https://ava-labs.atlassian.net/browse/CP-3819)
      return {
        type: 'export',
        chain: vm,
        destination: chainIdToVM(tx.destination.value()),
        amount: sumExportOuts,
        txFee: burn
      } as ExportTx
    } else if (avmSerial.isBaseTx(tx)) {
      const baseTx = tx.baseTx

      // Reduce asset ids and fetch details
      const assetIDs: Set<string> = new Set()
      baseTx.outputs.forEach(out => {
        assetIDs.add(out.assetId.value())
      })

      const descriptions = await Promise.all(
        [...assetIDs.values()].map(assetId => {
          return provider.getApiX().getAssetDescription(assetId)
        })
      )

      // Reduce to TransferOutputs we can display
      // TODO: Show other output types jira(https://ava-labs.atlassian.net/browse/CP-4691)

      let parsedOutputs = baseTx.outputs.reduce<
        AvalancheBaseTx['outputs'][number][]
      >((acc, out) => {
        if (out.output instanceof TransferOutput) {
          const assetId = out.assetId.value()
          const assetIndex = [...assetIDs.values()].indexOf(assetId)
          const desc = descriptions[assetIndex]
          const addresses = out.output.outputOwners.addrs.map(
            owner => `X-${owner.toString(context.hrp)}`
          )

          return [
            ...acc,
            {
              assetId,
              amount: out.output.amount(),
              locktime: out.output.getLocktime(),
              threshold: BigInt(out.output.getThreshold()),
              assetDescription: desc,
              owners: addresses,
              isAvax: context.avaxAssetID === assetId
            }
          ]
        }
        return acc
      }, [])

      // Hide change utxos if more than 1 outputs
      const now = Avalanche.getUnixNow()

      if (parsedOutputs.length > 1) {
        parsedOutputs = parsedOutputs.filter(out => {
          // Only hide if we are the only owner and lock time is in the past
          return !(
            out.owners.length === 1 &&
            out.owners[0] === currentAddress &&
            out.locktime <= now
          )
        })
      }

      return {
        type: 'base',
        chain: vm,
        txFee: context.baseTxFee,
        outputs: parsedOutputs,
        memo: xss(Buffer.from(baseTx.memo.toBytes()).toString('utf-8', 4))
      }
    }
  } else if (vm === 'EVM') {
    if (evmSerial.isExportTx(tx)) {
      const tot = sumOutputs(tx.exportedOutputs, context.avaxAssetID)
      return {
        type: 'export',
        chain: vm,
        destination: chainIdToVM(tx.destinationChain.value()),
        exportOuts: tx.exportedOutputs,
        amount: tot,
        txFee: burn
      } as ExportTx
    } else if (evmSerial.isImportTx(tx)) {
      const tot = sumInputs(tx.importedInputs, context.avaxAssetID)
      return {
        type: 'import',
        chain: vm,
        source: chainIdToVM(tx.sourceChain.value()),
        amount: tot,
        txFee: burn
      } as ImportTx
    }
  }

  return {
    type: 'unknown',
    chain: vm
  } as UnknownTx
}
