import React from 'react'
import Config from 'react-native-config'

let FloatingDevToolsCore: React.ComponentType<{
  environment: string
  userRole: string
}> | null = null

// Lazily require FloatingDevTools to avoid TypeScript errors (when running Jest tests)
// caused by uncompiled `.tsx` files inside the @buoy-gg/core package.
if (__DEV__) {
  try {
    FloatingDevToolsCore = require('@buoy-gg/core').FloatingDevTools
  } catch {
    // eslint-disable-next-line no-console
    console.error('Failed to load @buoy-gg/core')
  }
}

/** Buoy is opt-in: set ENABLE_BUOY_DEV_TOOLS=true in .env.development to show the floating dev tools and welcome popup. */
const isBuoyEnabled =
  Config.ENABLE_BUOY_DEV_TOOLS === 'true' || Config.ENABLE_BUOY_DEV_TOOLS === '1'

export const FloatingDevTools = (): JSX.Element | null => {
  if (__DEV__ && FloatingDevToolsCore && isBuoyEnabled) {
    return <FloatingDevToolsCore environment="local" userRole="admin" />
  }

  return null
}
