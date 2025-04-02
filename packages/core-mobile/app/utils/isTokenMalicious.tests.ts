import mockTokenWithBalance from 'tests/fixtures/tokenWithBalance.json'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { isTokenMalicious } from './isTokenMalicious'

describe('isTokenMalicious', () => {
  it('Should return true if it is token type of ERC20 and has malicious reputation', () => {
    const result = isTokenMalicious(mockTokenWithBalance[1] as TokenWithBalance)
    expect(result).toBe(true)
  })

  it('Should return false if it is token type of ERC20 and has Benign reputation', () => {
    const result = isTokenMalicious(mockTokenWithBalance[0] as TokenWithBalance)
    expect(result).toBe(false)
  })

  it('Should return false if it is not token type of ERC20', () => {
    const result = isTokenMalicious(mockTokenWithBalance[2] as TokenWithBalance)
    expect(result).toBe(false)
  })
})
