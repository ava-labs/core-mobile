import { useEffect, useState } from 'react'

type Props = {
  children: JSX.Element
  waitBeforeShow?: number
}

export const Delay = ({ children, waitBeforeShow = 50 }: Props) => {
  const [isShown, setIsShown] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true)
    }, waitBeforeShow)
    return () => clearTimeout(timer)
  }, [waitBeforeShow])

  return isShown ? children : null
}

export default Delay
