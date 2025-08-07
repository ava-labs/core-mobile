import { useEffect, useState } from 'react'

export const useTimeElapsed = (enabled: boolean, targetTime: number) => {
  const [targetTimeReached, setTargetTimeReached] = useState(false)

  useEffect(() => {
    let id: number

    if (enabled) {
      id = setTimeout(() => {
        setTargetTimeReached(true)
      }, targetTime)
    } else {
      setTargetTimeReached(false)
    }

    return () => {
      id && clearTimeout(id)
    }
  }, [enabled, targetTime])

  return targetTimeReached
}
