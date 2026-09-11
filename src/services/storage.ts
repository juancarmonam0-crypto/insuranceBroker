import { localStoragePersistence, type PersistencePort } from '../adapters/persistence/localStoragePersistence'

const persistence: PersistencePort = localStoragePersistence

export const loadStoredApplication = () => persistence.load()

export const persistApplication = (application: Parameters<PersistencePort['save']>[0]) => persistence.save(application)
