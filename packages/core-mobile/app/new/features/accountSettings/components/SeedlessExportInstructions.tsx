import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Space } from 'components/Space'
import {
  getDelayInstruction,
  getDelayWarningDescription,
  getDelayWarningTitle
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

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading2">Show recovery phrase</Text>
        {STEPS.map((step, index) => {
          return (
            <View key={index}>
              <Space y={16} />
              <View sx={{ flexDirection: 'row' }}>
                <View
                  sx={{
                    backgroundColor: '$surfacePrimary',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <Text variant="heading6" sx={{ color: '$textPrimary' }}>
                    {index + 1}.
                  </Text>
                </View>
                <Space x={12} />
                <Text variant="body1" sx={{ color: '$textPrimary' }}>
                  {step}
                </Text>
              </View>
            </View>
          )
        })}
        <View
          sx={{
            marginVertical: 32,
            height: 1,
            backgroundColor: '$borderPrimary'
          }}
        />
        <View
          sx={{
            borderRadius: 8,
            backgroundColor: '$surfacePrimary',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}>
          <Icons.Action.Info color={colors.$textPrimary} />
          <View>
            <Text
              sx={{
                color: colors.$textPrimary,
                fontSize: 13,
                lineHeight: 16,
                fontWeight: '600'
              }}>
              {getDelayWarningTitle()}
            </Text>
            <Text
              sx={{
                color: colors.$textPrimary,
                fontSize: 13,
                lineHeight: 16,
                marginRight: 16
              }}>
              {getDelayWarningDescription()}
            </Text>
          </View>
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
