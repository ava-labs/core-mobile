/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenType } from '@avalabs/vm-module-types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'
import { isTokenMalicious } from './isTokenMalicious'

it('returns false when token has no type field', () => {
  const token = {
    reputation: Erc20TokenBalance.tokenReputation.MALICIOUS
  } as any

  expect(isTokenMalicious(token)).toBe(false)
})

it('returns false when token.type is not ERC20', () => {
  const token = {
    type: TokenType.NATIVE,
    reputation: Erc20TokenBalance.tokenReputation.MALICIOUS
  } as any

  expect(isTokenMalicious(token)).toBe(false)
})

it('returns false when token is ERC20 but has no reputation field', () => {
  const token = {
    type: TokenType.ERC20
  } as any

  expect(isTokenMalicious(token)).toBe(false)
})

it('returns true when token is ERC20 and reputation is MALICIOUS', () => {
  const token = {
    type: TokenType.ERC20,
    reputation: Erc20TokenBalance.tokenReputation.MALICIOUS
  } as any

  expect(isTokenMalicious(token)).toBe(true)
})

it('returns false when token is ERC20 and reputation is not MALICIOUS', () => {
  const token = {
    type: TokenType.ERC20,
    reputation: Erc20TokenBalance.tokenReputation.BENIGN
  } as any

  expect(isTokenMalicious(token)).toBe(false)
})

it('returns false when reputation exists but is null/undefined', () => {
  const token1 = { type: TokenType.ERC20, reputation: null } as any
  const token2 = { type: TokenType.ERC20, reputation: undefined } as any

  expect(isTokenMalicious(token1)).toBe(false)
  expect(isTokenMalicious(token2)).toBe(false)
})
