import { createContext } from 'react'
import type { ApplicationRecord } from '../domain/types'
import { buildAcord125Preview } from '../adapters/applications/acord125/adapter'

export interface AppStateValue {
  application: ApplicationRecord
  acordPreview: ReturnType<typeof buildAcord125Preview>
  processDocuments: () => void
  answerWizardQuestion: (field: string, value: string | number) => void
  resetDemo: () => void
  confirmCustomerReview: () => void
  confirmRevenueChange: () => void
  resolveConflict: (action: 'accept_customer' | 'request_clarification' | 'correct_value') => void
  markBrokerVerified: () => void
  markGenerated: () => void
}

export const AppStateContext = createContext<AppStateValue | null>(null)
