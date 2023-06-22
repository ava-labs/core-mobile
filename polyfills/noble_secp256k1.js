import * as secp from '@noble/secp256k1'
import Crypto from 'react-native-quick-crypto'

// @noble/secp256k1 uses the webcrypto API by default
// Overwrite the way it calculates the cache
secp.utils.hmacSha256 = async (k, ...m) => {
  return Crypto.Hmac('sha256', k, secp.utils.concatBytes(...m)).digest()
}
