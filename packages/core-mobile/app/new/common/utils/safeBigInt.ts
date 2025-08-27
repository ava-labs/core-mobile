export function safeBigInt(
  value: string | number | bigint | boolean,
  defaultValue?: undefined
): bigint | undefined

export function safeBigInt(
  value: string | number | bigint | boolean,
  defaultValue: bigint
): bigint

export function safeBigInt(
  value: string | number | bigint | boolean,
  defaultValue: bigint | undefined = 0n
): bigint | undefined {
  try {
    return BigInt(value)
  } catch {
    return defaultValue
  }
}
