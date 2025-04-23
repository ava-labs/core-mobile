export const isSlippageValid = (value: string): boolean => {
  return Boolean(
    (parseFloat(value) >= 0 &&
      parseFloat(value) <= 100 &&
      value?.length <= 4) ||
      !value
  )
}
