import React, { useState } from 'react'
import { View } from '../Primitives'
import { CircularDial } from './CircularDial'
import type { PresetButton } from './types'

export default {
  title: 'CircularDial'
}

export const Default = (): JSX.Element => {
  const [value, setValue] = useState(25)
  return (
    <View style={{ padding: 16 }}>
      <CircularDial value={value} onChange={setValue} max={100} step={0.01} />
    </View>
  )
}

export const WithReceiveLabel = (): JSX.Element => {
  const [value, setValue] = useState(2.32)
  const presets: PresetButton[] = [
    { label: '25%', fraction: 0.25 },
    { label: '50%', fraction: 0.5 },
    { label: '100%', fraction: 1 }
  ]
  return (
    <View style={{ padding: 16 }}>
      <CircularDial
        value={value}
        onChange={setValue}
        max={10}
        step={0.01}
        label="Receive"
        presets={presets}
      />
    </View>
  )
}

export const LargerRange = (): JSX.Element => {
  const [value, setValue] = useState(250)
  return (
    <View style={{ padding: 16 }}>
      <CircularDial
        value={value}
        onChange={setValue}
        max={1000}
        step={1}
        label="USD"
      />
    </View>
  )
}

export const IntegerRange = (): JSX.Element => {
  const [value, setValue] = useState(5)
  return (
    <View style={{ padding: 16 }}>
      <CircularDial value={value} onChange={setValue} max={20} step={1} />
    </View>
  )
}

export const NoHaptics = (): JSX.Element => {
  const [value, setValue] = useState(50)
  return (
    <View style={{ padding: 16 }}>
      <CircularDial
        value={value}
        onChange={setValue}
        max={100}
        step={0.01}
        hapticsEnabled={false}
      />
    </View>
  )
}

export const WithMinThreshold = (): JSX.Element => {
  const [value, setValue] = useState(3)
  return (
    <View style={{ padding: 16 }}>
      <CircularDial
        value={value}
        onChange={setValue}
        min={2}
        max={10}
        step={0.01}
        label="Price"
      />
    </View>
  )
}

export const ManualInput = (): JSX.Element => {
  const [value, setValue] = useState(4.5)
  return (
    <View style={{ padding: 16 }}>
      <CircularDial
        value={value}
        onChange={setValue}
        max={10}
        step={0.01}
        label="Amount"
        enableManualInput
      />
    </View>
  )
}
