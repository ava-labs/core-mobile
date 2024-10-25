import { useEffect, useState } from 'react'
import { Seconds } from 'types/siUnits'
import { UnixTimeMs } from 'services/earn/types'

const tenSeconds = Seconds(10)
export const useNow = (refreshInterval: Seconds = tenSeconds): UnixTimeMs => {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, Number(refreshInterval * 1000n))

    return () => {
      clearInterval(intervalId)
    }
  }, [refreshInterval])

  return now
}
