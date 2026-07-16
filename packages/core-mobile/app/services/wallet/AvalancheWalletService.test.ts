import { AddDelegatorProps } from 'services/wallet/types'
import { add, getUnixTime, sub } from 'date-fns'
import { pvm, Utxo } from '@avalabs/avalanchejs'
import { PChainId } from '@avalabs/glacier-sdk'
import BiometricsSDK from 'utils/BiometricsSDK'
import mockMnemonic from 'tests/fixtures/mockMnemonic.json'
import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import AvalancheWalletService from './AvalancheWalletService'

const mockValidateBurnedAmount = jest.fn()
jest.mock('@avalabs/avalanchejs', () => {
  const actual = jest.requireActual('@avalabs/avalanchejs')
  return {
    ...actual,
    utils: {
      ...actual.utils,
      validateBurnedAmount: (...args: unknown[]) =>
        mockValidateBurnedAmount(...args)
    }
  }
})

jest.mock('@avalabs/core-wallets-sdk', () => ({
  ...jest.requireActual('@avalabs/core-wallets-sdk'),
  getXpubFromMnemonic: () => {
    return { mnemonic: '1' }
  },
  Avalanche: {
    ...jest.requireActual('@avalabs/core-wallets-sdk').Avalanche,
    getXpubFromMnemonic: () => {
      return { mnemonic: '1' }
    }
  }
}))

jest
  .spyOn(BiometricsSDK, 'loadWalletSecret')
  .mockResolvedValue({ success: true, value: mockMnemonic.value })

