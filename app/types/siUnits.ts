import { Brand } from 'types/brand'

export enum SiUnits {
  'MilliSeconds' = 'MilliSeconds',
  'Seconds' = 'Seconds'
}

export type MilliSeconds = Brand<bigint, SiUnits.MilliSeconds>
export type Seconds = Brand<bigint, SiUnits.Seconds>

export function convertToMilliSeconds(source: Seconds): MilliSeconds {
  return (source * 1000n) as MilliSeconds
}

export function convertToSeconds(source: MilliSeconds): Seconds {
  return (source / 1000n) as Seconds
}
