export type ApplicationStatus =
  | 'draft'
  | 'collecting_information'
  | 'customer_review'
  | 'broker_review'
  | 'ready_to_submit'
  | 'submitted'
  | 'quoted'
  | 'bound'
  | 'declined'
  | 'closed'

export type SourceType =
  | 'customer_answer'
  | 'chatgpt'
  | 'document_ai'
  | 'broker'
  | 'carrier'
  | 'existing_profile'

export type DocumentStatus =
  | 'uploading'
  | 'processing'
  | 'extracting'
  | 'review_required'
  | 'complete'

export type ConflictStatus = 'open' | 'clarification_requested' | 'resolved'

export type ChannelType = 'chatgpt' | 'document_upload' | 'smart_wizard'

export type FieldValue = string | number | boolean | string[]

export interface AgencyConfig {
  id: string
  name: string
  logoText: string
  primaryColor: string
  primaryTint: string
  contactEmail: string
  phone: string
  customDomain: string
}

export interface BusinessProfile {
  agency_id: string
  legalName: string
  dba?: string
  entityType: string
  stateOfFormation: string
  annualRevenue: number
  naicsCode: string
  employeeCount: number
  yearsInBusiness?: number
  fein?: string
  description: string
}

export interface PersonProfile {
  agency_id: string
  id: string
  fullName: string
  role: string
  email: string
  phone: string
}

export interface LocationProfile {
  agency_id: string
  id: string
  label: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  occupancy: string
}

export interface VehicleProfile {
  agency_id: string
  id: string
  year: number
  make: string
  model: string
  vin: string
  usage: string
}

export interface PolicyProfile {
  agency_id: string
  carrierName: string
  effectiveDate?: string
  expirationDate: string
  limits: string
  premium: number
}

export interface LossRecord {
  agency_id: string
  id: string
  date: string
  description: string
  amount: number
  status: string
}

export interface DocumentRecord {
  agency_id: string
  id: string
  application_id: string
  type: string
  fileName: string
  status: DocumentStatus
  uploadedAt: string
}

export interface FieldProvenance {
  id: string
  agency_id: string
  application_id: string
  canonical_field: string
  label: string
  value: FieldValue
  source_type: SourceType
  source_document?: string
  source_page?: number
  confidence?: number
  customer_confirmed: boolean
  broker_verified: boolean
  updated_at: string
}

export interface ConflictRecord {
  id: string
  agency_id: string
  application_id: string
  canonical_field: string
  label: string
  status: ConflictStatus
  message: string
  customerValue: FieldValue
  evidence: FieldProvenance[]
}

export interface CanonicalProfile {
  agency_id: string
  customer_id: string
  application_id: string
  preferredChannel: ChannelType
  business: BusinessProfile
  people: PersonProfile[]
  locations: LocationProfile[]
  vehicles: VehicleProfile[]
  currentInsurance: PolicyProfile
  lossHistory: LossRecord[]
  documents: DocumentRecord[]
  fieldProvenance: FieldProvenance[]
}

export interface ApplicationRecord {
  agency_id: string
  id: string
  customerName: string
  lineOfBusiness: string
  status: ApplicationStatus
  completion: number
  profile: CanonicalProfile
  missingFields: string[]
  conflicts: ConflictRecord[]
  customerConfirmed: boolean
  brokerVerified: boolean
  brokerNotes: string[]
  generatedAt?: string
}

export interface WizardQuestionOption {
  label: string
  value: string
}

export interface WizardQuestion {
  id: string
  canonicalField: string
  label: string
  helperText: string
  section: string
  type:
    | 'text'
    | 'number'
    | 'currency'
    | 'date'
    | 'boolean'
    | 'select'
    | 'multi-select'
    | 'address'
    | 'person'
    | 'vehicle'
    | 'file_upload'
  options?: WizardQuestionOption[]
  required?: boolean
}

export interface MappingRow {
  acordField: string
  canonicalField: string
  value: string
  status: 'mapped' | 'missing' | 'review_required'
  note: string
}

export interface BrokerMetric {
  label: string
  count: number
}
