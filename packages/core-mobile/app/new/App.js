import { ExpoRoot } from 'expo-router'
import React from 'react'
import 'common/utils/navigationGuard'

export const App = () => {
  const ctx = require.context('./routes')

  return <ExpoRoot context={ctx} />
}
