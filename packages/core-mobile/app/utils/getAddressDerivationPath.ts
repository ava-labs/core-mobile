import { DerivationPathType, NetworkVMType } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'

export const getAddressDerivationPath = ({
  accountIndex,
  vmType,
  derivationPathType = 'bip44'
}: {
  accountIndex: number
  vmType: Exclude<NetworkVMType, NetworkVMType.PVM | NetworkVMType.HVM>
  derivationPathType?: DerivationPathType
}): string => {
  let derivationPath: string | undefined
  switch (vmType) {
    case NetworkVMType.AVM:
    case NetworkVMType.CoreEth:
      derivationPath = ModuleManager.avalancheModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
    case NetworkVMType.EVM:
      derivationPath = ModuleManager.evmModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
    case NetworkVMType.BITCOIN:
      derivationPath = ModuleManager.bitcoinModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
    case NetworkVMType.SVM:
      derivationPath = ModuleManager.solanaModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[vmType]
      break
  }

  if (!derivationPath) {
    throw new Error(`Unsupported VM type: ${vmType}`)
  }

  return derivationPath
}
