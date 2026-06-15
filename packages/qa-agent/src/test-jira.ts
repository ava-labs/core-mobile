import 'dotenv/config'
import { createFailureTicket } from './tools/jira'

async function main() {
  console.log('🧪 Testing Jira ticket creation...')

  const result = await createFailureTicket({
    specTitle: '[Smoke] Stake on Testnet',
    specFile: 'specs/transactions/cChain/stakeTestnet.spec.ts',
    failedTests: [
      {
        name: 'should stake your AVAX',
        errorLog: 'Error: Element not found: ~stakeButton\n  at stakeTestnet.spec.ts:11',
      },
      {
        name: 'should claim your stake rewards',
        errorLog: 'Error: Timeout waiting for element: ~claimButton (20000ms)\n  at stakeTestnet.spec.ts:15',
      },
    ],
    buildUrl: 'https://app.bitrise.io/build/test-build-123',
  })

  if (result.skipped) {
    console.log(`⚠️  Open ticket already exists: ${result.ticketUrl}`)
  } else {
    console.log(`✅ Ticket created: ${result.ticketUrl}`)
  }
}

main().catch(e => {
  console.error('❌ Failed:', e.message)
  process.exit(1)
})
