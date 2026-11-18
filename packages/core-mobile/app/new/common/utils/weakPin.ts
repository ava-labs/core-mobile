export const WEAK_PIN_ERROR_MESSAGE =
  'This PIN is too easy to guess. Avoid repeated digits, sequences like 123456 and common PINs.'

/**
 * Frequently used 6-digit PINs that are not caught by the structural checks
 * below (repeated patterns / consecutive sequences).
 */
const COMMON_PINS = new Set([
  '112233',
  '111222',
  '000111',
  '222333',
  '123321',
  '332211',
  '998877',
  '102030',
  '159753',
  '147258',
  '258369',
  '147852',
  '789456',
  '456123',
  '654123'
])

/**
 * True when the PIN repeats a 1, 2 or 3 digit pattern,
 * e.g. 000000, 121212, 123123.
 */
const isRepeatedPattern = (pin: string): boolean =>
  [1, 2, 3].some(size => {
    if (pin.length % size !== 0) return false
    const pattern = pin.slice(0, size)
    return pattern.repeat(pin.length / size) === pin
  })

/**
 * True when every digit is the previous one +1 or -1 (wrapping 9 <-> 0),
 * e.g. 123456, 654321, 890123.
 */
const isConsecutiveSequence = (pin: string): boolean => {
  const digits = pin.split('').map(Number)
  const steps = new Set<number>()
  for (let i = 1; i < digits.length; i++) {
    const diff = (digits[i] ?? 0) - (digits[i - 1] ?? 0)
    steps.add((diff + 10) % 10)
  }
  return steps.size === 1 && (steps.has(1) || steps.has(9))
}

/**
 * WSR-PHYS-002: reject trivially guessable PINs on creation / change.
 */
export const isWeakPin = (pin: string): boolean =>
  isRepeatedPattern(pin) || isConsecutiveSequence(pin) || COMMON_PINS.has(pin)

export const getWeakPinError = (pin: string): string | undefined =>
  isWeakPin(pin) ? WEAK_PIN_ERROR_MESSAGE : undefined
