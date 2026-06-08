import 'dotenv/config'
import { App } from '@slack/bolt'
import { runAgent } from './agent'

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
})

// Respond to direct mentions: @mobile-qai <message>
app.event('app_mention', async ({ event, say }) => {
  const userMessage = (event as { text: string }).text.replace(/<@[^>]+>/g, '').trim()

  await say(`잠깐만요, 확인할게요... 🔍`)

  try {
    const response = await runAgent(userMessage)
    await say(response)
  } catch (err) {
    console.error(err)
    await say(`오류가 발생했어요. 다시 시도해주세요.`)
  }
})

// Respond to direct messages
app.message(async ({ message, say }) => {
  if (message.subtype) return

  const userMessage = (message as { text: string }).text?.trim()
  if (!userMessage) return

  await say(`잠깐만요, 확인할게요... 🔍`)

  try {
    const response = await runAgent(userMessage)
    await say(response)
  } catch (err) {
    console.error(err)
    await say(`오류가 발생했어요. 다시 시도해주세요.`)
  }
})

;(async () => {
  await app.start()
  console.log('⚡ mobile-qai is running!')
})()
