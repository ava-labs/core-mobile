import React, { FC } from 'react'
import { BottomSheet } from 'components/BottomSheet'
import { Disclaimer } from './Disclaimer'

type Props = {
  onClose?: () => void
}

export const DisclaimerBottomSheet: FC<Props> = ({ onClose }) => {
  return (
    <BottomSheet onClose={onClose}>
      <Disclaimer />
    </BottomSheet>
  )
}
