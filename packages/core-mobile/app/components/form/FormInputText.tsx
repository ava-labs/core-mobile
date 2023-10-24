import React, { ChangeEvent } from 'react'
import { FieldValue, FieldValues, useController } from 'react-hook-form'
import InputText from '../InputText'
import { IFormInputText } from './types'

export const FormInputText = <T extends FieldValues>({
  control,
  name,
  rules,
  errorText,
  defaultValue,
  ...props
}: IFormInputText<T>) => {
  const {
    field: { onBlur, onChange, value }
  } = useController({ name, rules, defaultValue, control })

  const onChangeText = (text: string) => {
    onChange({ target: { value: text } } as ChangeEvent<FieldValue<T>>)
  }

  return (
    <InputText
      {...props}
      text={value}
      onChangeText={onChangeText}
      errorText={errorText?.toString()}
      onBlur={onBlur}
    />
  )
}
