export type SyncInfo =
    | { isEnabled: false }
    | {
          isEnabled: true
          server: string
          clientID: string
          username: string
          lastSyncedAt?: Date
      }
