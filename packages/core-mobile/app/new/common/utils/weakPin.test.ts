import { getWeakPinError, isWeakPin, WEAK_PIN_ERROR_MESSAGE } from './weakPin'

describe('isWeakPin', () => {
  it.each([
    // all same digit
    '000000',
    '111111',
    '999999',
    // ascending / descending sequences (incl. wrap-around)
    '123456',
    '234567',
    '456789',
    '012345',
    '654321',
    '987654',
    '543210',
    '890123',
    // repeated 2/3 digit patterns
    '121212',
    '101010',
    '696969',
    '123123',
    '520520',
    '007007',
    // common PINs
    '112233',
    '111222',
    '123321',
    '159753',
    '147258',
    '258369'
  ])('rejects %s', pin => {
    expect(isWeakPin(pin)).toBe(true)
  })

  it.each(['193746', '284615', '502918', '730164', '124578', '135792'])(
    'accepts %s',
    pin => {
      expect(isWeakPin(pin)).toBe(false)
    }
  )
})

describe('getWeakPinError', () => {
  it('returns the error message for a weak PIN', () => {
    expect(getWeakPinError('000000')).toBe(WEAK_PIN_ERROR_MESSAGE)
  })

  it('returns undefined for a strong PIN', () => {
    expect(getWeakPinError('193746')).toBeUndefined()
  })
})
