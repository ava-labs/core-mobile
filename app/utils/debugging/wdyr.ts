import React from 'react'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'

if (__DEV__ && DevDebuggingConfig.WDYR) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React)
}
