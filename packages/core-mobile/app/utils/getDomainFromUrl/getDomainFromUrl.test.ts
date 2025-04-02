import { getDomainFromUrl } from './getDomainFromUrl'

describe('getDomainFromUrl', () => {
  test('removes http:// and https:// from URL', () => {
    expect(getDomainFromUrl('http://example.com')).toBe('example.com')
    expect(getDomainFromUrl('https://example.com')).toBe('example.com')
  })

  test('removes www. prefix', () => {
    expect(getDomainFromUrl('http://www.example.com')).toBe('example.com')
    expect(getDomainFromUrl('https://www.example.com')).toBe('example.com')
  })

  test('removes trailing slash', () => {
    expect(getDomainFromUrl('https://example.com/')).toBe('example.com')
    expect(getDomainFromUrl('http://www.example.com/')).toBe('example.com')
  })

  test('handles URLs without http/https scheme', () => {
    expect(getDomainFromUrl('example.com')).toBe('example.com')
    expect(getDomainFromUrl('www.example.com')).toBe('example.com')
  })

  test('handles subdomains correctly', () => {
    expect(getDomainFromUrl('https://sub.example.com')).toBe('sub.example.com')
    expect(getDomainFromUrl('http://www.sub.example.com')).toBe(
      'sub.example.com'
    )
  })

  test('handles paths and query parameters', () => {
    expect(getDomainFromUrl('https://example.com/page')).toBe(
      'example.com/page'
    )
    expect(getDomainFromUrl('https://www.example.com/page?query=1')).toBe(
      'example.com/page?query=1'
    )
  })

  test('returns empty string for empty input', () => {
    expect(getDomainFromUrl('')).toBe('')
  })

  test('returns the input if it does not match any pattern', () => {
    expect(getDomainFromUrl('random-string')).toBe('random-string')
  })
})
