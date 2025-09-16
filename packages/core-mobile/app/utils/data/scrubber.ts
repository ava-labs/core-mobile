const SECRET_MASK = '***'

const SECRET_REGEXPS = [
  new RegExp('(auth=)([a-zA-Z0-9._-]+)', 'gi') // captures auth=eyJhbGci.Oi_JF-ZERTQSIs
]

export const scrub = (raw: string): string => {
  let scrubbed = raw

  for (const regex of SECRET_REGEXPS) {
    scrubbed = scrubbed.replace(regex, `$1${SECRET_MASK}`)
  }

  return scrubbed
}
