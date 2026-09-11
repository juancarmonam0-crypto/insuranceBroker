import type { ApplicationRecord } from '../domain/types'
import { computeCompletion, computeMissingFields } from './applicationEngine'

export const simulateDocumentProcessing = (application: ApplicationRecord): ApplicationRecord => {
  const timestamp = new Date().toISOString()

  const documents = application.profile.documents.map((document) => {
    if (document.type === 'Current Policy') {
      return { ...document, status: 'complete' as const }
    }

    return document
  })

  const next = {
    ...application,
    status: 'collecting_information' as const,
    profile: {
      ...application.profile,
      preferredChannel: 'document_upload' as const,
      documents,
      fieldProvenance: application.profile.fieldProvenance.map((item) =>
        item.source_document === 'CurrentPolicy.pdf'
          ? { ...item, customer_confirmed: false, updated_at: timestamp }
          : item,
      ),
    },
  }

  return {
    ...next,
    completion: computeCompletion(next),
    missingFields: computeMissingFields(next),
  }
}
