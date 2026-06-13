// Core domain types for the Caizenx Real Estate CRM

export type ID = string

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Nurturing'
  | 'Converted'
  | 'Lost'

export type LeadSource =
  | 'Website'
  | 'Walk-in'
  | 'Referral'
  | 'Facebook'
  | 'Instagram'
  | 'Google Ads'
  | 'Realtor'
  | 'Event'

export interface Activity {
  id: ID
  type: 'Note' | 'Call' | 'Email' | 'Meeting' | 'SMS' | 'System'
  body: string
  by: string
  at: string // ISO date
}

export interface Lead {
  id: ID
  name: string
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  score: number // 0-100
  projectId: ID | null
  budget: number
  assignedTo: ID | null // sales rep id
  notes: string
  activities: Activity[]
  createdAt: string
  lastActivity: string
}

export type ContactStage = 'Prospect' | 'Buyer' | 'Owner' | 'Past Client'

export interface Contact {
  id: ID
  leadId: ID | null
  name: string
  email: string
  phone: string
  address: string
  stage: ContactStage
  assignedTo: ID | null
  projectId: ID | null
  activities: Activity[]
  documents: DocumentRef[]
  createdAt: string
}

export interface DocumentRef {
  id: ID
  name: string
  kind: 'Contract' | 'ID' | 'Mortgage' | 'Disclosure' | 'Change Order' | 'Other'
  uploadedAt: string
  status: 'Pending' | 'Received' | 'Signed'
}

export type ProjectType = 'Condo' | 'Townhouse' | 'Single Family' | 'Mixed Use'

export interface Project {
  id: ID
  name: string
  location: string
  type: ProjectType
  description: string
  totalUnits: number
  completion: string // expected completion
  accent: string // tailwind gradient classes
}

export type UnitStatus = 'Available' | 'Held' | 'Reserved' | 'Sold'

export interface Unit {
  id: ID
  projectId: ID
  unitNumber: string
  model: string
  floor: number
  beds: number
  baths: number
  sqft: number
  price: number
  status: UnitStatus
  buyerContactId: ID | null
}

export type ContractStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Signed'
  | 'Countersigned'
  | 'Executed'
  | 'Cancelled'

export interface Contract {
  id: ID
  contactId: ID
  unitId: ID
  projectId: ID
  amount: number
  deposit: number
  status: ContractStatus
  createdAt: string
  sentAt: string | null
  signedAt: string | null
  signature: string | null // typed signature name
  salesRepId: ID | null
}

export interface SalesRep {
  id: ID
  name: string
  email: string
  phone: string
  title: string
  commissionRate: number // percent
  target: number // annual sales target $
  initials: string
  color: string
}

export type CommissionStatus = 'Pending' | 'Approved' | 'Paid'

export interface Commission {
  id: ID
  salesRepId: ID
  contractId: ID
  saleAmount: number
  rate: number
  amount: number
  status: CommissionStatus
  createdAt: string
}

export type CampaignChannel =
  | 'Facebook'
  | 'Instagram'
  | 'Google Ads'
  | 'Email'
  | 'Billboard'
  | 'Event'
  | 'Realtor Network'

export interface Campaign {
  id: ID
  name: string
  channel: CampaignChannel
  projectId: ID | null
  budget: number
  spent: number
  leadsGenerated: number
  status: 'Planned' | 'Active' | 'Paused' | 'Completed'
  startDate: string
  endDate: string
}

export type ChangeOrderStatus =
  | 'Requested'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Completed'

export interface ChangeOrder {
  id: ID
  unitId: ID
  contractId: ID | null
  contactId: ID
  title: string
  description: string
  amount: number // cost delta
  status: ChangeOrderStatus
  createdAt: string
  requestedBy: string
}

export interface PortalMessage {
  id: ID
  contactId: ID
  from: 'Buyer' | 'Team'
  body: string
  at: string
}

export interface CRMState {
  leads: Lead[]
  contacts: Contact[]
  projects: Project[]
  units: Unit[]
  contracts: Contract[]
  reps: SalesRep[]
  commissions: Commission[]
  campaigns: Campaign[]
  changeOrders: ChangeOrder[]
  messages: PortalMessage[]
}
