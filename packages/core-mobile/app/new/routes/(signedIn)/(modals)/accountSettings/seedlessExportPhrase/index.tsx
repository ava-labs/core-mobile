import React, { useEffect } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'

const SeedlessExportPhraseScreen = (): JSX.Element => {
  const { authenticate } = useSeedlessMnemonicExportContext()

  useEffect(() => {
    authenticate()
  }, [authenticate])

  return <LoadingState sx={{ flex: 1 }} />
}

export default SeedlessExportPhraseScreen
