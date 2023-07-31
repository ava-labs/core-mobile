import React from 'react'
import { BottomSheet } from 'components/BottomSheet'

type Props = {
  children: React.ReactNode
  onClose: () => void
}

const RpcRequestBottomSheet: React.FC<Props> = ({ children, onClose }) => {
  return (
    <BottomSheet enableContentPanningGesture={false} onClose={onClose}>
      {children}
    </BottomSheet>
  )
}

export default RpcRequestBottomSheet
