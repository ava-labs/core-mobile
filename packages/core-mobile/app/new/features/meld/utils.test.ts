import { CreateCryptoQuoteErrorCode } from './types'
import { getErrorMessage } from './utils'

describe('getErrorMessage', () => {
  it('returns message-only API errors with the HTTP status', () => {
    const error = Object.assign(new Error('Request failed'), {
      response: {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'No valid quotes found' }
      }
    })

    expect(getErrorMessage(error)).toEqual({
      statusCode: CreateCryptoQuoteErrorCode.BAD_REQUEST,
      message: 'No valid quotes found'
    })
  })
})
