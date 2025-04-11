/*
Removes P- or X- prefix from XP address
*/
export const xpAddressWithoutPrefix = (address: string): string => {
  return address?.replace(/^[PX]-/, '')
}
