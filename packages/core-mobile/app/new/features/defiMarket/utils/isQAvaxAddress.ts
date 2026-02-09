import type { Address } from 'viem'
import { BENQI_QAVAX_C_CHAIN_ADDRESS } from '../consts'

export const isQAvaxAddress = (address: Address): boolean =>
  address.toLowerCase() === BENQI_QAVAX_C_CHAIN_ADDRESS.toLowerCase()