describe('WalletService', () => {
  describe('createAddDelegatorTx', () => {
    const validNodeId = 'NodeID-23420390293d9j09v'
    const invalidNodeId = 'InvalidNodeID-23420390293d9j09v'
    const fujiValidStakeAmount = BigInt(2e9)
    const validStartDate = getUnixTime(add(new Date(), { minutes: 1 }))
    const day = add(new Date(), { hours: 24, minutes: 1 })
    const validEndDateFuji = getUnixTime(day)
    const validRewardAddress = 'P-fuji14j3uyv68l3u88c2vaf4qk30q0u2kmcs44a7d9l'

    const mockUnsignedTx = { getTx: jest.fn() }
    const mockValidateFee = jest.fn()
    const addPermissionlessDelegatorMock = jest
      .fn()
      .mockImplementation(() => mockUnsignedTx)
    const getUTXOsMockValue = [] as Utxo[]
    const getUTXOsMock = jest.fn().mockReturnValue(getUTXOsMockValue)
    const mockWallet = jest.fn().mockReturnValue({
      getUTXOs: getUTXOsMock,
      addPermissionlessDelegator: addPermissionlessDelegatorMock
    })

    beforeAll(() => {
      jest.mock('services/wallet/AvalancheWalletService')

      jest // @ts-ignore
        .spyOn(AvalancheWalletService, 'getReadOnlySigner')
        // @ts-ignore
        .mockImplementation(() => mockWallet())

      jest // @ts-ignore
        .spyOn(AvalancheWalletService, 'validateFee')
        // @ts-ignore
        .mockImplementation(mockValidateFee)
    })

    beforeEach(() => {
      mockValidateFee.mockReset()
    })

    it('should throw if Node ID is invalid', async () => {
      const params = {
        isTestnet: true,
        nodeId: invalidNodeId
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Invalid node id: InvalidNodeID-23420390293d9j09v')
    })
    it('should throw if stake amount is less than 1Avax on Fuji', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(1e8),
        isTestnet: true
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake amount less than minimum')
    })
    it('should throw if stake amount is less than 25Avax on Mainnet', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(24e9),
        isTestnet: false
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake amount less than minimum')
    })
    it('should throw if staking date is in past', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: getUnixTime(sub(new Date(), { minutes: 1 })),
        isTestnet: true
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Start date must be in future: ')
    })
    it('should throw if staking duration is less than 2 weeks for Mainnet', async () => {
      const twoWeeks = 14 * 24 * 60 * 60
      const twoSeconds = 2
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(25e9),
        startDate: validStartDate,
        endDate: validStartDate + twoWeeks - twoSeconds,
        isTestnet: false
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake duration too short')
    })
    it('should throw if stake duration is less than 24 hours for Fuji', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: getUnixTime(sub(day, { seconds: 2 })),
        isTestnet: true
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake duration too short')
    })
    it('should throw if reward address is not from P chain', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: getUnixTime(day),
        rewardAddress: 'invalid address',
        isTestnet: true
      } as AddDelegatorProps
      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Reward address must be from P chain')
    })

    it('should throw if failed to validate fee', async () => {
      const params = {
        account: { index: 0 } as Account,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isTestnet: true
      } as AddDelegatorProps

      // Async rejection (not a sync throw) so this only passes when the
      // call site actually awaits validateFee.
      mockValidateFee.mockRejectedValueOnce(
        new Error('test fee validation error')
      )

      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('test fee validation error')
    })

    it('should forward the P-chain fee price from feeState to validateFee', async () => {
      const params = {
        account: { index: 0 } as Account,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isTestnet: true,
        feeState: { price: 7n } as pvm.FeeState
      } as AddDelegatorProps

      await AvalancheWalletService.createAddDelegatorTx(params)

      expect(mockValidateFee).toHaveBeenCalledWith(
        expect.objectContaining({ pChainFeePriceInNAvax: 7n })
      )
    })

    it('should not throw if failed to validate fee when shouldValidateBurnedAmount is false', async () => {
      const params = {
        account: { index: 0 } as Account,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isTestnet: true,
        shouldValidateBurnedAmount: false
      } as AddDelegatorProps

      mockValidateFee.mockImplementationOnce(() => {
        throw new Error('test fee validation error')
      })

      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).not.toThrow('test fee validation error')
    })

    it('should create delegator tx successfully', async () => {
      const params = {
        account: { index: 0 } as Account,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isTestnet: true
      } as AddDelegatorProps
      const unsignedTx = await AvalancheWalletService.createAddDelegatorTx(
        params
      )
      expect(getUTXOsMock).toHaveBeenCalled()
      expect(addPermissionlessDelegatorMock).toHaveBeenCalledWith({
        utxoSet: getUTXOsMockValue,
        nodeId: validNodeId,
        start: BigInt(validStartDate),
        end: BigInt(validEndDateFuji),
        weight: fujiValidStakeAmount,
        subnetId: PChainId._11111111111111111111111111111111LPO_YY,
        rewardAddresses: [validRewardAddress]
      })
      expect(unsignedTx).toStrictEqual(mockUnsignedTx)
    })
  })

  describe('validateFee', () => {
    const mockGetFeeState = jest.fn()
    const mockProvider = {
      getContext: () => ({}),
      getApiP: () => ({ getFeeState: mockGetFeeState })
    }

    let providerSpy: jest.SpyInstance

    const callValidateFee = (args: {
      isTestnet: boolean
      unsignedTx: unknown
      evmBaseFeeInNAvax?: bigint
      pChainFeePriceInNAvax?: bigint
    }): Promise<void> =>
      (
        AvalancheWalletService as unknown as {
          validateFee: (a: typeof args) => Promise<void>
        }
      ).validateFee(args)

    const evmTx = { getVM: () => 'EVM', getTx: jest.fn() }
    const pvmTx = { getVM: () => 'PVM', getTx: jest.fn() }

    beforeAll(() => {
      // The createAddDelegatorTx describe above replaces validateFee with a
      // mock and never restores it — undo that so we test the real method.
      const maybeMocked = (
        AvalancheWalletService as unknown as Record<
          'validateFee',
          { mockRestore?: () => void }
        >
      ).validateFee
      maybeMocked.mockRestore?.()

      providerSpy = jest
        .spyOn(NetworkService, 'getAvalancheProviderXP')
        // @ts-ignore
        .mockResolvedValue(mockProvider)
    })

    beforeEach(() => {
      mockGetFeeState.mockReset().mockResolvedValue({ price: 5n })
      mockValidateBurnedAmount.mockReset()
      mockValidateBurnedAmount.mockReturnValue({ isValid: true, txFee: 1n })
    })

    afterAll(() => {
      providerSpy.mockRestore()
    })

    it('throws for EVM txs when the evm base fee is missing', async () => {
      await expect(
        callValidateFee({ isTestnet: true, unsignedTx: evmTx })
      ).rejects.toThrow('Missing evm fee data')
      expect(mockValidateBurnedAmount).not.toHaveBeenCalled()
    })

    it('uses the evm base fee for EVM txs', async () => {
      await callValidateFee({
        isTestnet: true,
        unsignedTx: evmTx,
        evmBaseFeeInNAvax: 3n
      })

      expect(mockValidateBurnedAmount).toHaveBeenCalledWith(
        expect.objectContaining({ baseFee: 3n })
      )
    })

    it('uses the caller-provided P-chain fee price for PVM txs', async () => {
      await callValidateFee({
        isTestnet: true,
        unsignedTx: pvmTx,
        pChainFeePriceInNAvax: 7n
      })

      expect(mockValidateBurnedAmount).toHaveBeenCalledWith(
        expect.objectContaining({ baseFee: 7n })
      )
      expect(mockGetFeeState).not.toHaveBeenCalled()
    })

    it('fetches the fee state for PVM txs when no price is provided', async () => {
      await callValidateFee({ isTestnet: true, unsignedTx: pvmTx })

      expect(mockGetFeeState).toHaveBeenCalled()
      expect(mockValidateBurnedAmount).toHaveBeenCalledWith(
        expect.objectContaining({ baseFee: 5n })
      )
    })

    it('skips validation when the fee-state fetch fails for PVM txs', async () => {
      mockGetFeeState.mockRejectedValue(new Error('rpc down'))

      await expect(
        callValidateFee({ isTestnet: true, unsignedTx: pvmTx })
      ).resolves.toBeUndefined()
      expect(mockValidateBurnedAmount).not.toHaveBeenCalled()
    })

    it('throws when the burned amount is invalid', async () => {
      mockValidateBurnedAmount.mockReturnValue({ isValid: false, txFee: 9n })

      await expect(
        callValidateFee({
          isTestnet: true,
          unsignedTx: pvmTx,
          pChainFeePriceInNAvax: 7n
        })
      ).rejects.toThrow('Excessive burn amount')
    })
  })

  describe('getAllAtomicUTXOs', () => {
    // Returns a sentinel UtxoSet tagged with the (dest, source) it was called
    // with, so we can assert each route maps to the right signer call.
    const getAtomicUTXOsMock = jest
      .fn()
      .mockImplementation((dest: string, source: string) => ({ dest, source }))
    const atomicMockWallet = jest.fn().mockReturnValue({
      getAtomicUTXOs: getAtomicUTXOsMock
    })

    let readOnlySignerSpy: jest.SpyInstance

    beforeAll(() => {
      readOnlySignerSpy = jest // @ts-ignore
        .spyOn(AvalancheWalletService, 'getReadOnlySigner')
        // @ts-ignore
        .mockImplementation(() => atomicMockWallet())
    })

    afterAll(() => {
      readOnlySignerSpy.mockRestore()
    })

    it('returns all six CCT routes, one signer call per (dest, source) pair', async () => {
      const result = await AvalancheWalletService.getAllAtomicUTXOs({
        account: { index: 0 } as Account,
        isTestnet: true,
        xpAddresses: ['P-fuji1abc']
      })

      const pairs = result.map(r => `${r.source}->${r.dest}`).sort()
      expect(pairs).toStrictEqual(
        ['C->P', 'X->P', 'P->C', 'X->C', 'P->X', 'C->X'].sort()
      )
      // each entry's utxos came from getAtomicUTXOs(dest, source)
      result.forEach(r => {
        expect(r.utxos).toStrictEqual({ dest: r.dest, source: r.source })
      })
      expect(getAtomicUTXOsMock).toHaveBeenCalledTimes(6)
    })
  })
})
