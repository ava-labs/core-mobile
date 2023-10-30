import { createAvaxFormatterHook } from './createAvaxFormatterHook'

/**
 * This hook returns a function that
 * accepts an Avax object and returns '
 * formatted amounts including its value in current currency
 */
export const useAvaxFormatter = createAvaxFormatterHook(undefined)
