import { useEffect, useState } from 'react'

export const useRefreshedCurrenDate = () => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return now
}
