import { useNavigation } from '@react-navigation/native'
import React, { useEffect } from 'react'
import BackBarButton from 'components/BackBarButton'

const useCommonHeader = (): void => {
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerBackTitleVisible: false,
      headerBackImage: () => <BackBarButton />,
      headerShadowVisible: false
    })
  }, [navigation])
}

export default useCommonHeader
