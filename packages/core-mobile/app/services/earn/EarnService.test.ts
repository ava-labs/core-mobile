import testValidators from 'tests/fixtures/pvm/validators.json'
import { Hour, MainnetParams } from 'utils/NetworkParams'
import { Seconds } from 'types/siUnits'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import EarnService from './EarnService'

const mockProvider = {
  getApiP: () => {
    return {
      getCurrentValidators: jest.fn().mockResolvedValue(testValidators)
    }
  }
}

describe('EarnService', () => {
  describe('getCurrentValidators', () => {
    it('should return valid validators', async () => {
      const validators = await EarnService.getCurrentValidators(
        mockProvider as unknown as Avalanche.JsonRpcProvider
      )
      expect(validators).toEqual(testValidators)
    })
  })
  describe('calcReward', () => {
    it('should return zero if current supply is max', () => {
      expect(
        EarnService.calcReward(
          BigInt(25 * 10 ** 9),
          Seconds(7 * 24 * Hour),
          new TokenUnit(
            MainnetParams.stakingConfig.RewardConfig.SupplyCap,
            9,
            'AVAX'
          ),
          2,
          true
        )
      ).toEqual(zeroAvaxPChain())
    })
    it('should return non zero if current supply is less than max', () => {
      expect(
        EarnService.calcReward(
          BigInt(2000000 * 10 ** 9),
          Seconds(7 * 24 * Hour),
          new TokenUnit(400_000_000 * 10 ** 9, 9, 'AVAX'),
          2,
          true
        ).toDisplay()
      ).toEqual('3,018.66')
    })
  })
})
