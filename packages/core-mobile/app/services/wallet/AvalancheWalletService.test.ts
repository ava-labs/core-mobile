import { AddDelegatorProps } from 'services/wallet/types'
import { add, getUnixTime, sub } from 'date-fns'
import { Utxo } from '@avalabs/avalanchejs'
import { PChainId } from '@avalabs/glacier-sdk'
import BiometricsSDK from 'utils/BiometricsSDK'
import mockMnemonic from 'tests/fixtures/mockMnemonic.json'
import { Account } from 'store/account'
import AvalancheWalletService from './AvalancheWalletService'

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

      mockValidateFee.mockImplementationOnce(() => {
        throw new Error('test fee validation error')
      })

      await expect(async () => {
        await AvalancheWalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('test fee validation error')
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
})
