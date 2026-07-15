import dotenv from 'dotenv'
import path from 'path'

// Must be imported before any module that reads process.env at load time.
// override: true — shell may have a stale/wrong JIRA_BASE_URL that would otherwise win.
const result = dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
})
if (result.error) {
  console.warn('[dotenv] load warning:', result.error.message)
}
