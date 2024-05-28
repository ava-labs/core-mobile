import { NetworkVMType } from '@avalabs/chains-sdk'
import { avm } from 'mock_modules/avm'
import { bitcoin } from 'mock_modules/bitcoin'
import { coreEth } from 'mock_modules/coreEth'
import { evm } from 'mock_modules/evm'
import { pvm } from 'mock_modules/pvm'
import { Manifest, ManifestSchema, Module, Manifests } from 'mock_modules/types'
import { RpcMethod } from 'store/rpc'
import Logger from 'utils/Logger'

class ModuleManager {
  private manifests: Manifests

  loadManifests = async (): Promise<Manifests> => {
    const manifests: Record<NetworkVMType | string, Manifest> = {}

    const evmManifest = await this.loadEVMManifest()
    const pvmManifest = await this.loadPVMManifest()
    const avmManifest = await this.loadAVMManifest()
    const bitcoinManifest = await this.loadBitcoinManifest()
    const coreEthManifest = await this.loadCoreEthManifest()

    if (evmManifest && this.verifyChecksum(evmManifest)) {
      manifests[NetworkVMType.EVM] = evmManifest
    }
    if (pvmManifest && this.verifyChecksum(pvmManifest)) {
      manifests[NetworkVMType.PVM] = pvmManifest
    }
    if (avmManifest && this.verifyChecksum(avmManifest)) {
      manifests[NetworkVMType.AVM] = avmManifest
    }
    if (bitcoinManifest && this.verifyChecksum(bitcoinManifest)) {
      manifests[NetworkVMType.BITCOIN] = bitcoinManifest
    }
    if (coreEthManifest && this.verifyChecksum(coreEthManifest)) {
      manifests[NetworkVMType.CoreEth] = coreEthManifest
    }
    return manifests as Manifests
  }

  loadModule = async (
    chainId: string,
    method: RpcMethod
  ): Promise<Module | undefined> => {
    const allManifests =
      Object.keys(this.manifests).length > 0
        ? this.manifests
        : await this.loadManifests()
    const module = await this.getModule(chainId, allManifests)
    if (module === undefined) {
      throw new Error(`No module found for chainId: ${chainId}`)
    }

    if (!this.isMethodPermitted(module, method)) {
      throw new Error(`Method ${method} is not permitted for module ${module}`)
    }

    return module
  }

  private getModule = async (
    chainId: string,
    manifests: Manifests
  ): Promise<Module | undefined> => {
    return (
      (await this.getModuleNameByChainId(chainId, manifests)) ??
      (await this.getModuleNameByNamespace(chainId, manifests))
    )
  }

  private getModuleNameByChainId = async (
    chainId: string,
    manifests: Manifests
  ): Promise<Module | undefined> => {
    if (manifests.EVM.network.chainIds.includes(chainId)) {
      return evm
    }
    if (manifests.PVM.network.chainIds.includes(chainId)) {
      return pvm
    }
    if (manifests.AVM.network.chainIds.includes(chainId)) {
      return avm
    }
    if (manifests.BITCOIN.network.chainIds.includes(chainId)) {
      return bitcoin
    }
    if (manifests.CoreEth.network.chainIds.includes(chainId)) {
      return coreEth
    }
    return undefined
  }

  private getModuleNameByNamespace = async (
    chainId: string,
    manifests: Manifests
  ): Promise<Module | undefined> => {
    const namespace = chainId.split(':')[0]
    if (namespace === undefined) {
      Logger.error('No namespace found for chainId: ', chainId)
      return undefined
    }

    if (manifests.EVM.network.namespaces.includes(namespace)) {
      return evm
    }
    if (manifests.PVM.network.namespaces.includes(namespace)) {
      return pvm
    }
    if (manifests.AVM.network.namespaces.includes(namespace)) {
      return avm
    }
    if (manifests.BITCOIN.network.namespaces.includes(namespace)) {
      return bitcoin
    }
    if (manifests.CoreEth.network.namespaces.includes(namespace)) {
      return coreEth
    }
    return undefined
  }

  private loadEVMManifest = async (): Promise<Manifest | undefined> => {
    const evmManifestJSON = await require('mock_modules/evm_manifest.json')
    const evmManifest = ManifestSchema.safeParse(evmManifestJSON)
    if (evmManifest.success) {
      return evmManifest.data
    }
    return undefined
  }

  private loadPVMManifest = async (): Promise<Manifest | undefined> => {
    const pvmManifestJSON = await require('mock_modules/pvm_manifest.json')
    const pvmManifest = ManifestSchema.safeParse(pvmManifestJSON)
    if (pvmManifest.success) {
      return pvmManifest.data
    }
    return undefined
  }

  private loadAVMManifest = async (): Promise<Manifest | undefined> => {
    const avmManifestJSON = await require('mock_modules/avm_manifest.json')
    const avmManifest = ManifestSchema.safeParse(avmManifestJSON)
    if (avmManifest.success) {
      return avmManifest.data
    }
    return undefined
  }

  private loadBitcoinManifest = async (): Promise<Manifest | undefined> => {
    const bitcoinManifestJSON =
      await require('mock_modules/bitcoin_manifest.json')
    const bitcoinManifest = ManifestSchema.safeParse(bitcoinManifestJSON)
    if (bitcoinManifest.success) {
      return bitcoinManifest.data
    }
    return undefined
  }

  private loadCoreEthManifest = async (): Promise<Manifest | undefined> => {
    const coreEthManifestJSON =
      await require('mock_modules/coreEth_manifest.json')
    const coreEthManifest = ManifestSchema.safeParse(coreEthManifestJSON)
    if (coreEthManifest.success) {
      return coreEthManifest.data
    }
    return undefined
  }

  // the bundle's checksum to be verified before execution
  private verifyChecksum = (_: Manifest): boolean => {
    return true
  }

  private isMethodPermitted = (module: Module, method: string): boolean => {
    return this.manifests[module.getVMType()].permissions.rpc.methods.includes(
      method
    )
  }
}

export default new ModuleManager()
