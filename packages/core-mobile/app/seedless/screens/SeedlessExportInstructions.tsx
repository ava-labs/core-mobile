import { Button, Text, View, alpha, useTheme } from '@avalabs/k2-mobile'
import React from 'react'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import {
  getDelayInstruction,
  getDelayWarningDescription,
  getDelayWarningTitle
} from 'seedless/hooks/useSeedlessMnemonicExport'

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
        <Text variant="heading3">Recovery Phrase</Text>
        {STEPS.map((step, index) => {
          return (
            <View key={index}>
              <Space y={16} />
              <View sx={{ flexDirection: 'row' }}>
                <View
                  sx={{
                    backgroundColor: '$neutral800',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <Text variant="heading6" sx={{ color: '$neutral50' }}>
                    {index + 1}.
                  </Text>
                </View>
                <Space x={12} />
                <Text variant="body1" sx={{ color: '$neutral50' }}>
                  {step}
                </Text>
              </View>
            </View>
          )
        })}
        <View
          sx={{ marginVertical: 32, height: 1, backgroundColor: '$neutral800' }}
        />

        <View
          sx={{
            flexDirection: 'row',
            borderColor: '$warningLight',
            borderRadius: 8,
            borderWidth: 1,
            padding: 16,
            backgroundColor: alpha(colors.$warningDark, 0.1),
            alignItems: 'center'
          }}>
          <InfoSVG color={colors.$warningLight} size={24} />
          <Space x={8} />
          <View sx={{ flex: 1 }}>
            <Text variant="alertTitle">{getDelayWarningTitle()}</Text>
            <Text variant="alertDescription">
              {getDelayWarningDescription()}
            </Text>
          </View>
        </View>
      </View>
      <Button
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={onNext}>
        Next
      </Button>
    </View>
  )
}
