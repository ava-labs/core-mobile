import testValidators from 'tests/fixtures/pvm/validators.json'
import { Avax, Hour, MainnetParams, MegaAvax } from 'utils/NetworkParams'
import { bnToBigint } from 'utils/bigNumbers/bnToBigint'
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
          bnToBigint(Avax.muln(25)),
          7 * 24 * Hour,
          bnToBigint(MainnetParams.stakingConfig.RewardConfig.SupplyCap),
          2,
          true
        )
      ).toEqual(0n)
    })
    it('should return non zero if current supply is less than max', () => {
      expect(
        EarnService.calcReward(
          bnToBigint(Avax.muln(2000000)),
          7 * 24 * Hour,
          bnToBigint(MegaAvax.muln(400)),
          2,
          true
        )
      ).toEqual(3018657459186n)
    })
  })
})
