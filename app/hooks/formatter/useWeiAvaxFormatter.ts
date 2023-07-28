import { Avax } from 'types/Avax'
import { createAvaxFormatterHook } from './createAvaxFormatterHook'

const weiAvaxToAvax = (valueInWeiAvax: string | undefined) => {
  return Avax.fromWei(valueInWeiAvax ?? '0')
}

/**
 * This hook returns a function that:
 *
 * 1/ converts Wei Avax (string) to Avax
 * 2/ returns formatted amounts including its value in current currency
 */
export const useWeiAvaxFormatter = createAvaxFormatterHook(weiAvaxToAvax)
