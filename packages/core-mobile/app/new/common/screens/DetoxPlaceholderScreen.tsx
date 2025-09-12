import React from 'react'
import { View } from 'react-native'
import NewApp from 'new/ContextApp'

export default function DetoxPlaceholderScreen(): JSX.Element {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return ready ? (
    <NewApp />
  ) : (
    <View style={{ flex: 1, backgroundColor: 'red' }} />
  )
}
