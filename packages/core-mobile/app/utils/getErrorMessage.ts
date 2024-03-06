export const getErrorMessage = (error: unknown): string => {
  return typeof error === 'object' && error !== null
    ? error.toString()
    : 'Unexpected error'
}
