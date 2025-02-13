import { AddDelegatorProps, WalletType } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import { add, getUnixTime, sub } from 'date-fns'
import { Utxo } from '@avalabs/avalanchejs'
import { PChainId } from '@avalabs/glacier-sdk'
import NetworkService from 'services/network/NetworkService'

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
      WalletService.init({
        mnemonic: 'test',
        walletType: WalletType.MNEMONIC,
        isLoggingIn: false
      })
    })

    it('should throw if Node ID is invalid', async () => {
      const params = {
        nodeId: invalidNodeId
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Invalid node id: InvalidNodeID-23420390293d9j09v')
    })
    it('should throw if staking amount is less than 1Avax on Fuji', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(1e8),
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking amount less than minimum')
    })
    it('should throw if staking amount is less than 25Avax on Mainnet', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: BigInt(24e9),
        isDevMode: false
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking amount less than minimum')
    })
    it('should throw if staking date is in past', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: getUnixTime(sub(new Date(), { minutes: 1 })),
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
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
        isDevMode: false
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking duration too short')
    })
    it('should throw if staking duration is less than 24 hours for Fuji', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: getUnixTime(sub(day, { seconds: 2 })),
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking duration too short')
    })
    it('should throw if reward address is not from P chain', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: getUnixTime(day),
        rewardAddress: 'invalid address',
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Reward address must be from P chain')
    })

    it('should throw if failed to validate fee', async () => {
      const params = {
        avaxXPNetwork: network,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true
      } as AddDelegatorProps

      mockValidateFee.mockImplementationOnce(() => {
        throw new Error('test fee validation error')
      })

      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('test fee validation error')
    })

    it('should not throw if failed to validate fee when shouldValidateBurnedAmount is false', async () => {
      const params = {
        avaxXPNetwork: network,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true,
        shouldValidateBurnedAmount: false
      } as AddDelegatorProps

      mockValidateFee.mockImplementationOnce(() => {
        throw new Error('test fee validation error')
      })

      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).not.toThrow('test fee validation error')
    })

    it('should create delegator tx successfully', async () => {
      const params = {
        avaxXPNetwork: network,
        nodeId: validNodeId,
        stakeAmountInNAvax: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true
      } as AddDelegatorProps
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
