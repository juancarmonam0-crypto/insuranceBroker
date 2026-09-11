import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoApplication } from '../data/mock/insurly'
import type { ApplicationRecord } from '../domain/types'
import { buildAcord125Preview } from '../adapters/applications/acord125/adapter'
import { computeCompletion, computeMissingFields, applyWizardAnswer } from '../services/applicationEngine'
import { applyCustomerReviewChange, resolveRevenueConflict } from '../services/conflictEngine'
import { simulateDocumentProcessing } from '../services/documentIntake'
import { persistApplication, loadStoredApplication } from '../services/storage'
import { AppStateContext, type AppStateValue } from './AppStateContext'

const createSeedApplication = () => ({
  ...demoApplication,
  profile: {
    ...demoApplication.profile,
    documents: demoApplication.profile.documents.map((document) => ({ ...document })),
    fieldProvenance: demoApplication.profile.fieldProvenance.map((item) => ({ ...item })),
    people: demoApplication.profile.people.map((person) => ({ ...person })),
    locations: demoApplication.profile.locations.map((location) => ({ ...location })),
    vehicles: demoApplication.profile.vehicles.map((vehicle) => ({ ...vehicle })),
    lossHistory: demoApplication.profile.lossHistory.map((loss) => ({ ...loss })),
  },
  brokerNotes: [...demoApplication.brokerNotes],
  conflicts: demoApplication.conflicts.map((conflict) => ({ ...conflict, evidence: conflict.evidence.map((item) => ({ ...item })) })),
})

const normalizeApplication = (application: ApplicationRecord) => ({
  ...application,
  missingFields: computeMissingFields(application),
  completion: computeCompletion(application),
})

const buildInitialApplication = () => {
  const stored = loadStoredApplication()
  return normalizeApplication(stored ?? createSeedApplication())
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [application, setApplication] = useState<ApplicationRecord>(buildInitialApplication)

  useEffect(() => {
    persistApplication(application)
  }, [application])

  const value = useMemo<AppStateValue>(
    () => ({
      application,
      acordPreview: buildAcord125Preview(application),
      processDocuments: () => setApplication((current) => simulateDocumentProcessing(current)),
      answerWizardQuestion: (field, value) => setApplication((current) => applyWizardAnswer(current, field, value)),
      resetDemo: () => setApplication(normalizeApplication(createSeedApplication())),
      confirmCustomerReview: () =>
        setApplication((current) => ({
          ...current,
          customerConfirmed: true,
          status: current.conflicts.length > 0 ? 'broker_review' : current.status,
        })),
      confirmRevenueChange: () =>
        setApplication((current) => applyCustomerReviewChange(current, 'business.annualRevenue', 150000)),
      resolveConflict: (action) => setApplication((current) => resolveRevenueConflict(current, action)),
      markBrokerVerified: () =>
        setApplication((current) => ({
          ...current,
          brokerVerified: true,
          status: current.conflicts.every((conflict) => conflict.status === 'resolved') && current.missingFields.length === 0
            ? 'ready_to_submit'
            : current.status,
          brokerNotes: [...current.brokerNotes, 'Broker marked the application verified for submission preparation.'],
        })),
      markGenerated: () =>
        setApplication((current) => ({
          ...current,
          status: current.status === 'ready_to_submit' ? 'submitted' : current.status,
          generatedAt: new Date().toISOString(),
        })),
    }),
    [application],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
