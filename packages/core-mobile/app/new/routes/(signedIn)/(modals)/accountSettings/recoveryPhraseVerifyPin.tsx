import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const RecoveryPhraseVerifyPinScreen = (): JSX.Element => {
  const { replace } = useDebouncedRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    replace({ pathname: './showRecoveryPhrase', params: { mnemonic } })
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}

export default RecoveryPhraseVerifyPinScreen
