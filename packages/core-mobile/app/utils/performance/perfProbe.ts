/* eslint-disable sonarjs/cognitive-complexity, @typescript-eslint/no-explicit-any, max-params -- CP-14918 TEMP PROBE file, NOT FOR MERGE */
/**
 * TEMPORARY perf instrumentation for CP-14918. NOT FOR MERGE.
 *
 * Emits two kinds of records to logcat (visible under the ReactNativeJS tag):
 *   PERFMARK <name> <ms>              one-shot timestamps, for wall-clock spans
 *   PERFPROBE <bucket>=<n>x/<total>ms rolling 2s aggregates, for repeated work
 *
 * Kept in one file with tiny call sites so the identical probe can be applied
 * to both the baseline and the fixed build (apples-to-apples measurement).
 */

type Bucket = { n: number; ms: number }

const buckets: Record<string, Bucket> = {}
let timer: ReturnType<typeof setInterval> | undefined

const now = (): number => (global as any).performance?.now?.() ?? Date.now()

const flush = (): void => {
  const keys = Object.keys(buckets).filter(k => (buckets[k]?.n ?? 0) > 0)
  if (keys.length === 0) return

  const parts = keys.map(k => {
    const b = buckets[k] as Bucket
    return `${k}=${b.n}x/${b.ms.toFixed(1)}ms`
  })
  // eslint-disable-next-line no-console
  console.log(`PERFPROBE ${parts.join(' ')}`)

  keys.forEach(k => {
    buckets[k] = { n: 0, ms: 0 }
  })
}

export const perfCount = (name: string, ms: number): void => {
  const b = buckets[name] ?? { n: 0, ms: 0 }
  b.n += 1
  b.ms += ms
  buckets[name] = b

  if (!timer) {
    // CP-14918 TEMP PROBE: 500ms (was 2000) so PERFPROBE lines form a
    // sub-second timeline across the ~5s forward-nav window.
    timer = setInterval(flush, 500)
  }
}

/** Time a synchronous block and accumulate it under `name`. */
export const perfTime = <T>(name: string, fn: () => T): T => {
  const t0 = now()
  const result = fn()
  perfCount(name, now() - t0)
  return result
}

/** Current high-resolution timestamp, for callers timing their own spans. */
export const perfNow = (): number => now()

/**
 * One-shot inventory of the react-query cache: every query key with the real
 * serialized byte count of its data, largest first.
 *
 * Answers "is some endpoint handing us a ton of data" directly, which neither
 * the render-count probes nor the React.Profiler boundaries can see — parsing
 * and transforming a response happens outside React's render phase.
 *
 * `JSON.stringify` on a multi-MB payload blocks for a while. That is acceptable
 * for a one-shot temp probe and is the price of a real byte count instead of a
 * guess, but it is also why this must never ship.
 */

export const perfDumpQueryCache = (queryClient: any): void => {
  try {
    const queries = queryClient.getQueryCache().getAll()
    const rows = queries.map((q: any) => {
      const data = q.state?.data
      let bytes = -1
      try {
        bytes = data === undefined ? 0 : JSON.stringify(data).length
      } catch {
        bytes = -1 // circular or non-serialisable
      }
      const count = Array.isArray(data)
        ? data.length
        : data && typeof data === 'object'
        ? Object.keys(data).length
        : 0
      return { key: JSON.stringify(q.queryKey).slice(0, 90), bytes, count }
    })

    rows.sort((a: any, b: any) => b.bytes - a.bytes)
    const total = rows.reduce(
      (sum: number, r: any) => sum + Math.max(0, r.bytes),
      0
    )

    // eslint-disable-next-line no-console
    console.log(
      `PERFCACHE total=${(total / 1024 / 1024).toFixed(2)}MB queries=${
        rows.length
      }`
    )
    rows.slice(0, 15).forEach((r: any) => {
      // eslint-disable-next-line no-console
      console.log(
        `PERFCACHE ${(r.bytes / 1024).toFixed(0)}KB entries=${r.count} ${r.key}`
      )
    })

    // Hermes JS heap, which ART's logcat GC lines never show.

    const hermes = (global as any).HermesInternal
    const stats = hermes?.getInstrumentedStats?.()
    if (stats) {
      const mb = (n: number): string => (n / 1024 / 1024).toFixed(1)
      // eslint-disable-next-line no-console
      console.log(
        `PERFHEAP allocated=${mb(stats.js_allocatedBytes ?? 0)}MB heapSize=${mb(
          stats.js_heapSize ?? 0
        )}MB va=${mb(stats.js_va ?? 0)}MB gcCount=${
          stats.js_numGCs ?? '?'
        } gcCpuMs=${stats.js_gcCPUTime ?? '?'} gcWallMs=${
          stats.js_gcTime ?? '?'
        }`
      )
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`PERFCACHE failed ${String(e)}`)
  }
}

