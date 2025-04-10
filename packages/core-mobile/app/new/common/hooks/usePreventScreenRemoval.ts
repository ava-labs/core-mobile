import { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'

export const usePreventScreenRemoval = (shouldPrevent: boolean): void => {
  const navigation = useNavigation()

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (shouldPrevent) {
        // Prevent removal if an action is in progress.
        e.preventDefault()
      }
    })
  }, [navigation, shouldPrevent])
}
