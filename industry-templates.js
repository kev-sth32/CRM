/**
 * Industry Templates Engine for SalesOS CRM
 * Provides configuration-driven schemas for vertical-specific pipelines,
 * custom fields, qualification rules, and AI personas.
 * Complies with PRD Sections 3, 47, and 58.
 */

const INDUSTRY_TEMPLATES = {
  'saas': {
    id: 'saas',
    name: 'SaaS & Cloud Software',
    description: 'Designed for subscription businesses, recurring MRR, trial conversions, and product-led sales.',
    icon: '💻',
    currency: 'USD',
    pipeline_stages: [
      'New lead',
      'Discovery',
      'Demo Scheduled',
      'Trial Active',
      'Proposal & Security Review',
      'Negotiation',
      'Closed Won',
      'Closed Lost'
    ],
    custom_fields: [
      { entity: 'deals', label: 'Contract Term (Months)', field_name: 'contract_term_months', type: 'number', required: false },
      { entity: 'deals', label: 'Expected MRR', field_name: 'expected_mrr', type: 'number', required: true },
      { entity: 'deals', label: 'Current Tech Stack', field_name: 'current_tech_stack', type: 'text', required: false },
      { entity: 'leads', label: 'User Seat Count', field_name: 'seat_count', type: 'number', required: false }
    ],
    ai_persona: {
      name: 'SalesOS Tech Advisor',
      tone: 'consultative, data-driven, and technical',
      language: 'English',
      formality: 'professional',
      qualification_focus: 'Software fit, user seats, budget authorization, and security compliance',
      forbidden_topics: ['unreleased roadmap features', 'custom code promises', 'unauthorized enterprise discounts']
    },
    sample_products: [
      { name: 'Starter Tier (Annual)', sku: 'SAAS-START-YR', category: 'Software', price: 34800, description: 'Up to 5 users, core CRM and pipeline features' },
      { name: 'Growth Tier (Annual)', sku: 'SAAS-GROW-YR', category: 'Software', price: 94800, description: 'Up to 20 users, AI copilot and omnichannel messaging' },
      { name: 'Enterprise Platform', sku: 'SAAS-ENT-YR', category: 'Software', price: 298000, description: 'Unlimited users, dedicated AI sales agents, custom SLAs' }
    ]
  },

  'real_estate': {
    id: 'real_estate',
    name: 'Real Estate & Property Development',
    description: 'Optimized for property inquiries, project viewings, site visit coordination, and token booking.',
    icon: '🏢',
    currency: 'NPR',
    pipeline_stages: [
      'New Inquiry',
      'Property Matching',
      'Site Visit Scheduled',
      'Site Visit Completed',
      'Price Negotiation & Terms',
      'Token & Booking Paid',
      'Closed Won',
      'Closed Lost'
    ],
    custom_fields: [
      { entity: 'deals', label: 'Property Type', field_name: 'property_type', type: 'text', required: true },
      { entity: 'deals', label: 'Preferred Location', field_name: 'preferred_location', type: 'text', required: true },
      { entity: 'deals', label: 'Target Budget (NPR)', field_name: 'target_budget', type: 'number', required: false },
      { entity: 'leads', label: 'Possession Timeline', field_name: 'possession_timeline', type: 'text', required: false }
    ],
    ai_persona: {
      name: 'Property Concierge',
      tone: 'warm, welcoming, and knowledgeable',
      language: 'English, Nepali',
      formality: 'respectful',
      qualification_focus: 'Location preference, unit size, budget, and site-visit availability',
      forbidden_topics: ['unapproved property discounts', 'guaranteed capital returns', 'unverified possession dates']
    },
    sample_products: [
      { name: 'Skyline Heights 2BHK Luxury Unit', sku: 'PROP-2BHK-01', category: 'Residential', price: 18500000, description: '1,250 sq.ft luxury apartment with balcony and dedicated parking' },
      { name: 'Skyline Heights 3BHK Penthouse', sku: 'PROP-3BHK-02', category: 'Residential', price: 32000000, description: '2,100 sq.ft penthouse with private rooftop terrace' },
      { name: 'Commercial Retail Space (Ground Floor)', sku: 'PROP-COMM-01', category: 'Commercial', price: 25000000, description: '850 sq.ft prime commercial frontage' }
    ]
  },

  'education': {
    id: 'education',
    name: 'Education & Study Abroad Consultancy',
    description: 'Designed for universities, colleges, and study abroad agencies tracking student admissions and visas.',
    icon: '🎓',
    currency: 'NPR',
    pipeline_stages: [
      'New Inquiry',
      'Academic Counseling',
      'University & Course Selection',
      'Application Submitted',
      'Offer Letter Received',
      'Visa Processing & Interview',
      'Enrolled & Departed',
      'Dropped / Rejected'
    ],
    custom_fields: [
      { entity: 'deals', label: 'Target Destination Country', field_name: 'target_country', type: 'text', required: true },
      { entity: 'deals', label: 'Desired Program Level', field_name: 'program_level', type: 'text', required: true },
      { entity: 'leads', label: 'English Test Score (IELTS/PTE)', field_name: 'test_score', type: 'text', required: false },
      { entity: 'leads', label: 'Target Intake Season', field_name: 'intake_season', type: 'text', required: false }
    ],
    ai_persona: {
      name: 'Admissions Advisor',
      tone: 'encouraging, guiding, and informative',
      language: 'English, Nepali',
      formality: 'supportive',
      qualification_focus: 'Academic background, English proficiency, target intake, and budget',
      forbidden_topics: ['visa approval guarantees', 'fake documentation', 'unauthorized scholarship promises']
    },
    sample_products: [
      { name: 'Comprehensive Australia Study Abroad Package', sku: 'EDU-AUS-PKG', category: 'Admissions', price: 35000, description: 'University shortlisting, SOP review, application filing & visa mock interviews' },
      { name: 'UK Russell Group Direct Application Package', sku: 'EDU-UK-PKG', category: 'Admissions', price: 30000, description: 'Application processing for up to 3 UK universities' },
      { name: 'IELTS / PTE Academic Masterclass', sku: 'EDU-TEST-PREP', category: 'Training', price: 12000, description: '6-week intensive exam preparation with mock tests' }
    ]
  },

  'hospitality': {
    id: 'hospitality',
    name: 'Hospitality, Resorts & Event Venues',
    description: 'Tailored for hotels, boutique resorts, and banquet halls managing room bookings and corporate events.',
    icon: '🏨',
    currency: 'NPR',
    pipeline_stages: [
      'Inquiry Received',
      'Date & Room Selection',
      'Quotation & Package Sent',
      'Advance Deposit Received',
      'Checked-In / Event Hosted',
      'Completed & Feedback Received',
      'Cancelled'
    ],
    custom_fields: [
      { entity: 'deals', label: 'Check-in Date', field_name: 'checkin_date', type: 'text', required: true },
      { entity: 'deals', label: 'Check-out Date', field_name: 'checkout_date', type: 'text', required: true },
      { entity: 'deals', label: 'Guest Count', field_name: 'guest_count', type: 'number', required: true },
      { entity: 'deals', label: 'Room / Venue Category', field_name: 'venue_category', type: 'text', required: false }
    ],
    ai_persona: {
      name: 'Resort Host & Concierge',
      tone: 'hospitable, attentive, and gracious',
      language: 'English, Nepali, Hindi',
      formality: 'courteous',
      qualification_focus: 'Dates, party size, dietary preferences, and event itinerary requirements',
      forbidden_topics: ['unconfirmed complimentary upgrades', 'unauthorized late checkout promises']
    },
    sample_products: [
      { name: 'Deluxe Mountain View Suite (Per Night)', sku: 'HOSP-SUITE-DLX', category: 'Accommodation', price: 14500, description: 'King bed suite with panoramic Himalayan views and breakfast' },
      { name: 'Grand Ballroom Banquet Package', sku: 'HOSP-EVENT-BANQ', category: 'Events', price: 185000, description: 'Ballroom rental for up to 250 guests with buffet catering and AV system' },
      { name: 'Executive Day Conference Package', sku: 'HOSP-CONF-EXEC', category: 'Corporate', price: 45000, description: 'Full-day boardroom access, high-speed WiFi, projector and working lunch' }
    ]
  },

  'automobile': {
    id: 'automobile',
    name: 'Automobile Dealership & Fleet Sales',
    description: 'Built for passenger car dealerships, EV showrooms, and commercial fleet sales.',
    icon: '🚗',
    currency: 'NPR',
    pipeline_stages: [
      'Inquiry Received',
      'Model Interest & Qualification',
      'Test Drive Scheduled',
      'Test Drive Completed',
      'Financing & Trade-in Quote',
      'Booking Deposit Paid',
      'Vehicle Delivered',
      'Lost to Competitor'
    ],
    custom_fields: [
      { entity: 'deals', label: 'Vehicle Model & Trim', field_name: 'vehicle_model', type: 'text', required: true },
      { entity: 'deals', label: 'Transmission / Drive', field_name: 'transmission_type', type: 'text', required: false },
      { entity: 'deals', label: 'Financing Required', field_name: 'financing_required', type: 'text', required: false },
      { entity: 'leads', label: 'Current Vehicle for Trade-in', field_name: 'trade_in_model', type: 'text', required: false }
    ],
    ai_persona: {
      name: 'Dealership Product Specialist',
      tone: 'enthusiastic, knowledgeable, and transparent',
      language: 'English, Nepali',
      formality: 'friendly',
      qualification_focus: 'Vehicle preference, daily commute needs, budget, and test-drive availability',
      forbidden_topics: ['unauthorized cash discounts', 'inaccurate mileage or battery range claims']
    },
    sample_products: [
      { name: 'Apex E-Vision Compact EV (Base)', sku: 'AUTO-EV-BASE', category: 'Electric Vehicles', price: 4200000, description: '310 km range, fast charging, digital cockpit and ADAS safety features' },
      { name: 'Apex E-Vision Long Range AWD', sku: 'AUTO-EV-AWD', category: 'Electric Vehicles', price: 5800000, description: '520 km range, dual-motor AWD, panoramic glass roof' },
      { name: 'Apex Commercial Cargo Van', sku: 'AUTO-COM-VAN', category: 'Commercial', price: 3400000, description: 'Reliable 1.5-ton payload commercial workhorse' }
    ]
  },

  'agency': {
    id: 'agency',
    name: 'Digital Agency & Professional Services',
    description: 'Designed for design studios, marketing agencies, software consultancies, and law firms.',
    icon: '⚡',
    currency: 'USD',
    pipeline_stages: [
      'Requirement Identified',
      'Discovery Call Held',
      'Scope & Proposal Drafted',
      'SOW Negotiation',
      'Contract & Retainer Signed',
      'Project Kickoff',
      'Closed Won',
      'Closed Lost'
    ],
    custom_fields: [
      { entity: 'deals', label: 'Project Scope Type', field_name: 'project_scope_type', type: 'text', required: true },
      { entity: 'deals', label: 'Estimated Project Duration', field_name: 'estimated_duration', type: 'text', required: false },
      { entity: 'deals', label: 'Billing Model (Fixed vs T&M)', field_name: 'billing_model', type: 'text', required: false },
      { entity: 'leads', label: 'Primary Business Objective', field_name: 'business_objective', type: 'text', required: false }
    ],
    ai_persona: {
      name: 'Solutions Architect & Strategy Advisor',
      tone: 'strategic, articulate, and value-oriented',
      language: 'English',
      formality: 'executive',
      qualification_focus: 'Business objectives, timeline constraints, budget allocation, and technical scope',
      forbidden_topics: ['unlimited revision commitments', 'unapproved hourly rate reductions']
    },
    sample_products: [
      { name: 'Full-Funnel Growth Marketing Retainer (Monthly)', sku: 'AGY-GROW-MO', category: 'Retainers', price: 3500, description: 'Paid acquisition, SEO, creative testing, and weekly performance reporting' },
      { name: 'Enterprise Brand Identity & Design System', sku: 'AGY-BRAND-PRO', category: 'Design', price: 8500, description: 'Comprehensive design system, UI components, brand guidelines, and assets' },
      { name: 'Full-Stack Web App Development (Sprint)', sku: 'AGY-DEV-SPRINT', category: 'Engineering', price: 6000, description: 'Two-week focused engineering sprint with senior full-stack developer team' }
    ]
  }
};

/**
 * Returns array of available templates with metadata
 */
function listIndustryTemplates() {
  return Object.values(INDUSTRY_TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    currency: t.currency,
    stages_count: t.pipeline_stages.length,
    custom_fields_count: t.custom_fields.length,
    sample_products_count: t.sample_products.length
  }));
}

/**
 * Returns a full template by ID
 */
function getIndustryTemplate(id) {
  return INDUSTRY_TEMPLATES[id] || null;
}

module.exports = {
  INDUSTRY_TEMPLATES,
  listIndustryTemplates,
  getIndustryTemplate
};