/** Emit a one-shot timestamp for wall-clock span measurement. */
export const perfMark = (name: string): void => {
  // eslint-disable-next-line no-console
  console.log(`PERFMARK ${name} ${now().toFixed(1)}`)
}

/**
 * Render attribution: report which of a component's inputs changed identity
 * since its previous render pass.
 *
 * Emits `PERFWHY <name> #<pass> <changedKeys|NOTHING|MOUNT> <ms>`.
 *
 * `NOTHING` is the interesting case: the component body ran again even though
 * every value it consumes is identical, which means a subscription inside one
 * of its hooks notified without producing a different output.
 *
 * Deliberately NOT a hook and deliberately NOT using useRef: reading or
 * writing a ref during render is a React Compiler rule violation that makes
 * the compiler bail out on the whole component, which would change the render
 * behaviour we are trying to measure. Previous-value state is kept module-level
 * instead, which is safe because only one instance of a given `name` is mounted
 * at a time. Same reason `perfMark` is a plain call.
 */
const whyPrev: Record<
  string,
  { values: Record<string, unknown>; pass: number }
> = {}

export const perfWhy = (
  name: string,
  values: Record<string, unknown>
): void => {
  const prev = whyPrev[name]
  const pass = (prev?.pass ?? 0) + 1

  let detail: string
  if (!prev) {
    detail = 'MOUNT'
  } else {
    const changed = Object.keys(values).filter(
      k => !Object.is(values[k], prev.values[k])
    )
    detail = changed.length > 0 ? changed.join(',') : 'NOTHING'
  }

  // eslint-disable-next-line no-console
  console.log(`PERFWHY ${name} #${pass} ${detail} ${now().toFixed(1)}`)

  whyPrev[name] = { values, pass }
}

/** Reset a `perfWhy` series, so pass numbers restart on the next mount. */
export const perfWhyReset = (name: string): void => {
  delete whyPrev[name]
}

/**
 * `onRender` callback for a `<React.Profiler>` boundary. Reports the JS render
 * time React actually spent on each commit of the wrapped subtree.
 *
 * This answers a different question from `perfWhy`: not "how many passes" but
 * "how many milliseconds of the tap-to-paint window is React rendering at all".
 * If the summed `actual` is small next to the wall-clock span, the bottleneck is
 * outside React (navigation, native, layout, image decode) and cutting renders
 * cannot help.
 *
 * The React DevTools profiler does not work in this app (it only ever reports
 * HighlightUpdatesOverlay), but the Profiler component API does.
 */
export const perfRenderProfile = (
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number
): void => {
  // eslint-disable-next-line no-console
  console.log(
    `PERFCOMMIT ${id} ${phase} actual=${actualDuration.toFixed(
      1
    )} base=${baseDuration.toFixed(1)} ${now().toFixed(1)}`
  )
}

/**
 * One-line Hermes heap + cumulative GC sample. Log it at two points and diff to
 * get GC cost across a window (e.g. a navigation).
 *
 * NOTE: Hermes reports `js_gcCPUTime` / `js_gcTime` in SECONDS, not ms.
 */
export const perfHeap = (label: string): void => {
  const stats = (global as any).HermesInternal?.getInstrumentedStats?.()
  if (!stats) return
  // eslint-disable-next-line no-console
  console.log(
    `PERFHEAPSAMPLE ${label} heapMB=${(
      (stats.js_heapSize ?? 0) /
      1024 /
      1024
    ).toFixed(1)} gcCount=${stats.js_numGCs ?? 0} gcWallSec=${(
      stats.js_gcTime ?? 0
    ).toFixed(4)}`
  )
}
