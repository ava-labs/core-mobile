import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

/**
 * Index route for Ledger setup - redirects to path selection
 * This ensures that navigating to /accountSettings/ledger shows the path selection screen
 */
export default function LedgerIndex(): JSX.Element {
  const router = useRouter()

  useEffect(() => {
    // Redirect to path selection screen immediately
    // @ts-ignore TODO: make routes typesafe
    router.replace('/accountSettings/ledger/pathSelection')
  }, [router])

  // Return null while redirecting
  return <></>
}
