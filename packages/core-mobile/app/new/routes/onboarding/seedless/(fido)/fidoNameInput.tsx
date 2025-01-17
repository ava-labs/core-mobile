import React, { useCallback, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FidoType } from 'services/passkey/types'
import { useRegisterAndAuthenticateFido } from 'features/onboarding/hooks/useRegisterAndAuthenticateFido'
import { hideLogoModal, showLogoModal } from 'common/components/LogoModal'
import SeedlessService from 'seedless/services/SeedlessService'
import Component from 'features/onboarding/components/FidoNameInput'

export type FIDONameInputProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
}

const FidoNameInput = (): JSX.Element => {
  const router = useRouter()
  const { registerAndAuthenticateFido } = useRegisterAndAuthenticateFido()
  const { title, description, textInputPlaceholder, fidoType } =
    useLocalSearchParams<FIDONameInputProps>()

  const [name, setName] = useState<string>('')

  const onAccountVerified = useCallback(async (): Promise<void> => {
    showLogoModal()
    const walletName = await SeedlessService.getAccountName()
    hideLogoModal()

    if (walletName) {
      router.navigate('./createPin')
      return
    }
    router.navigate('./nameYourWallet')
  }, [router])

  const handleSave = (): void => {
    if (router.canGoBack()) {
      router.back()
    }
    fidoType &&
      registerAndAuthenticateFido({
        name,
        fidoType,
        onAccountVerified
      })
  }

  return (
    <Component
      title={title ?? ''}
      description={description ?? ''}
      textInputPlaceholder={textInputPlaceholder ?? ''}
      name={name}
      setName={setName}
      handleSave={handleSave}
    />
  )
}

export default FidoNameInput
