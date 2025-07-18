import { AddDelegatorProps, WalletType } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import { add, getUnixTime, sub } from 'date-fns'
import { Utxo } from '@avalabs/avalanchejs'
import { PChainId } from '@avalabs/glacier-sdk'
import NetworkService from 'services/network/NetworkService'
import BiometricsSDK from 'utils/BiometricsSDK'
import mockMnemonic from 'tests/fixtures/mockMnemonic.json'

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
    const network = NetworkService.getAvalancheNetworkP(false)
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
      jest.mock('services/wallet/WalletService')

      jest // @ts-ignore
        .spyOn(WalletService, 'getReadOnlyAvaSigner')
        // @ts-ignore
        .mockImplementation(() => mockWallet())

      jest // @ts-ignore
        .spyOn(WalletService, 'validateAvalancheFee')
        // @ts-ignore
        .mockImplementation(mockValidateFee)
    })

    beforeEach(() => {
      mockValidateFee.mockReset()
    })

    it('should throw if Node ID is invalid', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: invalidNodeId
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Invalid node id: InvalidNodeID-23420390293d9j09v')
    })
    it('should throw if stake amount is less than 1Avax on Fuji', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(1e8),
        isDevMode: true
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake amount less than minimum')
    })
    it('should throw if stake amount is less than 25Avax on Mainnet', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(24e9),
        isDevMode: false
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake amount less than minimum')
    })
    it('should throw if staking date is in past', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: getUnixTime(sub(new Date(), { minutes: 1 })),
        isDevMode: true
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Start date must be in future: ')
    })
    it('should throw if staking duration is less than 2 weeks for Mainnet', async () => {
      const twoWeeks = 14 * 24 * 60 * 60
      const twoSeconds = 2
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(25e9),
        startDate: validStartDate,
        endDate: validStartDate + twoWeeks - twoSeconds,
        isDevMode: false
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake duration too short')
    })
    it('should throw if stake duration is less than 24 hours for Fuji', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: getUnixTime(sub(day, { seconds: 2 })),
        isDevMode: true
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Stake duration too short')
    })
    it('should throw if reward address is not from P chain', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: getUnixTime(day),
        rewardAddress: 'invalid address',
        isDevMode: true
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Reward address must be from P chain')
    })

    it('should throw if failed to validate fee', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        avaxXPNetwork: network,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }

      mockValidateFee.mockImplementationOnce(() => {
        throw new Error('test fee validation error')
      })

      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('test fee validation error')
    })

    it('should not throw if failed to validate fee when shouldValidateBurnedAmount is false', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        avaxXPNetwork: network,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true,
        shouldValidateBurnedAmount: false
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }

      mockValidateFee.mockImplementationOnce(() => {
        throw new Error('test fee validation error')
      })

      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).not.toThrow('test fee validation error')
    })

    it('should create delegator tx successfully', async () => {
      const params = {
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        avaxXPNetwork: network,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true
      } as AddDelegatorProps & { walletId: string; walletType: WalletType }
      const unsignedTx = await WalletService.createAddDelegatorTx(params)
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
