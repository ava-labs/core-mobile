import { useRouter } from 'expo-router'
import { useEffect } from 'react'

// This component is used to redirect to the portfolio screen when the user tries to access a non-existing route.
const NotFoundRedirect = (): null => {
  const router = useRouter()

  useEffect(() => {
    // @ts-ignore TODO: make routes typesafe
    router.replace('/portfolio')
  }, [router])

  return null
}

export default NotFoundRedirect
