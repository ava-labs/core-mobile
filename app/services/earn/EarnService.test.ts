import testValidators from 'tests/fixtures/pvm/validators.json'
import EarnService from './EarnService'

describe('EarnService', () => {
  describe('getCurrentValidators', () => {
    it('should return valid validators', async () => {
      const validators = await EarnService.getCurrentValidators(true)
      expect(validators).toStrictEqual(testValidators)
    })
  })
})
