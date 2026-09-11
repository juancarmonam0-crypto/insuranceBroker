import { createContext } from 'react'
import type { ApplicationRecord, ConflictResolutionType, FieldValue, ReadinessResult } from '../domain/types'
import { buildAcord125Preview } from '../adapters/applications/acord125/adapter'

export interface AppStateValue {
  application: ApplicationRecord
  acordPreview: ReturnType<typeof buildAcord125Preview>
  readiness: ReadinessResult
  processDocuments: () => void
  answerWizardQuestion: (field: string, value: string | number) => void
  resetDemo: () => void
  confirmCustomerReview: () => void
  confirmRevenueChange: () => void
  resolveConflict: (conflictId: string, action: ConflictResolutionType, correctedValue?: FieldValue) => void
  markBrokerVerified: () => void
  markGenerated: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)
