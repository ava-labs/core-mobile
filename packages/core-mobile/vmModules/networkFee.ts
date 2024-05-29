import { JsonRpcProvider } from 'ethers'
import { isSwimmer } from 'services/network/utils/isSwimmerNetwork'
import { Network } from '@avalabs/chains-sdk'
import { TokenBaseUnit2 } from 'types/TokenBaseUnit2'

interface EVMModule {
  provider: JsonRpcProvider
  network: Network
}

type PresetKeys = 'LOW' | 'MEDIUM' | 'HIGH'

const DEFAULT_PRESETS = {
  LOW: 1,
  MEDIUM: 4,
  HIGH: 6
}

const BASE_PRIORITY_FEE_WEI = 500000000 //0.5 GWei

export async function getNetworkFee(
  { provider, network }: EVMModule,
  presetMultipliers: { [T in PresetKeys]: number } = DEFAULT_PRESETS
): Promise<
  | {
      low: { maxPriorityFeePerGas: bigint; maxFeePerGas: bigint }
      medium: { maxPriorityFeePerGas: bigint; maxFeePerGas: bigint }
      high: { maxPriorityFeePerGas: bigint; maxFeePerGas: bigint }
      baseFee: bigint
      isFixedFee: boolean
    }
  | undefined
> {
  const { maxFeePerGas } = await provider.getFeeData()
  if (!maxFeePerGas) {
    return undefined
  }

  const baseFeePerGasInUnit = new TokenBaseUnit2(
    maxFeePerGas,
    network.networkToken.decimals,
    network.networkToken.symbol
  )
  const basePriorityFeePerGas = new TokenBaseUnit2(
    BASE_PRIORITY_FEE_WEI,
    network.networkToken.decimals,
    network.networkToken.symbol
  )

  const lowMaxTip = basePriorityFeePerGas.mul(presetMultipliers.LOW)
  const mediumMaxTip = basePriorityFeePerGas.mul(presetMultipliers.MEDIUM)
  const highMaxTip = basePriorityFeePerGas.mul(presetMultipliers.HIGH)
  return {
    baseFee: baseFeePerGasInUnit.toSubUnit(),
    low: {
      maxFeePerGas: baseFeePerGasInUnit.add(lowMaxTip).toSubUnit(),
      maxPriorityFeePerGas: lowMaxTip.toSubUnit()
    },
    medium: {
      maxFeePerGas: baseFeePerGasInUnit.add(mediumMaxTip).toSubUnit(),
      maxPriorityFeePerGas: mediumMaxTip.toSubUnit()
    },
    high: {
      maxFeePerGas: baseFeePerGasInUnit.add(highMaxTip).toSubUnit(),
      maxPriorityFeePerGas: highMaxTip.toSubUnit()
    },
    isFixedFee: isSwimmer(network)
  }
}
