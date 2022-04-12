import {BN} from 'avalanche'

export type AvaxToken = {
  balance: BN
  balanceParsed: string
  name: string
  symbol: string
  denomination: number
  address: string
}
