export const stripXPPrefix = (address: string): string => {
  // removes leading "X-" or "P-"
  return address.replace(/^[XP]-/, '')
}
