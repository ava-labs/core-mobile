import mockNodes from 'tests/fixtures/nodes.json'
import { NodeValidators } from 'screens/earn/SelectNode'
import { getSimpleSortedValidators } from './getSortedValidators'

describe('getSimpleSortedValidators function', () => {
  it('should randomly return validator that has uptime > 98 from top 5 sorted choices', () => {
    const result = getSimpleSortedValidators(
      mockNodes.result.validators as unknown as NodeValidators
    )
    expect(Number(result?.uptime)).toBeGreaterThan(98)
  })

  it('should return undefined if validators prop is empty', () => {
    const result = getSimpleSortedValidators([])
    expect(result).toBe(undefined)
  })
})
