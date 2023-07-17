import { Brand } from 'types/brand'

export type Seconds = Brand<number, 'Seconds'>

export function Seconds(value: number) {
  return value as Seconds
}
