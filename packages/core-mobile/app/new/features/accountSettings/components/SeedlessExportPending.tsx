import { Button, Text, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { Space } from 'components/Space'
import { AnimatedCircularProgress } from 'react-native-circular-progress'

const CIRCULAR_PROGRESS_SIZE = 153
interface Props {
  timeLeft: string
  progress: number
  onCancel: () => void
}

export const SeedlessExportPending = ({
  timeLeft,
  progress,
  onCancel
}: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading3">Recovery Phrase</Text>
      </View>
      <View>
        <View sx={{ alignItems: 'center', marginHorizontal: 16 }}>
          <AnimatedCircularProgress
            size={CIRCULAR_PROGRESS_SIZE}
            width={10}
            fill={progress}
            tintColor={colors.$textPrimary}
            backgroundColor={colors.$surfacePrimary}
            arcSweepAngle={180}
            rotation={270}
            lineCap="round"
            style={{ height: CIRCULAR_PROGRESS_SIZE / 2, marginBottom: 32 }}
          />
          <Text variant="heading5" sx={{ color: '$neutral50' }}>
            {`${timeLeft} Remaining`}
          </Text>
          <Space y={8} />
          <Text
            variant="body2"
            sx={{ color: '$neutral400', textAlign: 'center' }}>
            Your recovery phrase is loading. Please check back in a little
            while.
          </Text>
        </View>
      </View>
      <Button
        type="secondary"
        size="large"
        style={{ marginVertical: 16 }}
        onPress={onCancel}>
        Cancel
      </Button>
    </View>
  )
}
