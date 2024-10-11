import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'

const useCommonHeader = (): void => {
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
    })
  }, [navigation])
}

export default useCommonHeader
