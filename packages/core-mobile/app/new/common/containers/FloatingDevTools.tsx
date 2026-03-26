import React from 'react'

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

export const FloatingDevTools = (): JSX.Element | null => {
  if (__DEV__ && FloatingDevToolsCore) {
    return <FloatingDevToolsCore environment="local" userRole="admin" />
  }

  return null
}
