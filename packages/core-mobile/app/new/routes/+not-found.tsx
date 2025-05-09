import { Redirect } from 'expo-router'
import React from 'react'

// This component is used to redirect to the portfolio screen when the user tries to access a non-existing route.
const NotFoundRedirect = (): null => {
  // @ts-ignore TODO: make routes typesafe
  return <Redirect href="/portfolio" />
}

export default NotFoundRedirect
