import BN from 'bn.js'

export type AvaxToken = {
  balance: BN
  balanceParsed: string
  name: string
  symbol: string
  denomination: number
  address: string
}
