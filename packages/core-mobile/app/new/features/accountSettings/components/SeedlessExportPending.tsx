import { Button, Text, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { Space } from 'components/Space'
import { AnimatedCircularProgress } from 'react-native-circular-progress'
import { SHOW_RECOVERY_PHRASE } from '../consts'

const CIRCULAR_PROGRESS_SIZE = 280
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
      <Text variant="heading2">{SHOW_RECOVERY_PHRASE}</Text>
      <View>
        <View sx={{ alignItems: 'center', marginHorizontal: 16 }}>
          <AnimatedCircularProgress
            size={CIRCULAR_PROGRESS_SIZE}
            width={6}
            fill={progress}
            tintColor={'#1CC51D'}
            backgroundColor={colors.$surfaceSecondary}
            arcSweepAngle={180}
            rotation={270}
            lineCap="round"
            style={{ height: CIRCULAR_PROGRESS_SIZE / 2, marginBottom: 32 }}
          />
          <View
            sx={{
              top: -105,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Text
              variant="body2"
              sx={{
                marginHorizontal: 80,
                color: colors.$textPrimary,
                textAlign: 'center',
                lineHeight: 18
              }}>
              Your wallet’s recovery phrase will be visible in
            </Text>
            <Space y={11} />
            <Text variant="heading2" sx={{ color: colors.$textPrimary }}>
              {timeLeft}
            </Text>
          </View>
        </View>
      </View>
      <Button
        type="secondary"
        size="large"
        style={{ bottom: 60 }}
        onPress={onCancel}>
        Cancel
      </Button>
    </View>
  )
}
