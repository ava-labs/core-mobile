import { getSocialHandle } from './getSocialHandle'

test('extracts username from twitter.com', () => {
  expect(getSocialHandle('https://twitter.com/avantprotocol')).toBe(
    'avantprotocol'
  )
  expect(getSocialHandle('https://www.twitter.com/elonmusk')).toBe('elonmusk')
  expect(getSocialHandle('http://twitter.com/user123')).toBe('user123')
})

test('extracts username from x.com', () => {
  expect(getSocialHandle('https://x.com/someuser')).toBe('someuser')
  expect(getSocialHandle('https://www.x.com/test_user')).toBe('test_user')
  expect(getSocialHandle('http://x.com/anotherUser')).toBe('anotherUser')
})

test('removes trailing slashes', () => {
  expect(getSocialHandle('https://twitter.com/avantprotocol/')).toBe(
    'avantprotocol'
  )
  expect(getSocialHandle('https://x.com/someuser/')).toBe('someuser')
})

test('handles query parameters', () => {
  expect(getSocialHandle('https://x.com/user123?ref=abc')).toBe('user123')
  expect(getSocialHandle('https://twitter.com/test?utm_source=xyz')).toBe(
    'test'
  )
})

test('returns undefined for non-Twitter/X URLs', () => {
  expect(getSocialHandle('https://example.com/user123')).toBe(undefined)
  expect(getSocialHandle('https://facebook.com/user456')).toBe(undefined)
  expect(getSocialHandle('https://github.com/dev')).toBe(undefined)
})

test('returns undefined for invalid inputs', () => {
  expect(getSocialHandle('')).toBe(undefined)
  expect(getSocialHandle('random text')).toBe(undefined)
  expect(getSocialHandle('https://not-twitter.com/user')).toBe(undefined)
})
