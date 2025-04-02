import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Space } from 'components/Space'
import {
  getDelayInstruction,
  getDelayWarningDescription
} from '../context/SeedlessMnemonicExportProvider'
import { SHOW_RECOVERY_PHRASE } from '../consts'

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

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading2">{SHOW_RECOVERY_PHRASE}</Text>
        <View
          sx={{
            marginTop: 27,
            borderRadius: 8,
            backgroundColor: '$surfacePrimary',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
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
      </View>
      <Button
        type="primary"
        size="large"
        style={{ marginBottom: 60 }}
        onPress={onNext}>
        Next
      </Button>
    </View>
  )
}
