import type { Quote } from '../types'
import { findNextQuote } from './findNextQuote'

const makeQuote = (id: string): Quote => ({ id } as unknown as Quote)

describe('findNextQuote', () => {
  it('returns the quote after the current one', () => {
    const quotes = [makeQuote('a'), makeQuote('b'), makeQuote('c')]
    expect(findNextQuote(quotes, 'a')?.id).toBe('b')
    expect(findNextQuote(quotes, 'b')?.id).toBe('c')
  })

  it('returns undefined when the current quote is the last one', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    expect(findNextQuote(quotes, 'b')).toBeUndefined()
  })

  it('returns undefined when the current id is not in the list', () => {
    const quotes = [makeQuote('a'), makeQuote('b')]
    expect(findNextQuote(quotes, 'missing')).toBeUndefined()
  })

  it('returns undefined for an empty list', () => {
    expect(findNextQuote([], 'any')).toBeUndefined()
  })
})
