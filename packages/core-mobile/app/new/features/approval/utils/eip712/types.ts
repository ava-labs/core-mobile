import { DetailSection } from '@avalabs/vm-module-types'

/**
 * The well-known EIP-712 schemas we recognize and render a human-readable
 * summary for. Anything else falls back to the raw beautified "Message" blob
 * produced by the evm-module.
 */
export enum KnownTypedDataKind {
  ERC20_PERMIT = 'erc20Permit',
  PERMIT2 = 'permit2',
  SEAPORT = 'seaport'
}

/**
 * Result of parsing a typed-data payload against the known schemas.
 * `section` is ready to hand straight to the existing <Details> component.
 */
export type ParsedKnownTypedData = {
  kind: KnownTypedDataKind
  section: DetailSection
}
