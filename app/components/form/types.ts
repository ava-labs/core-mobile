import { InputTextProps } from 'components/InputText'
import {
  ControllerProps,
  FieldError,
  FieldErrorsImpl,
  FieldValues,
  Merge,
  RegisterOptions
} from 'react-hook-form'

export interface IFormInputText
  extends Omit<InputTextProps, 'errorText' | 'text'> {
  control?: ControllerProps<FieldValues>['control']
  name: string
  rules?: Omit<
    RegisterOptions<FieldValues, 'firstName'>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >
  errorText?: string | FieldError | Merge<FieldError, FieldErrorsImpl>
  defaultValue?: string
}
