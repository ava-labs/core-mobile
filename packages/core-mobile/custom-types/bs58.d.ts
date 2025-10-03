declare module 'bs58' {
  interface Base58 {
    encode(buffer: Uint8Array): string
    decode(string: string): Uint8Array
  }

  const base58: Base58
  export = base58
}
