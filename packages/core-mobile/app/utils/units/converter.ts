export const nanoToWei = (number: bigint): bigint => number * BigInt(10 ** 9)

export const weiToNano = (number: bigint): bigint => number / BigInt(10 ** 9)
