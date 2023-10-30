export function getHexStringToBytes(hex: string): number | null {
  if (!hex) return null

  // the first 2 chars can be ignore since it indicates the hexidecimal representaion ( -2 )
  // the reason byte size is calculated this way => F in hex is the biggest number which can be represented with 4 bits (1111)
  // therefore 2 chars at a time can be represented in 1 byte which is 8 bits
  // so the byte value of a hex is the half of the character count

  return (hex.length - 2) / 2
}
