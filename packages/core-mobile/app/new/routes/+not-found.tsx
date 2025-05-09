import { useRouter } from 'expo-router'
import { useEffect } from 'react'

// This component is used to redirect to the previous screen when the user tries to access a non-existing route.
const NotFoundRedirect = (): null => {
  const { back, canGoBack } = useRouter()
  useEffect(() => {
    canGoBack() && back()
  }, [back, canGoBack])

  return null
}

export default NotFoundRedirect
