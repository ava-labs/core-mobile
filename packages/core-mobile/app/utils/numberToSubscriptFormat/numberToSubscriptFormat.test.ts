import { UNKNOWN_AMOUNT } from 'consts/amount'
import { numberToSubscriptFormat } from './numberToSubscriptFormat' // Adjust path as needed

// Small numbers (< 0.00001)
test('formats small number correctly', () => {
  expect(numberToSubscriptFormat(8.4509221e-7)).toEqual({
    mainTextBefore: '0.0',
    subText: '6', // 6 zeros
    mainTextAfter: '84'
  })

  expect(numberToSubscriptFormat(0.00000084509221)).toEqual({
    mainTextBefore: '0.0',
    subText: '6', // 6 zeros
    mainTextAfter: '84'
  })

  expect(numberToSubscriptFormat(1e-19)).toEqual({
    mainTextBefore: '0.0',
    subText: '18', // 19 zeros
    mainTextAfter: '1'
  })

  expect(numberToSubscriptFormat(0.0000092)).toEqual({
    mainTextBefore: '0.0',
    subText: '5', // 5 zeros
    mainTextAfter: '92'
  })
})

// Regular numbers
test('formats regular number correctly', () => {
  expect(numberToSubscriptFormat(0.123)).toEqual({
    mainTextBefore: '0.123',
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(0.000021)).toEqual({
    mainTextBefore: '0.0001',
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(0.00005)).toEqual({
    mainTextBefore: '0.0001',
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(42)).toEqual({
    mainTextBefore: '42',
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(1.23)).toEqual({
    mainTextBefore: '1.23',
    subText: '',
    mainTextAfter: ''
  })

  // Numbers exceeding 5 characters
  expect(numberToSubscriptFormat(12.345678)).toEqual({
    mainTextBefore: '12.346', // round up
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(1234.567)).toEqual({
    mainTextBefore: '1,234.57',
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(123456)).toEqual({
    mainTextBefore: '123,456.00', // for integers more than 5 digits, keep as is
    subText: '',
    mainTextAfter: ''
  })
})

// Edge cases
test('handles zero correctly', () => {
  const result = numberToSubscriptFormat(0)
  expect(result).toEqual({
    mainTextBefore: '0',
    subText: '',
    mainTextAfter: ''
  })
})

test('handles negative numbers correctly', () => {
  const result = numberToSubscriptFormat(-0.0000092)
  expect(result).toEqual({
    mainTextBefore: '-0.0',
    subText: '5',
    mainTextAfter: '92'
  })
})

test('handles non numbers correctly', () => {
  // @ts-ignore
  expect(numberToSubscriptFormat('some string')).toEqual({
    mainTextBefore: UNKNOWN_AMOUNT,
    subText: '',
    mainTextAfter: ''
  })

  expect(numberToSubscriptFormat(undefined)).toEqual({
    mainTextBefore: UNKNOWN_AMOUNT,
    subText: '',
    mainTextAfter: ''
  })
})
