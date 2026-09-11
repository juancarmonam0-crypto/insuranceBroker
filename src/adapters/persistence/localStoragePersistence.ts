import type { ApplicationRecord } from '../../domain/types'

export interface PersistencePort {
  load: () => ApplicationRecord | null
  save: (application: ApplicationRecord) => void
}

const STORAGE_KEY = 'insurly-demo-application'

export const localStoragePersistence: PersistencePort = {
  load: () => {
    if (typeof window === 'undefined') return null

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as ApplicationRecord
    } catch {
      return null
    }
  },
  save: (application) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(application))
  },
}
