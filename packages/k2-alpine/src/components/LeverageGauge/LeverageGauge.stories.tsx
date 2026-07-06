import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { Text } from '../Primitives'
import { LeverageGauge } from './LeverageGauge'

export default { title: 'LeverageGauge' }

export const Default = (): JSX.Element => {
  const [value, setValue] = useState(2)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>Default — Min / Max only</Text>
      <LeverageGauge value={value} onChange={setValue} min={1} max={40} />
    </ScrollView>
  )
}

export const ManualInput = (): JSX.Element => {
  const [value, setValue] = useState(5)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>Tap the large value to edit manually</Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={40}
        step={0.2}
        enableManualInput
      />
    </ScrollView>
  )
}

export const TinyRange = (): JSX.Element => {
  const [value, setValue] = useState(2)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>min=1, max=3 — sparse ticks</Text>
      <LeverageGauge value={value} onChange={setValue} min={1} max={3} />
    </ScrollView>
  )
}

export const HugeRange = (): JSX.Element => {
  const [value, setValue] = useState(50)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>min=1, max=1000 — virtualization smoke test</Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={1000}
        step={1}
      />
    </ScrollView>
  )
}

export const NoHaptics = (): JSX.Element => {
  const [value, setValue] = useState(2)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>Haptics disabled</Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={40}
        hapticsEnabled={false}
      />
    </ScrollView>
  )
}

export const IntegersOnly = (): JSX.Element => {
  const [value, setValue] = useState(5)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>integersOnly — snaps to integers, sub-step ticks stay static</Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={40}
        step={0.2}
        integersOnly
        enableManualInput
      />
    </ScrollView>
  )
}

export const ForcedZeroDecimals = (): JSX.Element => {
  const [value, setValue] = useState(5)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>decimals=0 with sub-step snap — integer display, 0.2 snaps</Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={40}
        step={0.2}
        decimals={0}
        enableManualInput
      />
    </ScrollView>
  )
}

export const TwoDecimals = (): JSX.Element => {
  const [value, setValue] = useState(1.5)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>decimals=2 — e.g. 1.50×, 1.75×, 2.00×</Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={5}
        step={0.25}
        decimals={2}
        enableManualInput
      />
    </ScrollView>
  )
}

export const CustomPhysics = (): JSX.Element => {
  const [value, setValue] = useState(10)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
      <Text>
        velocityPower + coastDeceleration — longer, more powerful coast
      </Text>
      <LeverageGauge
        value={value}
        onChange={setValue}
        min={1}
        max={40}
        step={1}
        velocityPower={2}
        coastDeceleration={0.9996}
      />
    </ScrollView>
  )
}
