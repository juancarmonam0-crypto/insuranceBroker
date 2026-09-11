import type { ApplicationRecord } from '../domain/types'

const STORAGE_KEY = 'insurly-demo-application'

export const loadStoredApplication = () => {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as ApplicationRecord
  } catch {
    return null
  }
}

export const persistApplication = (application: ApplicationRecord) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(application))
}
