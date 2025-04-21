import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'
import React from 'react'

const VerifyChangePinScreen = (): React.JSX.Element => {
  const { replace } = useDebouncedRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    replace({ pathname: './changePin', params: { mnemonic } })
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}
export default VerifyChangePinScreen
