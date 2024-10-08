import { useNavigation } from '@react-navigation/native'
import React, { useEffect } from 'react'
import BackButtonIcon from 'components/BackButtonIcon'

const useCommonHeader = (): void => {
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerBackTitleVisible: false,
      headerBackImage: () => <BackButtonIcon />,
      headerShadowVisible: false
    })
  }, [navigation])
}

export default useCommonHeader
