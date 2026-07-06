import { MigrationManifest, PersistedState } from 'redux-persist'
import { createInstrumentedMigrate } from './createInstrumentedMigrate'
import {
  SchemaMigrationError,
  useSchemaMigrationFailure
} from './schemaMigrationFailureStore'

const baseState = (version: number): PersistedState => ({
  _persist: { version, rehydrated: false }
})

beforeEach(() => {
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
  })

  it('wraps a sync throw in SchemaMigrationError with the failing version + cause', async () => {
    const cause = new Error('boom-v1')
    const manifest: MigrationManifest = {
      1: () => {
        throw cause
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 1)).rejects.toBeInstanceOf(
      SchemaMigrationError
    )
    await expect(migrate(baseState(0), 1)).rejects.toMatchObject({
      version: 1,
      cause,
      message: 'boom-v1'
    })

    const failure = useSchemaMigrationFailure.getState()
    expect(failure).toBeInstanceOf(SchemaMigrationError)
    expect(failure?.version).toBe(1)
    expect(failure?.cause).toBe(cause)
  })

  it('wraps an async rejection in SchemaMigrationError', async () => {
    const cause = new Error('boom-v2')
    const manifest: MigrationManifest = {
      1: state => state,
      2: async () => {
        throw cause
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 2)).rejects.toMatchObject({
      version: 2,
      cause
    })
    expect(useSchemaMigrationFailure.getState()?.version).toBe(2)
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

    await expect(migrate(baseState(0), 2)).rejects.toBeInstanceOf(
      SchemaMigrationError
    )

    const failure = useSchemaMigrationFailure.getState()
    expect(failure?.version).toBe(1)
    expect(failure?.cause).toBe(errV1)
  })

  it('does not overwrite an existing failure record on a second failed run', async () => {
    const firstCause = new Error('first')
    const seeded = new SchemaMigrationError(1, firstCause)
    useSchemaMigrationFailure.setState(seeded)

    const manifest: MigrationManifest = {
      1: () => {
        throw new Error('second')
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 1)).rejects.toBeInstanceOf(
      SchemaMigrationError
    )

    // First failure preserved — we surface the root cause.
    expect(useSchemaMigrationFailure.getState()).toBe(seeded)
  })

  it('coerces non-Error throws into an Error cause before wrapping', async () => {
    const manifest: MigrationManifest = {
      1: () => {
        throw 'plain-string-throw'
      }
    }
    const migrate = createInstrumentedMigrate(manifest, { debug: false })

    await expect(migrate(baseState(0), 1)).rejects.toBeInstanceOf(
      SchemaMigrationError
    )

    const failure = useSchemaMigrationFailure.getState()
    expect(failure?.cause).toBeInstanceOf(Error)
    expect((failure?.cause as Error).message).toContain('plain-string-throw')
  })
})
