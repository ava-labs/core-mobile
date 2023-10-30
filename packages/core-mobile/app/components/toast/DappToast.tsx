import React, { FC } from 'react'
import { Dimensions, Pressable, StyleProp, View, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import ClearSVG from 'components/svg/ClearSVG'

const WINDOW_WIDTH = Dimensions.get('window').width

export enum DappToastTypes {
  ERROR = 'ERROR'
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
  const theme = useApplicationContext().theme

  const renderContent = (): JSX.Element | undefined => {
    if (type === DappToastTypes.ERROR) {
      return <Error dappName={dappName} message={message} />
    }
  }

  const hideToast = (): void => dismissToast(toastId)

  const style = {
    backgroundColor: theme.neutral850,
    borderRadius: 8,
    justifyContent: 'center',
    width: WINDOW_WIDTH * 0.89,
    padding: 16
  } as StyleProp<ViewStyle>

  return (
    <AvaButton.Base onPress={hideToast} style={style}>
      {renderContent()}
      <Pressable
        style={{ position: 'absolute', top: 10, right: 10 }}
        onPress={hideToast}>
        <ClearSVG color={theme.white} backgroundColor={theme.transparent} />
      </Pressable>
    </AvaButton.Base>
  )
}

const Error = ({
  dappName,
  message
}: {
  dappName: string
  message: string
}): JSX.Element => {
  const theme = useApplicationContext().theme

  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <AvaText.ButtonSmall
        color={theme.colorError}
        textStyle={{ width: '80%' }}
        ellipsizeMode="tail"
        numberOfLines={1}>
        {dappName}
      </AvaText.ButtonSmall>
      <AvaText.ButtonLarge
        color={theme.colorText1}
        textStyle={{ lineHeight: 28 }}
        ellipsizeMode="tail"
        numberOfLines={5}>
        {message}
      </AvaText.ButtonLarge>
    </View>
  )
}

export default DappToast
