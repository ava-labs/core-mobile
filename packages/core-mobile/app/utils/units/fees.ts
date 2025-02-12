import { formatUnits } from 'ethers'

export function bigIntToFeeDenomination(
  fee: bigint,
  decimals?: number
): string {
  if (decimals === undefined) return fee.toString()
  return formatGasPrice(fee, decimals)
}

const formatGasPrice = (value: bigint, decimals: number): string => {
  const formatted = formatUnits(value, decimals)
  const [wholes, fraction] = formatted.split('.')

  // Return the formatted string if there's no fraction part
  if (!wholes || !fraction) {
    return formatted
  }

  // Remove unnecessary trailing ".0", otherwise round to 2 decimal places if needed
  return fraction === '0'
    ? wholes
    : fraction.length > 2
    ? Number(formatted).toFixed(2)
    : formatted
}
