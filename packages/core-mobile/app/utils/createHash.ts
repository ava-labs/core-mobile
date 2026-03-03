import Crypto from 'react-native-quick-crypto'

export const createHash = (input: string): string => {
  return Crypto.createHash('md5').update(input).digest('base64').toString()
}
