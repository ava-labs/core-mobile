import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import ImgButtonAva from 'components/ImgButtonAva'
import { useApplicationContext } from 'contexts/ApplicationContext'

type Props = {
  showBack?: boolean
  showExit?: boolean
  showSwitchWallet?: boolean
  onBack?: () => void
  onExit?: () => void
  onSwitchWallet?: () => void
  testID?: string
}

export default function Header(props: Props | Readonly<Props>) {
  const context = useApplicationContext()
  const isDarkMode = context.isDarkMode

  const onBackPress = () => {
    props.onBack?.()
  }
  const onExitPress = () => {
    props.onExit?.()
  }
  const onSwitchWalletPress = () => {
    props.onSwitchWallet?.()
  }

  const logo = require('assets/icons/avax_token.png')
  const icon = isDarkMode
    ? require('assets/icons/arrow_back_dark.png')
    : require('assets/icons/arrow_back_light.png')
  const iconExit = isDarkMode
    ? require('assets/icons/logout_dark.png')
    : require('assets/icons/logout_light.png')
  const backBtn = props.showBack ? (
    <ImgButtonAva src={icon} onPress={onBackPress} testID="back_button" />
  ) : undefined
  const exitBtn = props.showExit ? (
    <ImgButtonAva src={iconExit} onPress={onExitPress} />
  ) : undefined
  const iconSwitchWallet = isDarkMode
    ? require('assets/icons/change_circle_dark.png')
    : require('assets/icons/change_circle_light.png')
  const switchWalletBtn = props.showSwitchWallet ? (
    <ImgButtonAva src={iconSwitchWallet} onPress={onSwitchWalletPress} />
  ) : undefined

  return (
    <View style={styles.horizontalLayout}>
      <View style={styles.padded}>
        <Image
          accessibilityRole="image"
          source={logo}
          style={styles.logo}
          testID="back_button"
        />
      </View>
      <View style={styles.atEnd} testID="back_button">
        {exitBtn}
      </View>
      {switchWalletBtn}
      {backBtn}
    </View>
  )
}

const styles: any = StyleSheet.create({
  logo: {
    height: '100%',
    width: '100%',
    resizeMode: 'contain'
  },
  horizontalLayout: {
    flex: 0,
    height: 48
  },
  padded: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    paddingTop: 8,
    paddingBottom: 8
  },
  atEnd: {
    position: 'absolute',
    right: 0
  }
})
