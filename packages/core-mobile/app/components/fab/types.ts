import React, { Dispatch } from 'react'

export type ActionProp = {
  image: React.ReactNode
  onPress: () => void
}

export interface FABProps {
  actionItems: Record<string, ActionProp>
  icon: React.ReactNode
  size?: number
  resetOnItemPress?: boolean
  expanded: boolean
  setExpanded: Dispatch<boolean>
  isLeftHanded: boolean
}
