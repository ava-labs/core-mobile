import React, { useEffect } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'

const SeedlessExportPhraseScreen = (): JSX.Element => {
  const { authenticate } = useSeedlessMnemonicExportContext()

  useEffect(() => {
    authenticate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <LoadingState sx={{ flex: 1 }} />
}

export default SeedlessExportPhraseScreen
