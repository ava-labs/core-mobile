import { Icons, SlidingButton, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useState } from 'react'

const renderShortIcon = (color: string): JSX.Element => (
  <Icons.Custom.TrendingArrowDown width={21} height={19} color={color} />
)

const renderLongIcon = (color: string): JSX.Element => (
  <Icons.Custom.TrendingArrowUp width={21} height={19} color={color} />
)

const PlaceBetScreen = (): JSX.Element => {
  const [singleLoading, setSingleLoading] = useState(false)
  const [bidirectionalLoading, setBidirectionalLoading] = useState(false)

  const simulate = (
    setLoading: (value: boolean) => void
  ): (() => Promise<void>) => {
    return async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <ScrollScreen navigationTitle="Place Bet">
      <View sx={{ padding: 16, gap: 24 }}>
        <Text variant="heading3">Will BTC close above $100k this week?</Text>
        <Text variant="subtitle1">Mock amount: 25 USDC</Text>
      </View>

      <View sx={{ flex: 1 }} />

      <View sx={{ padding: 16, gap: 16 }}>
        <SlidingButton
          mode="single"
          label="Slide to deposit"
          loading={singleLoading}
          onConfirm={simulate(setSingleLoading)}
        />
        <SlidingButton
          mode="bidirectional"
          leftLabel="Short"
          rightLabel="Long"
          leftIcon={renderShortIcon}
          rightIcon={renderLongIcon}
          loading={bidirectionalLoading}
          onConfirmLeft={simulate(setBidirectionalLoading)}
          onConfirmRight={simulate(setBidirectionalLoading)}
        />
      </View>
    </ScrollScreen>
  )
}

export default PlaceBetScreen
