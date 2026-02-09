import { renderHook } from '@testing-library/react-hooks'
import { useRouter } from 'expo-router-original'
import { useSafeRouter, resetNavigationThrottle } from './useSafeRouter'

jest.mock('expo-router-original', () => ({
  useRouter: jest.fn()
}))

describe('useSafeRouter', () => {
  let mockRouter: {
    navigate: jest.Mock
    push: jest.Mock
    back: jest.Mock
    replace: jest.Mock
  }
  let originalDateNow: () => number
  let mockNow: number

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
      push: jest.fn(),
      back: jest.fn(),
      replace: jest.fn()
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    originalDateNow = Date.now
    mockNow = 1000
    Date.now = jest.fn(() => mockNow)
    resetNavigationThrottle()
  })

  afterEach(() => {
    Date.now = originalDateNow
    resetNavigationThrottle()
    jest.clearAllMocks()
  })

  describe('navigate', () => {
    it('calls router.navigate for throttled routes on first call', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/send' as any)

      expect(mockRouter.navigate).toHaveBeenCalledWith('/send')
    })

    it('blocks subsequent navigate calls to throttled routes within 300ms', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/send' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/buy' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)
    })

    it('allows navigate calls to throttled routes after 300ms', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/send' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 300
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/buy' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(2)
    })

    it('does not throttle non-whitelisted routes', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/some-other-route' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 50
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/another-route' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(2)
    })

    it('handles object route format with pathname', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate({ pathname: '/accountSettings' } as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate({ pathname: '/send' } as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1) // blocked
    })
  })

  describe('push', () => {
    it('calls router.push for throttled routes on first call', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/tokenDetail' as any)

      expect(mockRouter.push).toHaveBeenCalledWith('/tokenDetail')
    })

    it('blocks subsequent push calls to throttled routes within 300ms', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/tokenDetail' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(1)

      mockNow += 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/collectibleDetail' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(1)
    })

    it('allows push calls to throttled routes after 300ms', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/tokenDetail' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(1)

      mockNow += 300
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/collectibleDetail' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(2)
    })

    it('does not throttle non-whitelisted routes', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/some-stack-route' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(1)

      mockNow += 50
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/another-stack-route' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(2)
    })
  })

  describe('shared throttle state', () => {
    it('shares throttle state between navigate and push', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/send' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/tokenDetail' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(0) // blocked by navigate

      mockNow += 300
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.push('/tokenDetail' as any)
      expect(mockRouter.push).toHaveBeenCalledTimes(1)
    })
  })

  describe('route matching', () => {
    it('matches routes with trailing slashes', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/accountSettings/' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate('/send/' as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1) // blocked
    })

    it('matches nested modal routes', () => {
      const { result } = renderHook(() => useSafeRouter())

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate({ pathname: '/(signedIn)/(modals)/send' } as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1)

      mockNow += 100
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.navigate({ pathname: '/(signedIn)/(modals)/buy' } as any)
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1) // blocked
    })
  })

  describe('other router methods', () => {
    it('passes through other router methods unchanged', () => {
      const { result } = renderHook(() => useSafeRouter())

      result.current.back()
      expect(mockRouter.back).toHaveBeenCalledTimes(1)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.replace('/some-route' as any)
      expect(mockRouter.replace).toHaveBeenCalledWith('/some-route')
    })
  })
})
