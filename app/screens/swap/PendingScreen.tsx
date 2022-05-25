import React, { useEffect, useState } from 'react'
import { useSwapContext } from 'contexts/SwapContext'
import Loader from 'components/Loader'

type Props = {
  onSuccess: () => void
  onFail: (errMsg: string) => void
}
export default function PendingScreen({ onSuccess, onFail }: Props) {
  const { doSwap } = useSwapContext()
  const [isSwapping, setIsSwapping] = useState(false)

  useEffect(swapImmediately, [doSwap, isSwapping, onFail, onSuccess])

  function swapImmediately() {
    if (!isSwapping && onSuccess && onFail) {
      doSwap()
        .then(value => {
          console.log(value)
          onSuccess()
        })
        .catch((reason: Error) => {
          console.error(reason)
          onFail(reason.message ?? '')
        })
      setIsSwapping(true)
    }
  }

  return <Loader />
}
