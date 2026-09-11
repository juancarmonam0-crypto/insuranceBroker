import type { ApplicationRecord, ConflictRecord, FieldProvenance, FieldValue } from '../domain/types'
import { computeCompletion, computeMissingFields, getFieldLabel, isReadyForBroker } from './applicationEngine'

const createConflict = (application: ApplicationRecord, field: string, value: FieldValue): ConflictRecord => ({
  id: `conflict-${field}`,
  agency_id: application.agency_id,
  application_id: application.id,
  canonical_field: field,
  label: getFieldLabel(field),
  status: 'open',
  message: 'Conflicting information detected. Broker review recommended.',
  customerValue: value,
  evidence: application.profile.fieldProvenance.filter((item) => item.canonical_field === field),
})

export const applyCustomerReviewChange = (
  application: ApplicationRecord,
  field: 'business.annualRevenue',
  value: number,
): ApplicationRecord => {
  const timestamp = new Date().toISOString()
  const existingEvidence = application.profile.fieldProvenance.filter((item) => item.canonical_field === field)
  const matching = existingEvidence.find((item) => item.value === value)

  const reviewProvenance: FieldProvenance = {
    id: `prov-review-${timestamp}`,
    agency_id: application.agency_id,
    application_id: application.id,
    canonical_field: field,
    label: getFieldLabel(field),
    value,
    source_type: 'customer_answer',
    confidence: 1,
    customer_confirmed: true,
    broker_verified: false,
    updated_at: timestamp,
  }

  const provenance = matching
    ? application.profile.fieldProvenance
    : [...application.profile.fieldProvenance, reviewProvenance]

  const next = {
    ...application,
    status: 'broker_review' as const,
    customerConfirmed: true,
    profile: {
      ...application.profile,
      business: {
        ...application.profile.business,
        annualRevenue: value,
      },
      fieldProvenance: provenance,
    },
  }

  const conflict = createConflict(next, field, value)
  return {
    ...next,
    conflicts: [conflict],
    missingFields: computeMissingFields(next),
    completion: computeCompletion(next),
  }
}

export const resolveRevenueConflict = (
  application: ApplicationRecord,
  action: 'accept_customer' | 'request_clarification' | 'correct_value',
): ApplicationRecord => {
  const timestamp = new Date().toISOString()
  let annualRevenue = application.profile.business.annualRevenue
  let note = ''
  let status: ConflictRecord['status'] = 'resolved'

  if (action === 'accept_customer') {
    note = 'Broker accepted the customer-provided annual revenue.'
  } else if (action === 'correct_value') {
    annualRevenue = 225000
    note = 'Broker corrected annual revenue to $225,000 pending final documentation.'
  } else {
    status = 'clarification_requested'
    note = 'Broker requested clarification from the customer before submission.'
  }

  const conflicts = application.conflicts.map((conflict) =>
    conflict.canonical_field === 'business.annualRevenue'
      ? { ...conflict, status, customerValue: annualRevenue }
      : conflict,
  )

  const next = {
    ...application,
    profile: {
      ...application.profile,
      business: {
        ...application.profile.business,
        annualRevenue,
      },
      fieldProvenance: application.profile.fieldProvenance.map((item) =>
        item.canonical_field === 'business.annualRevenue' && item.value === annualRevenue
          ? { ...item, broker_verified: status === 'resolved', updated_at: timestamp }
          : item,
      ),
    },
    conflicts,
    brokerNotes: [...application.brokerNotes, note],
    brokerVerified: status === 'resolved',
  }

  const derivedStatus = status === 'resolved' && isReadyForBroker(next) ? 'ready_to_submit' : 'broker_review'

  return {
    ...next,
    status: derivedStatus,
    missingFields: computeMissingFields(next),
    completion: computeCompletion(next),
  }
}
