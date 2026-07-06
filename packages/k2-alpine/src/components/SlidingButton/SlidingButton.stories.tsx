import React, { useState } from 'react'
import { View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { SlidingButton } from './SlidingButton'

export default {
  title: 'SlidingButton'
}

const useSimulatedOperation = (
  durationMs = 1500
): {
  loading: boolean
  run: () => Promise<void>
} => {
  const [loading, setLoading] = useState(false)
  const run = async (): Promise<void> => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, durationMs))
    } finally {
      setLoading(false)
    }
  }
  return { loading, run }
}

const useRejectingOperation = (
  durationMs = 800
): { loading: boolean; run: () => Promise<void> } => {
  const [loading, setLoading] = useState(false)
  const run = async (): Promise<void> => {
    setLoading(true)
    try {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('rejected')), durationMs)
      )
    } finally {
      setLoading(false)
    }
  }
  return { loading, run }
}

const renderShortIcon = (color: string): JSX.Element => (
  <Icons.Custom.TrendingArrowDown width={21} height={19} color={color} />
)

const renderLongIcon = (color: string): JSX.Element => (
  <Icons.Custom.TrendingArrowUp width={21} height={19} color={color} />
)

const Stage = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <View
    sx={{
      flex: 1,
      padding: 16,
      gap: 24,
      backgroundColor: '$surfacePrimary',
      justifyContent: 'center'
    }}>
    {children}
  </View>
)

export const SingleDefault = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation()
  return (
    <Stage>
      <SlidingButton
        mode="single"
        label="Confirm"
        loading={loading}
        onConfirm={run}
      />
    </Stage>
  )
}

export const BidirectionalDefault = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation()
  return (
    <Stage>
      <SlidingButton
        mode="bidirectional"
        leftLabel="Short"
        rightLabel="Long"
        leftIcon={renderShortIcon}
        rightIcon={renderLongIcon}
        loading={loading}
        onConfirmLeft={run}
        onConfirmRight={run}
      />
    </Stage>
  )
}

export const SingleNoSpinner = (): JSX.Element => {
  const { run } = useSimulatedOperation()
  return (
    <Stage>
      <SlidingButton mode="single" label="Confirm" onConfirm={run} />
    </Stage>
  )
}

export const BidirectionalNoSpinner = (): JSX.Element => {
  const { run } = useSimulatedOperation()
  return (
    <Stage>
      <SlidingButton
        mode="bidirectional"
        leftLabel="Short"
        rightLabel="Long"
        leftIcon={renderShortIcon}
        rightIcon={renderLongIcon}
        onConfirmLeft={run}
        onConfirmRight={run}
      />
    </Stage>
  )
}

export const Disabled = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation()
  return (
    <Stage>
      <SlidingButton
        mode="single"
        label="Confirm"
        loading={loading}
        onConfirm={run}
        disabled
      />
    </Stage>
  )
}

export const SingleLongOperation = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation(3000)
  return (
    <Stage>
      <SlidingButton
        mode="single"
        label="Processing takes a while"
        loading={loading}
        onConfirm={run}
      />
    </Stage>
  )
}

export const SingleError = (): JSX.Element => {
  const { loading, run } = useRejectingOperation()
  return (
    <Stage>
      <SlidingButton
        mode="single"
        label="Confirm"
        loading={loading}
        onConfirm={run}
      />
    </Stage>
  )
}

export const SingleCustomColor = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation(1000)
  return (
    <Stage>
      <SlidingButton
        mode="single"
        label="Delete"
        color="#E84142"
        loading={loading}
        onConfirm={run}
      />
    </Stage>
  )
}

export const BidirectionalWithCallbacks = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation(1200)
  return (
    <Stage>
      <SlidingButton
        mode="bidirectional"
        leftLabel="No"
        rightLabel="Yes"
        loading={loading}
        onConfirmLeft={run}
        onConfirmRight={run}
      />
    </Stage>
  )
}

export const BidirectionalError = (): JSX.Element => {
  const { loading, run } = useRejectingOperation()
  return (
    <Stage>
      <SlidingButton
        mode="bidirectional"
        leftLabel="Short"
        rightLabel="Long"
        loading={loading}
        onConfirmLeft={run}
        onConfirmRight={run}
      />
    </Stage>
  )
}

export const SlideToDeposit = (): JSX.Element => {
  const { loading, run } = useSimulatedOperation()
  return (
    <Stage>
      <SlidingButton
        mode="single"
        label="Slide to deposit"
        loading={loading}
        onConfirm={run}
      />
    </Stage>
  )
}
