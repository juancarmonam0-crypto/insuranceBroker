import type { ApplicationRecord, FieldProvenance, FieldValue, WizardQuestion } from '../domain/types'
import { wizardCatalog } from '../data/mock/insurly'

const REQUIRED_FIELDS = ['business.legalName', 'business.annualRevenue', 'business.naicsCode', 'business.employeeCount', 'business.yearsInBusiness', 'business.fein', 'currentInsurance.effectiveDate']

const fieldLabels: Record<string, string> = {
  'business.legalName': 'Legal name',
  'business.annualRevenue': 'Annual revenue',
  'business.naicsCode': 'NAICS code',
  'business.employeeCount': 'Employees',
  'business.yearsInBusiness': 'Years in business',
  'business.fein': 'FEIN',
  'currentInsurance.effectiveDate': 'Desired effective date',
}

export const getFieldLabel = (field: string) => fieldLabels[field] ?? field

const readValue = (application: ApplicationRecord, field: string): unknown => {
  if (field === 'business.yearsInBusiness') return application.profile.business.yearsInBusiness
  if (field === 'business.fein') return application.profile.business.fein
  if (field === 'business.coverageGoal') {
    return application.profile.fieldProvenance.find((item) => item.canonical_field === field)?.value
  }
  if (field === 'currentInsurance.effectiveDate') return application.profile.currentInsurance.effectiveDate
  if (field === 'business.legalName') return application.profile.business.legalName
  if (field === 'business.annualRevenue') return application.profile.business.annualRevenue
  if (field === 'business.naicsCode') return application.profile.business.naicsCode
  if (field === 'business.employeeCount') return application.profile.business.employeeCount

  return undefined
}

const writeValue = (application: ApplicationRecord, field: string, value: FieldValue): ApplicationRecord => {
  if (field === 'business.yearsInBusiness' && typeof value === 'number') {
    return { ...application, profile: { ...application.profile, business: { ...application.profile.business, yearsInBusiness: value } } }
  }

  if (field === 'business.fein' && typeof value === 'string') {
    return { ...application, profile: { ...application.profile, business: { ...application.profile.business, fein: value } } }
  }

  if (field === 'currentInsurance.effectiveDate' && typeof value === 'string') {
    return {
      ...application,
      profile: {
        ...application.profile,
        currentInsurance: { ...application.profile.currentInsurance, effectiveDate: value },
      },
    }
  }

  return application
}

export const computeMissingFields = (application: ApplicationRecord) =>
  REQUIRED_FIELDS.filter((field) => {
    const value = readValue(application, field)
    return value === undefined || value === ''
  })

export const computeCompletion = (application: ApplicationRecord) => {
  const completed = REQUIRED_FIELDS.filter((field) => {
    const value = readValue(application, field)
    return value !== undefined && value !== ''
  }).length

  return Math.min(96, 68 + completed * 4)
}

export const getWizardQuestions = (application: ApplicationRecord): WizardQuestion[] => {
  const missing = new Set(computeMissingFields(application))
  return wizardCatalog.filter((question) => missing.has(question.canonicalField))
}

export const applyWizardAnswer = (
  application: ApplicationRecord,
  field: string,
  value: FieldValue,
): ApplicationRecord => {
  const updated = writeValue(application, field, value)
  const timestamp = new Date().toISOString()
  const filteredProvenance = updated.profile.fieldProvenance.filter(
    (item) => !(item.canonical_field === field && item.source_type === 'customer_answer'),
  )

  const customerProvenance: FieldProvenance = {
    id: `prov-${field}-${timestamp}`,
    agency_id: updated.agency_id,
    application_id: updated.id,
    canonical_field: field,
    label: getFieldLabel(field),
    value,
    source_type: 'customer_answer',
    confidence: 1,
    customer_confirmed: false,
    broker_verified: false,
    updated_at: timestamp,
  }

  const next = {
    ...updated,
    profile: {
      ...updated.profile,
      fieldProvenance: [...filteredProvenance, customerProvenance],
    },
  }

  const missingFields = computeMissingFields(next)
  const completion = computeCompletion(next)

  return {
    ...next,
    missingFields,
    completion,
    status: missingFields.length === 0 ? 'customer_review' : 'collecting_information',
  }
}

export const isReadyForBroker = (application: ApplicationRecord) =>
  application.missingFields.length === 0 && application.conflicts.every((conflict) => conflict.status === 'resolved')
