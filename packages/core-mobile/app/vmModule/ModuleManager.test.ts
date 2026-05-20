import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  deriveAddressesForAvalanche,
  deriveAddressesForBtc,
  deriveAddressesForEvm,
  deriveAddressesForSvm
} from 'react-native-nitro-avalabs-crypto'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import ModuleManager from 'vmModule/ModuleManager'
import { VmModuleErrors } from './errors'

jest.mock('react-native-nitro-avalabs-crypto', () => ({
  __esModule: true,
  deriveAddressesForEvm: jest.fn(),
  deriveAddressesForBtc: jest.fn(),
  deriveAddressesForAvalanche: jest.fn(),
  deriveAddressesForSvm: jest.fn()
}))

jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: {
    getPublicKeyFor: jest.fn()
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
    const walletId = 'wallet-1'
    const walletType = WalletType.MNEMONIC
    const network = { isTestnet: false } as Network

    const mockedDeriveEvm = deriveAddressesForEvm as jest.MockedFunction<
      typeof deriveAddressesForEvm
    >
    const mockedDeriveBtc = deriveAddressesForBtc as jest.MockedFunction<
      typeof deriveAddressesForBtc
    >
    const mockedDeriveAvalanche =
      deriveAddressesForAvalanche as jest.MockedFunction<
        typeof deriveAddressesForAvalanche
      >
    const mockedDeriveSvm = deriveAddressesForSvm as jest.MockedFunction<
      typeof deriveAddressesForSvm
    >
    const mockedGetPublicKeyFor = WalletService.getPublicKeyFor as jest.Mock

    beforeEach(() => {
      jest.clearAllMocks()
      // Return a deterministic hex string keyed on derivationPath so the
      // assertions below can check that the per-chain pubkeys reach the
      // right native helper without us having to encode a real public key.
      mockedGetPublicKeyFor.mockImplementation(
        async ({ derivationPath }: { derivationPath: string }) =>
          `pk_${derivationPath}`
      )
    })

    it('returns an empty array when accountIndices is empty', async () => {
      const result = await ModuleManager.deriveAllAddresses({
        walletId,
        walletType,
        accountIndices: [],
        network
      })

      expect(result).toEqual([])
      expect(mockedGetPublicKeyFor).not.toHaveBeenCalled()
      expect(mockedDeriveEvm).not.toHaveBeenCalled()
    })

    it('maps native batch outputs back to per-account-index records', async () => {
      const accountIndices = [0, 1, 2]

      mockedDeriveEvm.mockReturnValue(['0xEVM0', '0xEVM1', '0xEVM2'])
      mockedDeriveBtc.mockReturnValue(['btc0', 'btc1', 'btc2'])
      mockedDeriveAvalanche.mockReturnValue([
        { x: 'X-avax0', p: 'P-avax0', coreEth: 'C-avax0' },
        { x: 'X-avax1', p: 'P-avax1', coreEth: 'C-avax1' },
        { x: 'X-avax2', p: 'P-avax2', coreEth: 'C-avax2' }
      ])
      mockedDeriveSvm.mockReturnValue(['sol0', 'sol1', 'sol2'])

      const result = await ModuleManager.deriveAllAddresses({
        walletId,
        walletType,
        accountIndices,
        network
      })

      // 1) Native calls received pubkeys aligned with accountIndices.
      expect(mockedDeriveEvm).toHaveBeenCalledTimes(1)
      expect(mockedDeriveBtc).toHaveBeenCalledTimes(1)
      expect(mockedDeriveAvalanche).toHaveBeenCalledTimes(1)
      expect(mockedDeriveSvm).toHaveBeenCalledTimes(1)
      const [evmPubsArg] = mockedDeriveEvm.mock.calls[0] as [string[]]
      expect(evmPubsArg).toHaveLength(3)
      expect(mockedDeriveBtc).toHaveBeenCalledWith(evmPubsArg, false)
      const [avaxPubsArg, evmPubsForAvaxArg, isTestnetArg] =
        mockedDeriveAvalanche.mock.calls[0] as [string[], string[], boolean]
      expect(avaxPubsArg).toHaveLength(3)
      expect(evmPubsForAvaxArg).toEqual(evmPubsArg)
      expect(isTestnetArg).toBe(false)

      // 2) Each accountIndex slot carries the matching addresses from every
      //    native batch, indexed by position.
      expect(result).toHaveLength(3)
      result.forEach((entry, i) => {
        const idx = accountIndices[i] as number
        expect(entry.accountIndex).toBe(idx)
        expect(entry.addresses[NetworkVMType.EVM]).toBe(`0xEVM${idx}`)
        expect(entry.addresses[NetworkVMType.BITCOIN]).toBe(`btc${idx}`)
        expect(entry.addresses[NetworkVMType.AVM]).toBe(`X-avax${idx}`)
        expect(entry.addresses[NetworkVMType.PVM]).toBe(`P-avax${idx}`)
        expect(entry.addresses[NetworkVMType.CoreEth]).toBe(`C-avax${idx}`)
        expect(entry.addresses[NetworkVMType.SVM]).toBe(`sol${idx}`)
      })
    })

    it('passes isTestnet through to chain helpers that need it', async () => {
      mockedDeriveEvm.mockReturnValue(['0xEVM0'])
      mockedDeriveBtc.mockReturnValue(['tb1q0'])
      mockedDeriveAvalanche.mockReturnValue([
        { x: 'X-fuji0', p: 'P-fuji0', coreEth: 'C-fuji0' }
      ])
      mockedDeriveSvm.mockReturnValue(['sol0'])

      await ModuleManager.deriveAllAddresses({
        walletId,
        walletType,
        accountIndices: [0],
        network: { isTestnet: true } as Network
      })

      expect(mockedDeriveBtc).toHaveBeenCalledWith(expect.any(Array), true)
      expect(mockedDeriveAvalanche).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        true
      )
    })

    it.each([
      [
        'EVM',
        (): void => {
          mockedDeriveEvm.mockReturnValue(['0xEVM0', '0xEVM1']) // short
        }
      ],
      [
        'BTC',
        (): void => {
          mockedDeriveBtc.mockReturnValue(['btc0', 'btc1']) // short
        }
      ],
      [
        'Avalanche',
        (): void => {
          // short — only 2 entries for 3 requested indices
          mockedDeriveAvalanche.mockReturnValue([
            { x: 'X-avax0', p: 'P-avax0', coreEth: 'C-avax0' },
            { x: 'X-avax1', p: 'P-avax1', coreEth: 'C-avax1' }
          ])
        }
      ],
      [
        'SVM',
        (): void => {
          mockedDeriveSvm.mockReturnValue(['sol0', 'sol1']) // short
        }
      ]
    ])(
      'throws when the %s native batch returns fewer entries than requested',
      async (_label, setupShortBatch) => {
        const accountIndices = [0, 1, 2]

        // Healthy defaults for every chain — the test override below shortens
        // exactly one of them.
        mockedDeriveEvm.mockReturnValue(['0xEVM0', '0xEVM1', '0xEVM2'])
        mockedDeriveBtc.mockReturnValue(['btc0', 'btc1', 'btc2'])
        mockedDeriveAvalanche.mockReturnValue([
          { x: 'X-avax0', p: 'P-avax0', coreEth: 'C-avax0' },
          { x: 'X-avax1', p: 'P-avax1', coreEth: 'C-avax1' },
          { x: 'X-avax2', p: 'P-avax2', coreEth: 'C-avax2' }
        ])
        mockedDeriveSvm.mockReturnValue(['sol0', 'sol1', 'sol2'])

        setupShortBatch()

        await expect(
          ModuleManager.deriveAllAddresses({
            walletId,
            walletType,
            accountIndices,
            network
          })
        ).rejects.toThrow(/native batch length mismatch/)
      }
    )
  })
})
