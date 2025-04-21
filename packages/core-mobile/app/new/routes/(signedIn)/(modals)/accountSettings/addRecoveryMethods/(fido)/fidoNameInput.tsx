import React, { useCallback, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { FidoType } from 'services/passkey/types'
import Component from 'features/onboarding/components/FidoNameInput'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export type FIDONameInputProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
}

const FidoNameInput = (): JSX.Element => {
  const router = useDebouncedRouter()
  const { fidoRegisterInit } = useRecoveryMethodsContext()
  const { title, description, textInputPlaceholder, fidoType } =
    useLocalSearchParams<FIDONameInputProps>()

  const [name, setName] = useState<string>('')

  const handleSave = useCallback((): void => {
    router.canGoBack() && router.back()
    fidoRegisterInit(name, fidoType)
  }, [name, fidoRegisterInit, router, fidoType])

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
