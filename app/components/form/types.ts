import { InputTextProps } from 'components/InputText'
import {
  Control,
  FieldError,
  FieldErrorsImpl,
  FieldPath,
  FieldPathValue,
  FieldValues,
  Merge,
  RegisterOptions
} from 'react-hook-form'

export interface IFormInputText<T extends FieldValues>
  extends Omit<InputTextProps, 'errorText' | 'text'> {
  control?: Control<T>
  name: FieldPath<T>
  rules?: Omit<
    RegisterOptions<T>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  errorText?: string | FieldError | Merge<FieldError, FieldErrorsImpl>
  defaultValue?: FieldPathValue<T, FieldPath<T>>
}
