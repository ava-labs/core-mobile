export const getExportInitProgress = (
  availableAt: number,
  availableUntil: number
): {
  isInProgress: boolean
  isReadyToDecrypt: boolean
} => {
  const isInProgress = Date.now() / 1000 < availableAt
  const isReadyToDecrypt =
    Date.now() / 1000 >= availableAt && Date.now() / 1000 <= availableUntil
  return { isInProgress, isReadyToDecrypt }
}
