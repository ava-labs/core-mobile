import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { humanize } from 'utils/string/humanize'
import { useBiometricLogin } from './BiometricLoginViewModel'

type Props = {
  mnemonic: string
  onSkip: () => void
  onBiometrySet: () => void
}

export default function BiometricLogin(
  props: Props | Readonly<Props>
): JSX.Element {
  const [confirmedUseBiometry, setConfirmedUseBiometry] = useState(false)

  const { biometryType, storeMnemonicWithBiometric, fingerprintIcon } =
    useBiometricLogin(props.mnemonic)

  const formattedBiometryType = humanize(biometryType)

  useEffect(() => {
    if (confirmedUseBiometry) {
      const asyncWrapper = async () => {
        try {
          await storeMnemonicWithBiometric()
          props.onBiometrySet()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          Alert.alert(e?.message || 'error')
        } finally {
          setConfirmedUseBiometry(false)
        }
      }
      asyncWrapper()
    }
  }, [confirmedUseBiometry, props, storeMnemonicWithBiometric])

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.centerLayout}>
        {fingerprintIcon}
        <Space y={90} />
        <AvaText.Heading1>{formattedBiometryType}</AvaText.Heading1>
        <Space y={8} />

        <AvaText.Body4
          textStyle={{
            textAlign: 'center',
            alignSelf: 'stretch',
            paddingRight: 8,
            paddingLeft: 8
          }}>
          Sign in quickly using your {formattedBiometryType}.{'\n'}Change this
          anytime in settings.
        </AvaText.Body4>
      </View>

      {!confirmedUseBiometry && (
        <AvaButton.TextMedium onPress={props.onSkip}>Skip</AvaButton.TextMedium>
      )}
      <Space y={16} />
      <AvaButton.PrimaryLarge onPress={() => setConfirmedUseBiometry(true)}>
        {confirmedUseBiometry ? (
          <ActivityIndicator size={'small'} />
        ) : (
          'Use ' + formattedBiometryType
        )}
      </AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    padding: 16,
    justifyContent: 'flex-end',
    height: '100%'
  },
  centerLayout: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
