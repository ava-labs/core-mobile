import React, { FC } from 'react'
import { Dimensions } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'

const WINDOW_WIDTH = Dimensions.get('window').width

interface Props {
  message: string
  toastId?: string
}

const GeneralToast: FC<Props> = ({ message, toastId }) => {
  const theme = useApplicationContext().theme

  function dismissToast() {
    toastId && global?.toast?.hide(toastId)
  }

  return (
    <AvaButton.Base
      onPress={() => {
        dismissToast()
      }}
      style={{
        backgroundColor: theme.neutral850,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: WINDOW_WIDTH * 0.8,
        paddingHorizontal: 8,
        height: 72
      }}>
      {
        <AvaText.ButtonLarge
          color={theme.colorText1}
          textStyle={{ textAlign: 'center' }}>
          {message}
        </AvaText.ButtonLarge>
      }
    </AvaButton.Base>
  )
}

export default GeneralToast
