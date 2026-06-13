import { CRMState } from './types'

// Deterministic seed data so the CRM is useful the moment it loads.
const now = new Date('2026-06-13T12:00:00Z')
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()

export const seedState: CRMState = {
  projects: [
    {
      id: 'prj_aurora',
      name: 'Aurora Heights',
      location: 'Surrey, BC',
      type: 'Condo',
      description: 'A 28-storey luxury condo tower with skyline views and resort amenities.',
      totalUnits: 12,
      completion: 'Q4 2027',
      accent: 'from-indigo-500 to-violet-600',
    },
    {
      id: 'prj_maple',
      name: 'Maplewood Greens',
      location: 'Langley, BC',
      type: 'Townhouse',
      description: 'Family-friendly townhomes surrounding a central greenway and park.',
      totalUnits: 8,
      completion: 'Q2 2027',
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'prj_harbour',
      name: 'Harbour Point',
      location: 'Vancouver, BC',
      type: 'Mixed Use',
      description: 'Waterfront live-work residences with ground-floor retail.',
      totalUnits: 6,
      completion: 'Q1 2028',
      accent: 'from-sky-500 to-cyan-600',
    },
  ],

  reps: [
    { id: 'rep_sara', name: 'Sara Mitchell', email: 'sara@caizenx.com', phone: '604-555-0111', title: 'Senior Sales Advisor', commissionRate: 2.5, target: 12000000, initials: 'SM', color: 'bg-indigo-500' },
    { id: 'rep_dan', name: 'Daniel Cho', email: 'daniel@caizenx.com', phone: '604-555-0122', title: 'Sales Advisor', commissionRate: 2.0, target: 9000000, initials: 'DC', color: 'bg-emerald-500' },
    { id: 'rep_priya', name: 'Priya Nair', email: 'priya@caizenx.com', phone: '604-555-0133', title: 'Sales Advisor', commissionRate: 2.0, target: 9000000, initials: 'PN', color: 'bg-rose-500' },
  ],

  units: [
    // Aurora Heights condos
    { id: 'u_a1', projectId: 'prj_aurora', unitNumber: 'PH-2801', model: 'Penthouse A', floor: 28, beds: 3, baths: 3, sqft: 1850, price: 2250000, status: 'Sold', buyerContactId: 'c_james' },
    { id: 'u_a2', projectId: 'prj_aurora', unitNumber: '2204', model: 'Skyline B', floor: 22, beds: 2, baths: 2, sqft: 1120, price: 985000, status: 'Reserved', buyerContactId: 'c_emma' },
    { id: 'u_a3', projectId: 'prj_aurora', unitNumber: '1806', model: 'Skyline B', floor: 18, beds: 2, baths: 2, sqft: 1120, price: 925000, status: 'Held', buyerContactId: null },
    { id: 'u_a4', projectId: 'prj_aurora', unitNumber: '1502', model: 'City A', floor: 15, beds: 1, baths: 1, sqft: 720, price: 645000, status: 'Available', buyerContactId: null },
    { id: 'u_a5', projectId: 'prj_aurora', unitNumber: '1203', model: 'City A', floor: 12, beds: 1, baths: 1, sqft: 720, price: 629000, status: 'Available', buyerContactId: null },
    { id: 'u_a6', projectId: 'prj_aurora', unitNumber: '0904', model: 'Skyline B', floor: 9, beds: 2, baths: 2, sqft: 1120, price: 879000, status: 'Available', buyerContactId: null },
    // Maplewood townhouses
    { id: 'u_m1', projectId: 'prj_maple', unitNumber: 'TH-01', model: 'Birch', floor: 0, beds: 3, baths: 2.5, sqft: 1620, price: 899000, status: 'Sold', buyerContactId: 'c_olivia' },
    { id: 'u_m2', projectId: 'prj_maple', unitNumber: 'TH-04', model: 'Cedar', floor: 0, beds: 4, baths: 3, sqft: 1980, price: 1075000, status: 'Reserved', buyerContactId: 'c_noah' },
    { id: 'u_m3', projectId: 'prj_maple', unitNumber: 'TH-06', model: 'Birch', floor: 0, beds: 3, baths: 2.5, sqft: 1620, price: 879000, status: 'Available', buyerContactId: null },
    { id: 'u_m4', projectId: 'prj_maple', unitNumber: 'TH-08', model: 'Cedar', floor: 0, beds: 4, baths: 3, sqft: 1980, price: 1099000, status: 'Available', buyerContactId: null },
    // Harbour Point
    { id: 'u_h1', projectId: 'prj_harbour', unitNumber: 'LW-101', model: 'Live/Work', floor: 1, beds: 2, baths: 2, sqft: 1400, price: 1450000, status: 'Available', buyerContactId: null },
    { id: 'u_h2', projectId: 'prj_harbour', unitNumber: 'LW-205', model: 'Residence', floor: 2, beds: 2, baths: 2, sqft: 1250, price: 1320000, status: 'Available', buyerContactId: null },
  ],

  contacts: [
    {
      id: 'c_james', leadId: 'l_old1', name: 'James Patterson', email: 'james.patterson@gmail.com', phone: '778-555-2201',
      address: '4521 Oak St, Vancouver, BC', stage: 'Owner', assignedTo: 'rep_sara', projectId: 'prj_aurora',
      createdAt: daysAgo(85),
      activities: [
        { id: 'act1', type: 'System', body: 'Converted from lead', by: 'System', at: daysAgo(85) },
        { id: 'act2', type: 'Meeting', body: 'Closed penthouse PH-2801. Contract executed.', by: 'Sara Mitchell', at: daysAgo(60) },
      ],
      documents: [
        { id: 'd1', name: 'Purchase Agreement - PH2801.pdf', kind: 'Contract', uploadedAt: daysAgo(60), status: 'Signed' },
        { id: 'd2', name: 'Government ID.pdf', kind: 'ID', uploadedAt: daysAgo(62), status: 'Received' },
      ],
    },
    {
      id: 'c_emma', leadId: 'l_old2', name: 'Emma Rodriguez', email: 'emma.r@outlook.com', phone: '604-555-2244',
      address: '88 River Rd, Richmond, BC', stage: 'Buyer', assignedTo: 'rep_dan', projectId: 'prj_aurora',
      createdAt: daysAgo(40),
      activities: [
        { id: 'act3', type: 'Call', body: 'Discussed financing options for unit 2204.', by: 'Daniel Cho', at: daysAgo(12) },
        { id: 'act4', type: 'Email', body: 'Sent contract for review.', by: 'Daniel Cho', at: daysAgo(8) },
      ],
      documents: [
        { id: 'd3', name: 'Reservation Agreement - 2204.pdf', kind: 'Contract', uploadedAt: daysAgo(8), status: 'Pending' },
      ],
    },
    {
      id: 'c_olivia', leadId: 'l_old3', name: 'Olivia Bennett', email: 'olivia.bennett@gmail.com', phone: '778-555-2255',
      address: '12 Greenway Cres, Langley, BC', stage: 'Owner', assignedTo: 'rep_priya', projectId: 'prj_maple',
      createdAt: daysAgo(120),
      activities: [
        { id: 'act5', type: 'Meeting', body: 'Finalized TH-01 purchase.', by: 'Priya Nair', at: daysAgo(95) },
      ],
      documents: [
        { id: 'd4', name: 'Purchase Agreement - TH01.pdf', kind: 'Contract', uploadedAt: daysAgo(95), status: 'Signed' },
      ],
    },
    {
      id: 'c_noah', leadId: 'l_old4', name: 'Noah Williams', email: 'noah.w@gmail.com', phone: '604-555-2266',
      address: '300 Park Ave, Langley, BC', stage: 'Buyer', assignedTo: 'rep_priya', projectId: 'prj_maple',
      createdAt: daysAgo(25),
      activities: [
        { id: 'act6', type: 'Note', body: 'Requested upgrade package for TH-04.', by: 'Priya Nair', at: daysAgo(5) },
      ],
      documents: [],
    },
  ],

  leads: [
    {
      id: 'l1', name: 'Michael Tran', email: 'michael.tran@gmail.com', phone: '604-555-3301', source: 'Facebook',
      status: 'New', score: 72, projectId: 'prj_aurora', budget: 950000, assignedTo: 'rep_sara', notes: 'Interested in 2-bed units, downsizing.',
      createdAt: daysAgo(2), lastActivity: daysAgo(2),
      activities: [{ id: 'la1', type: 'System', body: 'Lead created from Facebook campaign.', by: 'System', at: daysAgo(2) }],
    },
    {
      id: 'l2', name: 'Sophia Lee', email: 'sophia.lee@outlook.com', phone: '778-555-3312', source: 'Website',
      status: 'Contacted', score: 64, projectId: 'prj_maple', budget: 1050000, assignedTo: 'rep_priya', notes: 'Family of 4, wants Cedar model.',
      createdAt: daysAgo(6), lastActivity: daysAgo(1),
      activities: [
        { id: 'la2', type: 'System', body: 'Lead created from website inquiry.', by: 'System', at: daysAgo(6) },
        { id: 'la3', type: 'Call', body: 'Left voicemail, sent intro email.', by: 'Priya Nair', at: daysAgo(1) },
      ],
    },
    {
      id: 'l3', name: 'William Foster', email: 'wfoster@gmail.com', phone: '604-555-3323', source: 'Referral',
      status: 'Qualified', score: 88, projectId: 'prj_harbour', budget: 1500000, assignedTo: 'rep_dan', notes: 'Pre-approved, ready to buy waterfront.',
      createdAt: daysAgo(10), lastActivity: daysAgo(3),
      activities: [
        { id: 'la4', type: 'Meeting', body: 'Toured Harbour Point show suite. Very interested.', by: 'Daniel Cho', at: daysAgo(3) },
      ],
    },
    {
      id: 'l4', name: 'Ava Martinez', email: 'ava.m@gmail.com', phone: '778-555-3334', source: 'Instagram',
      status: 'Nurturing', score: 45, projectId: 'prj_aurora', budget: 650000, assignedTo: 'rep_sara', notes: 'First-time buyer, needs more time.',
      createdAt: daysAgo(18), lastActivity: daysAgo(7),
      activities: [
        { id: 'la5', type: 'Email', body: 'Sent financing guide and incentive sheet.', by: 'Sara Mitchell', at: daysAgo(7) },
      ],
    },
    {
      id: 'l5', name: 'Ethan Brooks', email: 'ethan.brooks@gmail.com', phone: '604-555-3345', source: 'Google Ads',
      status: 'Qualified', score: 79, projectId: 'prj_maple', budget: 920000, assignedTo: 'rep_priya', notes: 'Looking at Birch model TH-06.',
      createdAt: daysAgo(9), lastActivity: daysAgo(2),
      activities: [
        { id: 'la6', type: 'Call', body: 'Discussed deposit structure.', by: 'Priya Nair', at: daysAgo(2) },
      ],
    },
    {
      id: 'l6', name: 'Isabella Clark', email: 'bella.clark@outlook.com', phone: '778-555-3356', source: 'Realtor',
      status: 'New', score: 58, projectId: 'prj_harbour', budget: 1350000, assignedTo: null, notes: 'Realtor referral, awaiting first contact.',
      createdAt: daysAgo(1), lastActivity: daysAgo(1),
      activities: [{ id: 'la7', type: 'System', body: 'Referred by Royal LePage agent.', by: 'System', at: daysAgo(1) }],
    },
    {
      id: 'l7', name: 'Lucas Nguyen', email: 'lucas.n@gmail.com', phone: '604-555-3367', source: 'Event',
      status: 'Lost', score: 30, projectId: 'prj_aurora', budget: 600000, assignedTo: 'rep_dan', notes: 'Bought elsewhere - budget mismatch.',
      createdAt: daysAgo(35), lastActivity: daysAgo(20),
      activities: [
        { id: 'la8', type: 'Note', body: 'Decided to purchase resale property.', by: 'Daniel Cho', at: daysAgo(20) },
      ],
    },
    {
      id: 'l8', name: 'Mia Thompson', email: 'mia.t@gmail.com', phone: '778-555-3378', source: 'Walk-in',
      status: 'Contacted', score: 67, projectId: 'prj_aurora', budget: 880000, assignedTo: 'rep_sara', notes: 'Walked into sales centre, likes Skyline B.',
      createdAt: daysAgo(4), lastActivity: daysAgo(2),
      activities: [
        { id: 'la9', type: 'Meeting', body: 'Show suite tour completed.', by: 'Sara Mitchell', at: daysAgo(2) },
      ],
    },
  ],

  contracts: [
    {
      id: 'k_james', contactId: 'c_james', unitId: 'u_a1', projectId: 'prj_aurora', amount: 2250000, deposit: 337500,
      status: 'Executed', createdAt: daysAgo(63), sentAt: daysAgo(62), signedAt: daysAgo(60), signature: 'James Patterson', salesRepId: 'rep_sara',
    },
    {
      id: 'k_olivia', contactId: 'c_olivia', unitId: 'u_m1', projectId: 'prj_maple', amount: 899000, deposit: 134850,
      status: 'Executed', createdAt: daysAgo(97), sentAt: daysAgo(96), signedAt: daysAgo(95), signature: 'Olivia Bennett', salesRepId: 'rep_priya',
    },
    {
      id: 'k_emma', contactId: 'c_emma', unitId: 'u_a2', projectId: 'prj_aurora', amount: 985000, deposit: 147750,
      status: 'Sent', createdAt: daysAgo(8), sentAt: daysAgo(8), signedAt: null, signature: null, salesRepId: 'rep_dan',
    },
    {
      id: 'k_noah', contactId: 'c_noah', unitId: 'u_m2', projectId: 'prj_maple', amount: 1075000, deposit: 161250,
      status: 'Draft', createdAt: daysAgo(3), sentAt: null, signedAt: null, signature: null, salesRepId: 'rep_priya',
    },
  ],

  commissions: [
    { id: 'cm1', salesRepId: 'rep_sara', contractId: 'k_james', saleAmount: 2250000, rate: 2.5, amount: 56250, status: 'Paid', createdAt: daysAgo(60) },
    { id: 'cm2', salesRepId: 'rep_priya', contractId: 'k_olivia', saleAmount: 899000, rate: 2.0, amount: 17980, status: 'Paid', createdAt: daysAgo(95) },
    { id: 'cm3', salesRepId: 'rep_dan', contractId: 'k_emma', saleAmount: 985000, rate: 2.0, amount: 19700, status: 'Pending', createdAt: daysAgo(8) },
  ],

  campaigns: [
    { id: 'cp1', name: 'Aurora Launch - Social', channel: 'Instagram', projectId: 'prj_aurora', budget: 50000, spent: 38500, leadsGenerated: 142, status: 'Active', startDate: daysAgo(45), endDate: daysAgo(-15) },
    { id: 'cp2', name: 'Maplewood Family Homes', channel: 'Facebook', projectId: 'prj_maple', budget: 35000, spent: 35000, leadsGenerated: 98, status: 'Completed', startDate: daysAgo(90), endDate: daysAgo(20) },
    { id: 'cp3', name: 'Harbour Point Teaser', channel: 'Google Ads', projectId: 'prj_harbour', budget: 60000, spent: 22000, leadsGenerated: 64, status: 'Active', startDate: daysAgo(20), endDate: daysAgo(-40) },
    { id: 'cp4', name: 'Realtor Network Outreach', channel: 'Realtor Network', projectId: null, budget: 20000, spent: 12000, leadsGenerated: 31, status: 'Active', startDate: daysAgo(30), endDate: daysAgo(-30) },
    { id: 'cp5', name: 'Spring Homebuyer Email', channel: 'Email', projectId: null, budget: 5000, spent: 5000, leadsGenerated: 47, status: 'Completed', startDate: daysAgo(60), endDate: daysAgo(40) },
  ],

  changeOrders: [
    { id: 'co1', unitId: 'u_a1', contractId: 'k_james', contactId: 'c_james', title: 'Hardwood flooring upgrade', description: 'Upgrade from standard laminate to engineered hardwood throughout.', amount: 18500, status: 'Completed', createdAt: daysAgo(50), requestedBy: 'James Patterson' },
    { id: 'co2', unitId: 'u_m2', contractId: 'k_noah', contactId: 'c_noah', title: 'Kitchen island extension', description: 'Add waterfall quartz island with seating for 4.', amount: 7200, status: 'Under Review', createdAt: daysAgo(5), requestedBy: 'Noah Williams' },
    { id: 'co3', unitId: 'u_a2', contractId: 'k_emma', contactId: 'c_emma', title: 'Smart home package', description: 'Add smart thermostat, lighting and blinds automation.', amount: 4800, status: 'Requested', createdAt: daysAgo(3), requestedBy: 'Emma Rodriguez' },
  ],

  messages: [
    { id: 'm1', contactId: 'c_emma', from: 'Team', body: 'Hi Emma! Your reservation agreement for unit 2204 is ready to review in your portal.', at: daysAgo(8) },
    { id: 'm2', contactId: 'c_emma', from: 'Buyer', body: 'Thanks Daniel! Reviewing now. Quick question about the deposit schedule.', at: daysAgo(7) },
    { id: 'm3', contactId: 'c_emma', from: 'Team', body: 'Of course - 15% on signing, then 5% at 6 and 12 months. Happy to hop on a call.', at: daysAgo(7) },
    { id: 'm4', contactId: 'c_noah', from: 'Buyer', body: 'Submitted a change order for the kitchen island. When will I hear back?', at: daysAgo(5) },
    { id: 'm5', contactId: 'c_noah', from: 'Team', body: 'Got it Noah - our design team is reviewing, expect pricing within 3 business days.', at: daysAgo(4) },
  ],
}
