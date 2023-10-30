import { Flavor } from 'types/flavor'

enum Denomination {
  'Avax' = 'Avax',
  'NanoAvax' = 'NanoAvax',
  'EvmAvax' = 'EvmAvax',
  'Eth' = 'Eth'
}

export type DenominationFlavor<T, D extends Denomination> = Flavor<T, D>

export type DenominationNAvax = DenominationFlavor<9, Denomination.NanoAvax>
