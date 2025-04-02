import { sanitizeDecimalInput } from './sanitize' // Replace with actual file path

describe('sanitizeDecimalInput', () => {
  it('removes non-numeric characters', () => {
    expect(
      sanitizeDecimalInput({ text: 'abc123', allowDecimalPoint: false })
    ).toBe('123')

    expect(
      sanitizeDecimalInput({ text: '12a3.45b', allowDecimalPoint: true })
    ).toBe('123.45')
  })

  it('enforces single decimal point', () => {
    expect(
      sanitizeDecimalInput({ text: '12.34.56', allowDecimalPoint: true })
    ).toBe('12.3456')
  })

  it('limits decimal places', () => {
    expect(
      sanitizeDecimalInput({
        text: '12.3456789',
        maxDecimals: 3,
        allowDecimalPoint: true
      })
    ).toBe('12.345')
  })

  it('removes decimal point if not allowed', () => {
    expect(
      sanitizeDecimalInput({ text: '12.34', allowDecimalPoint: false })
    ).toBe('1234')
  })

  it('handles empty string input', () => {
    expect(sanitizeDecimalInput({ text: '', allowDecimalPoint: true })).toBe('')
  })

  it('handles input with only decimal point', () => {
    expect(sanitizeDecimalInput({ text: '.', allowDecimalPoint: true })).toBe(
      '.'
    )
    expect(sanitizeDecimalInput({ text: '.', allowDecimalPoint: false })).toBe(
      ''
    )
  })

  it('handles input with only numbers and multiple decimal points', () => {
    expect(
      sanitizeDecimalInput({ text: '...123..45', allowDecimalPoint: true })
    ).toBe('.12345')
  })
})
