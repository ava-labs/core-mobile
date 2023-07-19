import BN from 'bn.js'
import Big from 'big.js'
import { Flavor } from 'types/flavor'

enum Denomination {
  'WeiAvax' = 'WeiAvax',
  'NanoAvax' = 'NanoAvax',
  'Avax' = 'Avax'
}

export type DenominationFlavor<T, D extends Denomination> = Flavor<T, D>

//AVAX denominated with 18 decimal points, used for EVM
export type BigIntWeiAvax = DenominationFlavor<bigint, Denomination.WeiAvax>
export type BigIntNAvax = DenominationFlavor<bigint, Denomination.NanoAvax>
export type BigIntAvax = DenominationFlavor<bigint, Denomination.Avax>

export type BigNAvax = DenominationFlavor<Big, Denomination.NanoAvax>
export type BigAvax = DenominationFlavor<Big, Denomination.Avax>

export type BNNAvax = DenominationFlavor<BN, Denomination.NanoAvax>
export type BNWeiAvax = DenominationFlavor<BN, Denomination.WeiAvax>

export type StringAvax = DenominationFlavor<string, Denomination.Avax>

export type DenominationNAvax = DenominationFlavor<9, Denomination.NanoAvax>
