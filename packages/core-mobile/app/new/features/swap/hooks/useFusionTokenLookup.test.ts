import { tokenIds } from 'consts/tokenIds'
import { shouldPreselectToToken } from './useFusionTokenLookup'

describe('shouldPreselectToToken', () => {
  it('preselects any to-token on mainnet', () => {
    expect(shouldPreselectToToken(tokenIds.USDC, false)).toBe(true)
    expect(shouldPreselectToToken(tokenIds.AVAX, false)).toBe(true)
  })

  it('skips mainnet-only to-tokens (e.g. USDC) on testnet', () => {
    expect(shouldPreselectToToken(tokenIds.USDC, true)).toBe(false)
  })

  it('still preselects native AVAX on testnet (CCT P/X → C destination)', () => {
    expect(shouldPreselectToToken(tokenIds.AVAX, true)).toBe(true)
    // tolerant of casing differences in the incoming id
    expect(shouldPreselectToToken('NATIVE-AVAX', true)).toBe(true)
  })

  it('never preselects when there is no to-token', () => {
    expect(shouldPreselectToToken(undefined, false)).toBe(false)
    expect(shouldPreselectToToken(undefined, true)).toBe(false)
  })
})
