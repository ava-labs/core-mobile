import BN from 'bn.js'
import Big from 'big.js'

interface Flavoring<FlavorT> {
  _type?: FlavorT
}

export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>

//AVAX denominated with 18 decimal points, used for EVM
export type BigIntWeiAvax = Flavor<bigint, 'WeiAvax'>
export type BigIntNavax = Flavor<bigint, 'NanoAvax'>
export type BigIntAvax = Flavor<bigint, 'Avax'>

export type BigNavax = Flavor<Big, 'NanoAvax'>
export type BigAvax = Flavor<Big, 'Avax'>

export type BNNavax = Flavor<BN, 'NanoAvax'>

export type StringAvax = Flavor<string, 'Avax'>

export type DenominationNavax = Flavor<9, 'NanoAvax'>
