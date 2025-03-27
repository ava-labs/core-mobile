import React, { useState, createContext, useContext, useMemo } from 'react'
import SeedlessSession from 'seedless/services/SeedlessSession'
import SeedlessExportService from 'seedless/services/SeedlessExportService'

type SeedlessRefreshTokenData = {
  isMfaRequired: boolean
  oidcToken: string
  mfaId: string
}

export interface SeedlessRefreshTokenContextState {
  seedlessRefreshTokenData?: SeedlessRefreshTokenData
  setSeedlessRefreshTokenData: (data: SeedlessRefreshTokenData) => void
  session: SeedlessSession
}

export const SeedlessRefreshTokenContext =
  createContext<SeedlessRefreshTokenContextState>(
    {} as SeedlessRefreshTokenContextState
  )

export const SeedlessRefreshTokenProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const seedlessExportService = useMemo(() => new SeedlessExportService(), [])

  const [seedlessRefreshTokenData, setSeedlessRefreshTokenData] =
    useState<SeedlessRefreshTokenData>()

  return (
    <SeedlessRefreshTokenContext.Provider
      value={{
        seedlessRefreshTokenData,
        setSeedlessRefreshTokenData,
        session: seedlessExportService.session
      }}>
      {children}
    </SeedlessRefreshTokenContext.Provider>
  )
}

export function useSeedlessRefreshTokenContext(): SeedlessRefreshTokenContextState {
  return useContext(SeedlessRefreshTokenContext)
}
