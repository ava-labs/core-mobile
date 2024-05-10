import Crypto from 'react-native-quick-crypto'

export const uuid = (): string => Crypto.randomUUID()
