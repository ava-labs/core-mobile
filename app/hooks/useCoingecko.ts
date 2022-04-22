import { SimpleTokenPriceResponse } from '@avalabs/coingecko-sdk'
import { useEffect, useState } from 'react'
import { interval } from 'rxjs'
import { useApplicationContext } from 'contexts/ApplicationContext'

const useCoingecko = () => {
  const { getTokensPrice } = useApplicationContext().repo.coingeckoRepo
  const [tokenPrices, setTokenPrices] = useState<
    SimpleTokenPriceResponse | undefined
  >({})

  useEffect(fetchTokenPricesEachMinuteEffect, [])

  function fetchTokenPricesEachMinuteEffect() {
    getTokensPrice().then(value => setTokenPrices(value))

    const oneMinute = 60 * 1000
    const sub = interval(oneMinute).subscribe({
      next: () => getTokensPrice(true).then(value => setTokenPrices(value))
    })

    return () => sub.unsubscribe()
  }

  return {
    tokenPrices
  }
}

export default useCoingecko
