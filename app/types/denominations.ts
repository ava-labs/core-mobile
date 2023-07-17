import BN from 'bn.js'
import Big from 'big.js'
import { Flavor } from 'types/flavor'

//AVAX denominated with 18 decimal points, used for EVM
export type BigIntWeiAvax = Flavor<bigint, 'WeiAvax'>
export type BigIntNAvax = Flavor<bigint, 'NanoAvax'>
export type BigIntAvax = Flavor<bigint, 'Avax'>

export type BigNAvax = Flavor<Big, 'NanoAvax'>
export type BigAvax = Flavor<Big, 'Avax'>

export type BNNAvax = Flavor<BN, 'NanoAvax'>
export type BNWeiAvax = Flavor<BN, 'WeiAvax'>

export type StringAvax = Flavor<string, 'Avax'>

export type DenominationNAvax = Flavor<9, 'NanoAvax'>
