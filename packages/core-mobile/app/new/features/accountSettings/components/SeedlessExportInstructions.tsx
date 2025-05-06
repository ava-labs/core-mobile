import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Space } from 'common/components/Space'
import React, { useCallback } from 'react'
import { SHOW_RECOVERY_PHRASE } from '../consts'
import {
  getDelayInstruction,
  getDelayWarningDescription
} from '../context/SeedlessMnemonicExportProvider'

interface Props {
  onNext: () => void
}

const STEPS = [
  'Login with your social account',
  'Verify recovery method',
  getDelayInstruction()
]

export const SeedlessExportInstructions = ({ onNext }: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const renderFooter = useCallback(() => {
    return (
      <View>
        <Button type="primary" size="large" onPress={onNext}>
          Next
        </Button>
      </View>
    )
  }, [onNext])

  return (
    <ScrollScreen
      title={SHOW_RECOVERY_PHRASE}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View
        sx={{
          marginTop: 24,
          borderRadius: 8,
          backgroundColor: '$surfacePrimary',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          width: '80%'
        }}>
        <Icons.Action.Info color={colors.$textDanger} />
        <Text
          sx={{
            color: colors.$textDanger,
            fontSize: 13,
            lineHeight: 16,
            marginRight: 16
          }}>
          {getDelayWarningDescription()}
        </Text>
      </View>

      <View
        sx={{
          marginTop: 40,
          backgroundColor: '$surfaceSecondary',
          paddingVertical: 19,
          paddingHorizontal: 14,
          borderRadius: 12,
          gap: 16
        }}>
        {STEPS.map((step, index) => {
          return (
            <View key={index}>
              <View sx={{ flexDirection: 'row' }}>
                <View
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textPrimary', fontSize: 16 }}>
                    {index + 1}.
                  </Text>
                </View>
                <Space x={12} />
                <Text
                  variant="subtitle2"
                  sx={{ color: '$textPrimary', fontSize: 16 }}>
                  {step}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </ScrollScreen>
  )
}
