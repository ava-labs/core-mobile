import { NetworkVMType, Network } from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { WalletType } from 'services/wallet/types'
import { VmModuleErrors } from './errors'

jest.mock('react-native-nitro-avalabs-crypto', () => ({
  deriveAddressesForEvm: jest.fn(
    (pubkeys: unknown[]) => pubkeys.map((_, i) => `0xevm${i}`)
  ),
  deriveAddressesForBTC: jest.fn(
    (pubkeys: unknown[], isTestnet: boolean) =>
      pubkeys.map((_, i) => `${isTestnet ? 'tb1' : 'bc1'}btc${i}`)
  ),
  deriveAddressesForAvax: jest.fn((avaxPubkeys: unknown[]) =>
    avaxPubkeys.map((_, i) => ({
      avm: `X-avax${i}`,
      pvm: `P-avax${i}`,
      coreEth: `C-avax${i}`
    }))
  ),
  deriveAddressesForSVM: jest.fn(
    (pubkeys: unknown[]) => pubkeys.map((_, i) => `svm${i}`)
  )
}))

jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: {
    getPublicKey: jest.fn(
      async (_walletId: string, _walletType: string, _accountIndex: number) => ({
        evm: '02' + '11'.repeat(32),
        xp: '02' + '22'.repeat(32)
      })
    ),
    getPublicKeyFor: jest.fn(async () => '33'.repeat(32))
  }
}))

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
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('returns an empty array when accountIndices is empty', async () => {
      const result = await ModuleManager.deriveAllAddresses({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        accountIndices: [],
        network: { isTestnet: false } as Network
      })
      expect(result).toEqual([])
    })

    it('throws when accountIndices has a gap', async () => {
      await expect(
        ModuleManager.deriveAllAddresses({
          walletId: 'w1',
          walletType: WalletType.MNEMONIC,
          accountIndices: [0, 1, 3],
          network: { isTestnet: false } as Network
        })
      ).rejects.toThrow(/consecutive/)
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

    it('processes a consecutive batch and aligns results by index', async () => {
      const result = await ModuleManager.deriveAllAddresses({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        accountIndices: [0, 1, 2],
        network: { isTestnet: false } as Network
      })
      expect(result).toHaveLength(3)
      expect(result.map(r => r[NetworkVMType.AVM])).toEqual([
        'X-avax0',
        'X-avax1',
        'X-avax2'
      ])
    })
  })
})
