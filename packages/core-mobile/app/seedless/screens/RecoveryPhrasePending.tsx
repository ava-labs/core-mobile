import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import React from 'react'
import { Space } from 'components/Space'
import { Dimensions } from 'react-native'
import { AnimatedCircularProgress } from 'react-native-circular-progress'

const DAY_REMAINING = 2

interface Props {
  onCancel: () => void
}
const { width } = Dimensions.get('window')
const CIRCULAR_PROGRESS_SIZE = width / 3

export const RecoveryPhrasePending = ({ onCancel }: Props): JSX.Element => {
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
            fill={50}
            tintColor={colors.$blueMain}
            backgroundColor={colors.$neutral800}
            arcSweepAngle={180}
            rotation={270}
            lineCap="round"
            style={{ height: CIRCULAR_PROGRESS_SIZE / 2, marginBottom: 32 }}
          />
          <Text variant="heading5" sx={{ color: '$neutral50' }}>
            {DAY_REMAINING > 1
              ? `${DAY_REMAINING} Days Remaining`
              : `${DAY_REMAINING} Day Remaining`}
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
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={onCancel}>
        Cancel
      </Button>
    </View>
  )
}
