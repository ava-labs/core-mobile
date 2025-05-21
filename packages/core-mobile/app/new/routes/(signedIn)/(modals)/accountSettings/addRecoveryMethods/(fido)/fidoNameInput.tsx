import React, { useCallback, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { FidoType } from 'services/passkey/types'
import Component from 'features/onboarding/components/FidoNameInput'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'

export type FIDONameInputProps = {
  fidoType: FidoType
  title: string
  description: string
  textInputPlaceholder: string
}

const FidoNameInput = (): JSX.Element => {
  const { fidoRegisterInit } = useRecoveryMethodsContext()
  const { title, description, textInputPlaceholder, fidoType } =
    useLocalSearchParams<FIDONameInputProps>()

  const [name, setName] = useState<string>('')

  const handleSave = useCallback(async () => {
    await fidoRegisterInit(name, fidoType)
  }, [name, fidoRegisterInit, fidoType])

  return (
    <Component
      isModal
      title={title ?? ''}
      description={description ?? ''}
      textInputPlaceholder={textInputPlaceholder ?? ''}
      name={name}
      setName={setName}
      onSave={handleSave}
    />
  )
}

export default FidoNameInput
