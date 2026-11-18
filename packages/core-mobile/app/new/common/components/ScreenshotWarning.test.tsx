import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'
import {
  getScreenshotWarningMessage,
  ScreenshotWarning
} from './ScreenshotWarning'

const mockWarning = jest.fn()
jest.mock('./Warning', () => ({
  Warning: (props: Record<string, unknown>) => {
    mockWarning(props)
    return null
  }
}))

const render = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer | undefined
  act(() => {
    tree = renderer.create(element)
  })
  return tree as ReactTestRenderer
}

describe('ScreenshotWarning', () => {
  it('warns against screenshots of the recovery phrase by default', () => {
    render(<ScreenshotWarning />)
    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        testID: 'screenshot_warning',
        message: getScreenshotWarningMessage('recovery phrase')
      })
    )
    expect(getScreenshotWarningMessage('recovery phrase')).toMatch(
      /^Do not take screenshots of your recovery phrase/
    )
  })

  it('supports other secrets', () => {
    render(<ScreenshotWarning secretLabel="private key" />)
    expect(mockWarning.mock.calls[0][0].message).toContain(
      'Do not take screenshots of your private key'
    )
  })
})
