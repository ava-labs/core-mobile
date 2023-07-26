import testValidators from 'tests/fixtures/pvm/validators.json'
import { Hour, MainnetParams } from 'utils/NetworkParams'
import { Seconds } from 'types/siUnits'
import { BaseAvax } from 'types/BaseAvax'
import EarnService from './EarnService'

describe('EarnService', () => {
  describe('getCurrentValidators', () => {
    it('should return valid validators', async () => {
      const validators = await EarnService.getCurrentValidators(true)
      expect(validators).toStrictEqual(testValidators)
    })
  })
  describe('calcReward', () => {
    it('should return zero if current supply is max', () => {
      expect(
        EarnService.calcReward(
          BaseAvax.fromBase(25),
          Seconds(7 * 24 * Hour),
          BaseAvax.fromNanoAvax(
            MainnetParams.stakingConfig.RewardConfig.SupplyCap
          ),
          2,
          true
        )
      ).toEqual(BaseAvax.fromBase(0))
    })
    it('should return non zero if current supply is less than max', () => {
      expect(
        EarnService.calcReward(
          BaseAvax.fromBase(2000000),
          Seconds(7 * 24 * Hour),
          BaseAvax.fromBase(400_000_000),
          2,
          true
        ).toDisplay()
      ).toEqual('3018.65746')
    })
  })
})
