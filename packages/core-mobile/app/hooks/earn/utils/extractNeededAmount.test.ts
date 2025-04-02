import { extractNeededAmount } from './extractNeededAmount'

it('should return the correct BigInt amount for a matching error message', () => {
  const errorMessage =
    'Insufficient funds: provided UTXOs need 15979 more unlocked nAVAX (asset id: U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK) to cover fee.'
  const assetId = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK'

  const result = extractNeededAmount(errorMessage, assetId)
  expect(result).toBe(BigInt(15979))
})

it('should return null for an error message that does not match the regex', () => {
  const errorMessage = 'Some random error message without needed amount'
  const assetId = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK'

  const result = extractNeededAmount(errorMessage, assetId)
  expect(result).toBeNull()
})

it('should return null if the asset ID in the error message does not match the provided asset ID', () => {
  const errorMessage =
    'Insufficient funds: provided UTXOs need 15979 more unlocked nAVAX (asset id: U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK) to cover fee.)'
  const assetId = 'DifferentAssetId'

  const result = extractNeededAmount(errorMessage, assetId)
  expect(result).toBeNull()
})

it('should return null if the needed amount is not present in the error message', () => {
  const errorMessage =
    'Insufficient funds: provided UTXOs need more unlocked nAVAX (asset id: U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK)'
  const assetId = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK'

  const result = extractNeededAmount(errorMessage, assetId)
  expect(result).toBeNull()
})

it('should handle edge cases like empty error messages gracefully', () => {
  const errorMessage = ''
  const assetId = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK'

  const result = extractNeededAmount(errorMessage, assetId)
  expect(result).toBeNull()
})
