import React from 'react'
import { StyleSheet } from 'react-native'
import {
  alpha,
  useTheme,
  View,
  TouchableOpacity,
  Text
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'

export const ChartOverlay = ({
  chartData,
  shouldShowInstruction,
  onInstructionRead
}: Props): React.JSX.Element | null => {
  const { theme } = useTheme()

  let content
  if (!chartData) {
    content = <LoadingState />
  } else if (chartData.length < 2) {
    content = (
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 60
        }}>
        <Text variant="body2" sx={{ textAlign: 'center' }}>
          No chart data available for this token.{'\n'}Please check back later.
        </Text>
      </View>
    )
  } else if (shouldShowInstruction) {
    content = (
      <TouchableOpacity onPress={onInstructionRead} sx={{ flex: 1 }}>
        <View
          sx={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60
          }}>
          <Text variant="body2" sx={{ textAlign: 'center' }}>
            Touch the graph{'\n'} to get more details
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (content) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(theme.colors.$surfacePrimary, 0.8)
          }
        ]}>
        {content}
      </View>
    )
  }

  return null
}

type Props = {
  chartData:
    | {
        date: Date
        value: number
      }[]
    | undefined
  shouldShowInstruction: boolean
  onInstructionRead: () => void
}
