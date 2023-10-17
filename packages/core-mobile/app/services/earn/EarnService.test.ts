import testValidators from 'tests/fixtures/pvm/validators.json'
import { Hour, MainnetParams } from 'utils/NetworkParams'
import { Seconds } from 'types/siUnits'
import { Avax } from 'types/Avax'
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
          Avax.fromBase(25),
          Seconds(7 * 24 * Hour),
          Avax.fromNanoAvax(MainnetParams.stakingConfig.RewardConfig.SupplyCap),
          2,
          true
        )
      ).toEqual(Avax.fromBase(0))
    })
    it('should return non zero if current supply is less than max', () => {
      expect(
        EarnService.calcReward(
          Avax.fromBase(2000000),
          Seconds(7 * 24 * Hour),
          Avax.fromBase(400_000_000),
          2,
          true
        ).toDisplay()
      ).toEqual('3018.65746')
    })
  })
})
