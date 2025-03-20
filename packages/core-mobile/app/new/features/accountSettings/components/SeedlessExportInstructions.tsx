import { Button, Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Space } from 'components/Space'
import {
  getDelayInstruction
  // getDelayWarningDescription,
  // getDelayWarningTitle
} from 'seedless/hooks/useSeedlessMnemonicExport'
// import AlertBanner from 'screens/rpc/components/v2/AlertBanner'
// import { AlertType } from '@avalabs/vm-module-types'

interface Props {
  onNext: () => void
}

const STEPS = [
  'Login with your social account',
  'Verify recovery method',
  getDelayInstruction()
]

export const SeedlessExportInstructions = ({ onNext }: Props): JSX.Element => {
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
        {/* <AlertBanner
          alert={{
            type: AlertType.WARNING,
            details: {
              title: getDelayWarningTitle(),
              description: getDelayWarningDescription()
            }
          }}
        /> */}
      </View>
      <Button
        type="primary"
        size="large"
        style={{ marginVertical: 16 }}
        onPress={onNext}>
        Next
      </Button>
    </View>
  )
}
