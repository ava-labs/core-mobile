import { AddDelegatorProps } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import { add, getUnixTime, sub } from 'date-fns'
import { Utxo } from '@avalabs/avalanchejs-v2/src/serializable/avax/utxo'

describe('WalletService', () => {
  const validNodeId = 'NodeID-23420390293d9j09v'
  const invalidNodeId = 'InvalidNodeID-23420390293d9j09v'
  const fujiValidStakeAmount = BigInt(2e9)
  const validStartDate = BigInt(getUnixTime(new Date()))
  const day = add(new Date(), { hours: 24 })
  const validEndDateFuji = BigInt(getUnixTime(day))
  const validRewardAddress = 'P-validAddress'

  const addDelegatorMock = jest.fn()
  const getUTXOsMockValue = [] as Utxo[]
  const getUTXOsMock = jest.fn().mockReturnValue(getUTXOsMockValue)
  const mockWallet = jest.fn().mockReturnValue({
    getUTXOs: getUTXOsMock,
    addDelegator: addDelegatorMock
  })
  jest.mock('services/wallet/WalletService')
  // @ts-ignore
  jest.spyOn(WalletService, 'getWallet').mockImplementation(() => mockWallet())

  describe('createAddDelegatorTx', () => {
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
        stakeAmount: BigInt(1e8),
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking amount less than minimum')
    })
    it('should throw if staking amount is less than 25Avax on Mainnet', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmount: BigInt(24e9),
        isDevMode: false
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking amount less than minimum')
    })
    it('should throw if staking date is in past', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmount: fujiValidStakeAmount,
        startDate: BigInt(getUnixTime(sub(new Date(), { minutes: 1 }))),
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Start date must be in future: ')
    })
    it('should throw if staking duration is less than 2 weeks for Mainnet', async () => {
      const twoWeeks = add(new Date(), { weeks: 2 })
      const params = {
        nodeId: validNodeId,
        stakeAmount: BigInt(25e9),
        startDate: validStartDate,
        endDate: BigInt(getUnixTime(sub(twoWeeks, { seconds: 2 }))),
        isDevMode: false
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking duration too short')
    })
    it('should throw if staking duration is less than 24 hours for Fuji', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmount: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: BigInt(getUnixTime(sub(day, { seconds: 2 }))),
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Staking duration too short')
    })
    it('should throw if reward address is not from P chain', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmount: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: BigInt(getUnixTime(day)),
        rewardAddress: 'invalid address',
        isDevMode: true
      } as AddDelegatorProps
      await expect(async () => {
        await WalletService.createAddDelegatorTx(params)
      }).rejects.toThrow('Reward address must be from P chain')
    })

    it('should return true', async () => {
      const params = {
        nodeId: validNodeId,
        stakeAmount: fujiValidStakeAmount,
        startDate: validStartDate,
        endDate: validEndDateFuji,
        rewardAddress: validRewardAddress,
        isDevMode: true
      } as AddDelegatorProps
      await WalletService.createAddDelegatorTx(params)
      expect(getUTXOsMock).toHaveBeenCalled()
      expect(addDelegatorMock).toHaveBeenCalledWith(
        getUTXOsMockValue,
        validNodeId,
        fujiValidStakeAmount,
        validStartDate,
        validEndDateFuji,
        {
          rewardAddress: validRewardAddress
        }
      )
    })
  })
})
