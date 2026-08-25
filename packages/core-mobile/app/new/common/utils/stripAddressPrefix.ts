/**
 * Removes the C-, P- and X- prefix from the provided address.
 */
export const stripAddressPrefix = (address: string): string =>
  address.replace(/^[XPC]-/, '')

/**
 * True when the value is a chain alias and nothing else, e.g. `'P-'`.
 *
 * Such a value is truthy, so `!address` guards accept it and pass it on as if
 * it were a real address. Callers validating an address they did not derive
 * themselves need this alongside the falsy check. See CP-14964.
 */
export const isBareChainPrefix = (address: string | undefined): boolean =>
  address !== undefined && /^[XPC]-$/.test(address)
