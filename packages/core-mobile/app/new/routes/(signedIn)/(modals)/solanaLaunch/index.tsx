import { Button, Text } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback } from 'react'

export default function SolanaLaunchScreen(): JSX.Element {
  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={() => {}}>
        <Text>Continue</Text>
      </Button>
    )
  }, [])

  return (
    <ScrollScreen renderFooter={renderFooter}>
      <Text>Solana Launch</Text>
    </ScrollScreen>
  )
}
