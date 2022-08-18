import React, { useState } from 'react'
import { useDeepLinking } from 'navigation/useDeepLinking'
import { View } from 'react-native'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import Logger from 'utils/Logger'

const DappManualConnection = () => {
  const [uri, setUri] = useState<string>('')
  const { setLinkManually } = useDeepLinking(true)
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16
      }}>
      <InputText
        text={uri}
        onChangeText={setUri}
        style={{ minWidth: 300 }}
        placeholder={'uri'}
      />
      <AvaButton.SecondaryMedium
        onPress={() => {
          Logger.warn('dapp uri', uri)
          setLinkManually(uri)
        }}>
        Connect
      </AvaButton.SecondaryMedium>
    </View>
  )
}

export default DappManualConnection
