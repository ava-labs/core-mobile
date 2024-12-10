import React, { FC } from 'react'
import { Dimensions, Pressable, StyleProp, View, ViewStyle } from 'react-native'
import AvaButton from 'components/AvaButton'
import ClearSVG from 'components/svg/ClearSVG'
import { Text, useTheme } from '@avalabs/k2-mobile'

const WINDOW_WIDTH = Dimensions.get('window').width

export enum DappToastTypes {
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

interface Props {
  toastId?: string
  dappName: string
  message: string
  type: DappToastTypes
}

const dismissToast = (toastId?: string): void => {
  toastId ? global?.toast?.hide(toastId) : global?.toast.hideAll()
}

const DappToast: FC<Props> = ({ toastId, message, type, dappName }) => {
  const {
    theme: { colors }
  } = useTheme()

  const renderContent = (): JSX.Element | undefined => {
    if (type === DappToastTypes.ERROR) {
      return <Error dappName={dappName} message={message} />
    }
    if (type === DappToastTypes.SUCCESS) {
      return <Success dappName={dappName} message={message} />
    }
  }

  const hideToast = (): void => dismissToast(toastId)

  const style = {
    backgroundColor: colors.$neutral850,
    borderRadius: 8,
    justifyContent: 'center',
    width: WINDOW_WIDTH * 0.86,
    padding: 16
  } as StyleProp<ViewStyle>

  return (
    <AvaButton.Base onPress={hideToast} style={style}>
      {renderContent()}
      <Pressable
        style={{ position: 'absolute', top: 10, right: 10 }}
        onPress={hideToast}>
        <ClearSVG color={colors.$white} backgroundColor={colors.$transparent} />
      </Pressable>
    </AvaButton.Base>
  )
}

const Success = ({
  dappName,
  message
}: {
  dappName: string
  message: string
}): JSX.Element => {
  return (
    <View testID="success_toast" style={{ backgroundColor: 'transparent' }}>
      <Text
        variant="buttonSmall"
        sx={{ width: '80%', color: '$successMain' }}
        ellipsizeMode="tail"
        numberOfLines={1}>
        {dappName}
      </Text>
      <Text
        variant="buttonLarge"
        sx={{ lineHeight: 28, color: '$neutral50' }}
        ellipsizeMode="tail"
        numberOfLines={5}>
        {message}
      </Text>
    </View>
  )
}

const Error = ({
  dappName,
  message
}: {
  dappName: string
  message: string
}): JSX.Element => {
  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <Text
        variant="buttonSmall"
        sx={{ width: '80%', color: '$dangerMain' }}
        ellipsizeMode="tail"
        numberOfLines={1}>
        {dappName}
      </Text>
      <Text
        variant="buttonLarge"
        sx={{ lineHeight: 28, color: '$neutral50' }}
        ellipsizeMode="tail"
        numberOfLines={7}>
        {message}
      </Text>
    </View>
  )
}

export default DappToast
