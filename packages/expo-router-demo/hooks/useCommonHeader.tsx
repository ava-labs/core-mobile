import BackBarButton from '@/components/navigation/BackBarButton'
import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'

const useCommonHeader = (): void => {
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerBackTitleVisible: false,
      headerBackImage: () => <BackBarButton />,
      headerShadowVisible: false
    })
  }, [navigation])
}

export default useCommonHeader
