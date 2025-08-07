import React, { useEffect, useState } from 'react'
import JailMonkey from 'jail-monkey'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { withK2AlpineThemeProvider } from './withK2AlpineThemeProvider'
import { FullScreenWarning } from './FullScreenWarning'

const JailbreakCheck = (): JSX.Element | null => {
  const [showJailBroken, setShowJailBroken] = useState(false)

  useEffect(() => {
    if (!__DEV__ && JailMonkey.isJailBroken()) {
      setShowJailBroken(true)
    }
  }, [])

  if (showJailBroken) {
    return (
      <SafeAreaProvider>
        <FullScreenWarning
          title="This device is jailbroken"
          description="Using a jailbroken or rooted device could expose your keys and mnemonics to malicious applications"
          action={{
            label: 'I understand',
            onPress: () => setShowJailBroken(false)
          }}
        />
      </SafeAreaProvider>
    )
  }

  return null
}

export default withK2AlpineThemeProvider(JailbreakCheck)
