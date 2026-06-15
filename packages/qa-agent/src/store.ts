export type StoredMessage = {
  ts: string
  date: string
  userName: string
  text: string
  source: 'direct' | 'group'
  threadLink?: string
}

const messagesByDate = new Map<string, StoredMessage[]>()

function todayKey(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

export function addMessage(msg: Omit<StoredMessage, 'date'>): void {
  const date = todayKey()
  const list = messagesByDate.get(date) ?? []
  if (list.some(m => m.ts === msg.ts)) return // deduplicate
  list.push({ ...msg, date })
  messagesByDate.set(date, list)
  pruneOldEntries()
}

export function getTodaysMessages(): StoredMessage[] {
  return messagesByDate.get(todayKey()) ?? []
}

export function getRecentMessages(): StoredMessage[] {
  return Array.from(messagesByDate.values()).flat()
}

function pruneOldEntries(): void {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffKey = cutoff.toISOString().split('T')[0]!
  for (const key of messagesByDate.keys()) {
    if (key < cutoffKey) messagesByDate.delete(key)
  }
}
