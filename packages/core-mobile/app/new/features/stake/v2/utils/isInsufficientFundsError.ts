/**
 * Matches the substring the network / tx layer surfaces for an underfunded
 * transaction. Shared between the pre-slide funding check and the post-submit
 * error handler so both classify "insufficient funds" the same way.
 */
export const isInsufficientFundsError = (
  error: Error | null | undefined
): boolean => {
  if (!error) return false
  const message = error.message.toLowerCase()
  return message.includes('insufficient') || message.includes('not enough')
}
