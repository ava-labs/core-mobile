import { ExpoRoot } from 'expo-router'
import React from 'react'
import { ProfilingGestureDetector } from './features/profiling/components/ProfilingGestureDetector'

export const App = () => {
  const ctx = require.context('./routes')

  return (
    <ProfilingGestureDetector>
      <ExpoRoot context={ctx} />
    </ProfilingGestureDetector>
  )
}
