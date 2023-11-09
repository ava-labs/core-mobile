import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import React, { FC } from 'react'
import { StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import SocialButton from './SocialButton'

type Props = {
  title: string
  onGoogleAction: () => void
  onMnemonicAction: () => void
}

const AuthButtons: FC<Props> = ({
  title,
  onGoogleAction,
  onMnemonicAction
}) => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View>
      <View style={styles.centerContainer}>
        <Text variant="alertTitle">{title}</Text>
        <Space y={16} />
        <View style={styles.socialButtonsContainer}>
          <SocialButton type="google" onPress={onGoogleAction} />
        </View>
        <Space y={16} />
        <View style={styles.separatorContainer}>
          <Separator color={colors.$neutral850} style={{ flexGrow: 1 }} />
          <Text style={{ marginHorizontal: 16 }} variant="alertTitle">
            or
          </Text>
          <Separator color={colors.$neutral850} style={{ flexGrow: 1 }} />
        </View>
      </View>
      <Button type="secondary" size="xlarge" onPress={onMnemonicAction}>
        Recovery Phrase
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  socialButtonsContainer: {
    flexDirection: 'row'
  },
  separatorContainer: {
    paddingHorizontal: 28,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center'
  }
})

export default AuthButtons
