import React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import DotSVG from 'components/svg/DotSVG'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'

type Props = {
  isConfirming: boolean
  onConfirm: () => void
  onCancel: () => void
  header: string
  disclaimer?: string
  confirmBtnTitle: string
  cancelBtnTitle: string
  children?: React.ReactNode
}

export const ConfirmScreen = ({
  isConfirming,
  onConfirm,
  onCancel,
  header,
  disclaimer,
  confirmBtnTitle,
  cancelBtnTitle,
  children
}: Props) => {
  const { theme } = useApplicationContext()

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.LargeTitleBold textStyle={styles.header}>
        {header}
      </AvaText.LargeTitleBold>
      <View style={styles.logoContainer}>
        <View style={styles.dotContainer}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        <AvaLogoSVG
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
          size={57}
        />
      </View>
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colorBg2
          }
        ]}>
        {children}
        <FlexSpacer />
        {disclaimer && (
          <AvaText.Caption
            textStyle={[
              styles.disclaimer,
              {
                color: theme.colorText2
              }
            ]}>
            By selecting "Stake Now" you will lock your funds for the set
            duration of time.
          </AvaText.Caption>
        )}
        {isConfirming ? (
          <ActivityIndicator size={'large'} />
        ) : (
          <>
            <AvaButton.PrimaryLarge onPress={onConfirm}>
              {confirmBtnTitle}
            </AvaButton.PrimaryLarge>
            <Space y={16} />
            <AvaButton.SecondaryLarge onPress={onCancel}>
              {cancelBtnTitle}
            </AvaButton.SecondaryLarge>
          </>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { minHeight: '100%' },
  dotContainer: { position: 'absolute' },
  header: { marginHorizontal: 16, marginBottom: 10 },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -36,
    zIndex: 2
  },
  sheet: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flex: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  disclaimer: {
    textAlign: 'center',
    marginHorizontal: '15%',
    marginTop: 14,
    marginBottom: 24
  }
})
