import React, { useState } from 'react'

import { ConfirmScreen } from 'screens/earn/components/ConfirmScreen'

export default {
  title: 'Earn/ConfirmScreen'
}

export const Basic = () => {
  const [isConfirming, setIsConfirming] = useState(false)

  const onConfirm = () => {
    setIsConfirming(true)
    setTimeout(() => {
      setIsConfirming(false)
    }, 4000)
  }

  const onCancel = () => {
    // do nothing
  }

  return (
    <ConfirmScreen
      isConfirming={isConfirming}
      onConfirm={onConfirm}
      onCancel={onCancel}
      header="Confirm Staking"
      confirmBtnTitle="Stake Now"
      cancelBtnTitle="Cancel"
      disclaimer='By selecting "Stake Now" you will lock your funds for the set
      duration of time.'
    />
  )
}
