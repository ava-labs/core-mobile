import testValidators from 'tests/fixtures/pvm/validators.json'
import { Hour, MainnetParams } from 'utils/NetworkParams'
import { Seconds } from 'types/siUnits'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
import EarnService from './EarnService'

describe('EarnService', () => {
  describe('getCurrentValidators', () => {
    it('should return valid validators', async () => {
      const validators = await EarnService.getCurrentValidators(true)
      expect(validators).toEqual(testValidators)
    })
  })
  describe('calcReward', () => {
    it('should return zero if current supply is max', () => {
      expect(
        EarnService.calcReward(
          new TokenUnit(25 * 10 ** 9, 9, 'AVAX'),
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
          new TokenUnit(2000000 * 10 ** 9, 9, 'AVAX'),
          Seconds(7 * 24 * Hour),
          new TokenUnit(400_000_000 * 10 ** 9, 9, 'AVAX'),
          2,
          true
        ).toDisplay()
      ).toEqual('3,018.66')
    })
  })
})
