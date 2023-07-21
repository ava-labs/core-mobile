import React from 'react'
import { Controller } from 'react-hook-form'
import InputText from '../InputText'
import { IFormInputText } from './types'

export const FormInputText = ({
  control,
  name,
  rules,
  errorText,
  defaultValue,
  ...props
}: IFormInputText) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue ?? ''}
      render={({ field: { onChange, onBlur, value } }) => (
        <InputText
          {...props}
          text={value}
          onChangeText={onChange}
          errorText={errorText?.toString()}
          onBlur={onBlur}
        />
      )}
    />
  )
}
