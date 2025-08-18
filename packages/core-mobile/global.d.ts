import React from 'react'

// Global type alias for React 19 compatibility
// This allows continued use of JSX.Element while mapping to React.JSX.Element
declare global {
  namespace JSX {
    type Element = React.JSX.Element
  }
}
