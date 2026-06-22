import { EvmModule } from '@avalabs/evm-module'
import { BitcoinModule } from '@avalabs/bitcoin-module'
import { AvalancheModule } from '@avalabs/avalanche-module'
import { SvmModule } from '@avalabs/svm-module'
import { NetworkVMType, Network } from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { WalletType } from 'services/wallet/types'
import { VmModuleErrors } from './errors'

// Keep real module instances so chainId/namespace lookups still hit real
// manifests in the other tests; only stub the derivation pipeline.
jest
  .spyOn(EvmModule.prototype, 'deriveAddresses')
  .mockImplementation(async ({ accountIndices }) =>
    accountIndices.map((_, i) => ({ [NetworkVMType.EVM]: `0xevm${i}` }))
  )
jest
  .spyOn(BitcoinModule.prototype, 'deriveAddresses')
  .mockImplementation(async ({ accountIndices, network }) =>
    accountIndices.map((_, i) => ({
      [NetworkVMType.BITCOIN]: `${network.isTestnet ? 'tb1' : 'bc1'}btc${i}`
    }))
  )
jest
  .spyOn(AvalancheModule.prototype, 'deriveAddresses')
  .mockImplementation(async ({ accountIndices }) =>
    accountIndices.map((_, i) => ({
      [NetworkVMType.AVM]: `X-avax${i}`,
      [NetworkVMType.PVM]: `P-avax${i}`,
      [NetworkVMType.CoreEth]: `C-avax${i}`
    }))
  )
const mockSvmResolved = (): void => {
  jest
    .spyOn(SvmModule.prototype, 'deriveAddresses')
    .mockImplementation(async ({ accountIndices }) =>
      accountIndices.map((_, i) => ({ [NetworkVMType.SVM]: `svm${i}` }))
    )
}
mockSvmResolved()

