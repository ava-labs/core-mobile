import mockTokenWithBalance from 'tests/fixtures/tokenWithBalance.json'
import { LocalTokenWithBalance } from 'store/balance/types'
import { getSelectedToken } from './getSelectedToken'

describe('getSelectedToken function', () => {
  it('Should return token address if it is token type of ERC20', () => {
    const token = mockTokenWithBalance[0] as LocalTokenWithBalance
    const result = getSelectedToken(token)
    // @ts-ignore
    expect(result).toBe(token.address)
  })

  it('Should return token symbol if it is not type of ERC20', () => {
    const token = mockTokenWithBalance[2] as LocalTokenWithBalance
    const result = getSelectedToken(token)
    expect(result).toBe(token.symbol)
  })
})
