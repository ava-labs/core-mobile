import { BIP32Factory } from 'bip32'

const ecc = require('@bitcoinerlab/secp256k1')
export const bip32 = BIP32Factory(ecc)
