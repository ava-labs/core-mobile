import { ExpoRoot } from 'expo-router'
import React from 'react'

export const App = () => {
  const ctx = require.context('./routes')

  return <ExpoRoot context={ctx} />
}
