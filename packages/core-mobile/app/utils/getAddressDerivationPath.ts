import { DerivationPathType, NetworkVMType } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'

export const getAddressDerivationPath = ({
  accountIndex,
  vmType,
  derivationPathType = 'bip44'
}: {
  accountIndex: number
  vmType: NetworkVMType
  derivationPathType?: DerivationPathType
}): string => {
  let derivationPath: string | undefined
  switch (vmType) {
    case NetworkVMType.AVM:
    case NetworkVMType.PVM:
      derivationPath = ModuleManager.avalancheModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[NetworkVMType.AVM]
      break
    case NetworkVMType.CoreEth:
    case NetworkVMType.EVM:
      derivationPath = ModuleManager.evmModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[NetworkVMType.EVM]
      break
    case NetworkVMType.BITCOIN:
      derivationPath = ModuleManager.bitcoinModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[NetworkVMType.BITCOIN]
      break
    case NetworkVMType.SVM:
      derivationPath = ModuleManager.solanaModule.buildDerivationPath({
        accountIndex,
        derivationPathType
      })[NetworkVMType.SVM]
      break
  }

  if (!derivationPath) {
    throw new Error(`Unsupported VM type: ${vmType}`)
  }

  return derivationPath
}
