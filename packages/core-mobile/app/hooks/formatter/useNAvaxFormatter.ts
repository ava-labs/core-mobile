import { Avax } from 'types/Avax'
import { createAvaxFormatterHook } from './createAvaxFormatterHook'

const nAvaxToAvax = (valueInNAvax: string | undefined) => {
  return Avax.fromNanoAvax(valueInNAvax ?? '0')
}

/**
 * This hook returns a function that:
 *
 * 1/ converts nano Avax (string) to Avax
 * 2/ returns formatted amounts including its value in current currency
 */
export const useNAvaxFormatter = createAvaxFormatterHook(nAvaxToAvax)
