import { useRouter } from 'expo-router'
import { hideLogoModal, showLogoModal } from 'new/components/LogoModal'
import { OidcAuth } from 'new/types'
import { showSnackbar } from 'new/utils/toast'
import React, { createContext, ReactNode, useContext, useState } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'

export interface SeedlessOidcContextState {
  oidcAuth?: OidcAuth
  setOidcAuth: (oidcAuth?: OidcAuth) => void
  allowsUserToAddLater: boolean
  setAllowsUserToAddLater: (addLater: boolean) => void
  onAccountVerified: (withMfa?: boolean) => Promise<void>
}

export const SeedlessOidcContext = createContext<SeedlessOidcContextState>(
  {} as SeedlessOidcContextState
)

export const SeedlessOidcProvider = ({
  children
}: {
  children: ReactNode
}): React.JSX.Element => {
  const router = useRouter()
  const [oidcAuth, setOidcAuth] = useState<OidcAuth>()
  const [allowsUserToAddLater, setAllowsUserToAddLater] = useState(true)

  const onAccountVerified = async (withMfa = false): Promise<void> => {
    showLogoModal()
    const walletName = await SeedlessService.getAccountName()
    hideLogoModal()

    if (withMfa) {
      showSnackbar('Recovery methods added successfully')
    }

    if (walletName) {
      router.navigate('./createPin')
      return
    }
    router.navigate('./nameYourWallet')
  }

  const state: SeedlessOidcContextState = {
    oidcAuth,
    setOidcAuth,
    onAccountVerified,
    allowsUserToAddLater,
    setAllowsUserToAddLater
  }

  return (
    <SeedlessOidcContext.Provider value={state}>
      {children}
    </SeedlessOidcContext.Provider>
  )
}

export function useSeedlessOidcContext(): SeedlessOidcContextState {
  return useContext(SeedlessOidcContext)
}
