import React from 'react'
import { useRouter } from 'expo-router'

/**
 * @deprecated This route is deprecated. Use enhancedSetup.tsx instead.
 * This file redirects to the new enhanced Ledger setup flow.
 */
export default function ConnectWallet(): JSX.Element {
  const router = useRouter()

  // Redirect to enhanced setup - this route is deprecated
  React.useEffect(() => {
    // @ts-ignore TODO: make routes typesafe
    router.replace('/accountSettings/ledger')
  }, [router])

  // Return null while redirecting
  return <></>
}
