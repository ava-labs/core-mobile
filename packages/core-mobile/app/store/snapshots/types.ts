export type SnapshotTimestamp = {
  id: string
  timestamp: number
}

export type SnapshotState = {
  timestamps: {
    [key: string]: number
  }
}