describe('ModuleManager', () => {
  describe('not initialized', () => {
    it('should have thrown with not initialized error', async () => {
      try {
        await ModuleManager.loadModule('eip155:123', 'eth_randomMethod')
      } catch (e) {
        expect((e as Error).message).toBe('modules are not initialized')
      }
    })
  })
  describe('initialized', () => {
    it('should load the correct modules', async () => {
      const params = [
        {
          chainId: 'eip155:1',
          method: 'eth_randomMethod',
          name: NetworkVMType.EVM
        },
        {
          chainId: 'bip122:000000000019d6689c085ae165831e93',
          method: 'bitcoin_sendTransaction',
          name: NetworkVMType.BITCOIN
        },
        {
          chainId: 'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
          method: 'avalanche_sendTransaction',
          name: NetworkVMType.AVM
        },
        {
          chainId: 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
          method: 'avalanche_sendTransaction',
          name: NetworkVMType.PVM
        },
        {
          chainId: 'avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG',
          method: 'avalanche_sendTransaction',
          name: NetworkVMType.AVM
        },
        {
          chainId: 'avax:8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl',
          method: 'avalanche_sendTransaction',
          name: NetworkVMType.PVM
        }
      ]
      params.forEach(async param => {
        const module = await ModuleManager.loadModule(
          param.chainId,
          param.method
        )
        const isChainIdSupported = module
          ?.getManifest()
          ?.network.chainIds.includes(param.chainId)
        const isNamespaceSupported = module
          ?.getManifest()
          ?.network.namespaces.includes(param.chainId.split(':')[0] ?? '')
        expect(isChainIdSupported || isNamespaceSupported).toBeTruthy()
      })
    })
    it('should have thrown with incorrect chainId', async () => {
      try {
        await ModuleManager.loadModule('eip155:123', 'eth_randomMethod')
      } catch (e) {
        expect((e as VmModuleErrors).name).toBe('UNSUPPORTED_CHAIN_ID')
      }
    })
    it('should have thrown with incorrect method', async () => {
      try {
        await ModuleManager.loadModule('eip155:1', 'evth_randomMethod')
      } catch (e) {
        expect((e as VmModuleErrors).name).toBe('UNSUPPORTED_METHOD')
      }
    })
    it('should have thrown with incorrect namespace', async () => {
      try {
        await ModuleManager.loadModule('avalanche:1', 'eth_method')
      } catch (e) {
        expect((e as VmModuleErrors).name).toBe('UNSUPPORTED_CHAIN_ID')
      }
    })
  })

  describe('deriveAllAddresses', () => {
    it('returns an empty array when accountIndices is empty', async () => {
      const result = await ModuleManager.deriveAllAddresses({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        accountIndices: [],
        network: { isTestnet: false } as Network
      })
      expect(result).toEqual([])
    })

    it('passes a single index through and returns one record', async () => {
      const result = await ModuleManager.deriveAllAddresses({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        accountIndices: [7],
        network: { isTestnet: false } as Network
      })
      expect(result).toHaveLength(1)
      expect(result[0]?.[NetworkVMType.EVM]).toBe('0xevm0')
      expect(result[0]?.[NetworkVMType.CoreEth]).toBe('C-avax0')
    })

    it('merges per-module batch results positionally', async () => {
      const result = await ModuleManager.deriveAllAddresses({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        accountIndices: [0, 1, 2],
        network: { isTestnet: false } as Network
      })
      expect(result).toHaveLength(3)
      expect(result.map(r => r?.[NetworkVMType.AVM])).toEqual([
        'X-avax0',
        'X-avax1',
        'X-avax2'
      ])
      expect(result.map(r => r?.[NetworkVMType.SVM])).toEqual([
        'svm0',
        'svm1',
        'svm2'
      ])
    })

    it('returns undefined slots when a module rejects so partial failure is not masked', async () => {
      jest
        .spyOn(AvalancheModule.prototype, 'deriveAddresses')
        .mockRejectedValueOnce(new Error('xp pubkey unavailable'))

      const result = await ModuleManager.deriveAllAddresses({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        accountIndices: [0, 1],
        network: { isTestnet: false } as Network
      })
      // A single module rejection means that chain is missing for every index
      // in the batch, so no index can produce a complete record. We surface
      // `undefined` rather than empty-string addresses so downstream
      // `!addresses` guards engage instead of treating the account as valid.
      expect(result).toEqual([undefined, undefined])
    })

    describe('Solana exclusion for Keystone', () => {
      afterEach(() => {
        // Restore the default resolving Solana mock so later tests are unaffected.
        mockSvmResolved()
      })

      it('still derives a Keystone account when the Solana module rejects', async () => {
        // Keystone hardware cannot derive Solana (ED25519) addresses, so the
        // Solana module rejects. This must NOT discard the whole account.
        jest
          .spyOn(SvmModule.prototype, 'deriveAddresses')
          .mockRejectedValue(new Error('ED25519 not supported'))

        const result = await ModuleManager.deriveAllAddresses({
          walletId: 'w1',
          walletType: WalletType.KEYSTONE,
          accountIndices: [0],
          network: { isTestnet: false } as Network
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toBeDefined()
        expect(result[0]?.[NetworkVMType.EVM]).toBe('0xevm0')
        expect(result[0]?.[NetworkVMType.AVM]).toBe('X-avax0')
        expect(result[0]?.[NetworkVMType.BITCOIN]).toBe('bc1btc0')
        // Solana is not derivable for Keystone; the address is simply absent.
        expect(result[0]?.[NetworkVMType.SVM]).toBeFalsy()
      })

      it('still fails closed when the Solana module rejects for a non-Keystone wallet', async () => {
        jest
          .spyOn(SvmModule.prototype, 'deriveAddresses')
          .mockRejectedValue(new Error('transient svm failure'))

        const result = await ModuleManager.deriveAllAddresses({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC,
          accountIndices: [0],
          network: { isTestnet: false } as Network
        })

        expect(result).toEqual([undefined])
      })
    })
  })
})
