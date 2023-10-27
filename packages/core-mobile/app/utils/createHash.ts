import * as Crypto from 'crypto'

export const createHash = (input: string): string => {
  return Crypto.createHash('sha256').update(input).digest('hex')
}
