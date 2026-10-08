import { NodeValidator } from 'types/earn'

export const filterConnectedValidators = <
  T extends Pick<NodeValidator, 'connected'>
>(
  validators: T[]
): T[] => validators.filter(v => v.connected)
