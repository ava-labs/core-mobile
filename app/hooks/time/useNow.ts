import { useEffect, useState } from 'react'
import { Seconds } from 'types/siUnits'

const tenSeconds = Seconds(10)
export const useNow = (refreshInterval: Seconds = tenSeconds) => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, Number(refreshInterval * 1000n))

    return () => {
      clearInterval(intervalId)
    }
  }, [refreshInterval])

  return now
}
