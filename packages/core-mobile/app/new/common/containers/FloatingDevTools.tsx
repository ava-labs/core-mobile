import React from 'react'
import { FloatingDevTools as FloatingDevToolsCore } from '@react-buoy/core'

export const FloatingDevTools = (): JSX.Element => {
  return <FloatingDevToolsCore environment="local" userRole="admin" />
}
