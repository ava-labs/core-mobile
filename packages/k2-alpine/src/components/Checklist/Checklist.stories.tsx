import React, { useState } from 'react'
import { ScrollView, View } from '../Primitives'
import { useTheme } from '../..'
import { Checklist, type ChecklistItem } from './Checklist'

export default {
  title: 'Checklist'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [agentDone, setAgentDone] = useState(false)
  const [feeDone, setFeeDone] = useState(false)

  const items: ChecklistItem[] = [
    {
      title: 'Enable background transactions',
      description: 'Allows faster trade placement with fewer clicks',
      done: agentDone,
      actionLabel: 'Enable',
      onAction: () => setAgentDone(true)
    },
    {
      title: 'Enable trading on Hyperliquid',
      description: 'Allows your Core wallet to trade on Hyperliquid',
      done: feeDone,
      actionLabel: 'Enable',
      // Gated on the first item completing.
      actionDisabled: !agentDone,
      onAction: () => setFeeDone(true)
    },
    {
      title: 'Enable unified account',
      description: 'Pools spot and perps into one balance',
      done: false,
      actionLabel: 'Enable',
      actionDisabled: !feeDone,
      loading: feeDone,
      onAction: () => undefined
    }
  ]

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16 }}>
        <Checklist items={items} />
      </ScrollView>
    </View>
  )
}
