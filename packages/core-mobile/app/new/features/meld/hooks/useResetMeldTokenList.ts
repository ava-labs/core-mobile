import { useEffect } from 'react'
import { useSupportedCryptoCurrencies, useTokenIndex } from '../store'

export const useResetMeldTokenList = (): void => {
  const { reset: resetSupportedCryptoCurrencies } =
    useSupportedCryptoCurrencies()
  const { reset: resetTokenIndex } = useTokenIndex()

  /*
   * on the initial render of certain screens,
   * we reset both the supported crypto currencies and the token index.
   * this ensures that when the user opens the "Select a token" modal,
   * the list will be freshly recomputed.
   */
  useEffect(() => {
    resetSupportedCryptoCurrencies()
    resetTokenIndex()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
