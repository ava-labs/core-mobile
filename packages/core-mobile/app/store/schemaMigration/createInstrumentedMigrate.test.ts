import * as Sentry from '@sentry/react-native'
import { MigrationManifest, PersistedState } from 'redux-persist'
import { createInstrumentedMigrate } from './createInstrumentedMigrate'
import { useSchemaMigrationFailure } from './schemaMigrationFailureStore'

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  reactNavigationIntegration: jest.fn(() => ({})),
  withScope: jest.fn(),
  getGlobalScope: jest.fn(() => ({ setUser: jest.fn() })),
  addBreadcrumb: jest.fn()
}))

const mockCaptureException = Sentry.captureException as jest.Mock

const baseState = (version: number): PersistedState => ({
  _persist: { version, rehydrated: false }
})

beforeEach(() => {
  jest.clearAllMocks()
  useSchemaMigrationFailure.setState(null)
})

describe('createInstrumentedMigrate', () => {
  it('passes a successful migration through unchanged', async () => {
    const manifest: MigrationManifest = {
      1: state => ({ ...state, foo: 'bar' } as PersistedState)
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    const result = await migrate(baseState(0), 1)

    expect(result).toMatchObject({ foo: 'bar' })
    expect(useSchemaMigrationFailure.getState()).toBeNull()
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('captures the failing version + error and reports to Sentry on a sync throw', async () => {
    const err = new Error('boom-v1')
    const manifest: MigrationManifest = {
      1: () => {
        throw err
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 1)).rejects.toThrow('boom-v1')

    const failure = useSchemaMigrationFailure.getState()
    expect(failure).toEqual({ version: 1, error: err })
    expect(mockCaptureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        tags: { system: 'schemaMigration' },
        extra: { version: 1 }
      })
    )
  })

  it('captures the failing version + error on an async rejection', async () => {
    const err = new Error('boom-v2')
    const manifest: MigrationManifest = {
      1: state => state,
      2: async () => {
        throw err
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 2)).rejects.toThrow('boom-v2')

    expect(useSchemaMigrationFailure.getState()).toEqual({
      version: 2,
      error: err
    })
  })

  it('records only the FIRST failure when multiple migrations would error', async () => {
    const errV1 = new Error('boom-v1')
    const manifest: MigrationManifest = {
      1: () => {
        throw errV1
      },
      2: () => {
        throw new Error('boom-v2')
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 2)).rejects.toThrow()

    expect(useSchemaMigrationFailure.getState()).toEqual({
      version: 1,
      error: errV1
    })
    // Only one Sentry capture — we don't double-report when later steps
    // also error out against the now-Promise state from the first failure.
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
  })

  it('does not overwrite an existing failure record on a second failed run', async () => {
    const firstErr = new Error('first')
    useSchemaMigrationFailure.setState({ version: 1, error: firstErr })

    const manifest: MigrationManifest = {
      1: () => {
        throw new Error('second')
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 1)).rejects.toThrow('second')

    // First failure preserved — we surface the root cause.
    expect(useSchemaMigrationFailure.getState()).toEqual({
      version: 1,
      error: firstErr
    })
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('coerces non-Error throws into Error before capturing', async () => {
    const manifest: MigrationManifest = {
      1: () => {
        throw 'plain-string-throw'
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 1)).rejects.toBeDefined()

    const failure = useSchemaMigrationFailure.getState()
    expect(failure?.error).toBeInstanceOf(Error)
    expect(failure?.error.message).toContain('plain-string-throw')
  })
})
