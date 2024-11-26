// use a regex to match "Insufficient funds" and capture the missing amount
export const extractNeededAmount = (
  errorMessage: string,
  assetId: string
): bigint | null => {
  const regex = new RegExp(
    `Insufficient funds.*need (\\d+) more nAVAX \\(asset id: ${assetId}\\)`
  )
  const match = errorMessage.match(regex)

  if (match && match[1]) {
    return BigInt(match[1]) // convert to BigInt and return
  }

  return null // return null if no match is found
}
