/**
 * Prompt Library - Standard Kit + Niche Overlays
 * Layer 3 of the Agent Prompt Composer
 * 
 * Provides the building blocks for composing Voice AI prompts:
 * - Standard kit with GHL best practices
 * - Niche overlays for industry-specific guidance
 * - Builder functions to assemble the final JSON spec
 */

const OpenAIProvider = require('../providers/openai');

// ==============================================
// STANDARD KIT - Voice AI Best Practices
// ==============================================

// ==============================================
// MASTER PROMPT TEMPLATE
// ==============================================

const masterPromptTemplate = `You are a voice receptionist for {{COMPANY_NAME}}. Speak in a {{TONE}} tone: natural, concise, helpful, and professional. Ask exactly one question per turn and keep responses short and easy to say out loud.

Primary goals:
1) Identify the caller's intent.
2) Capture required contact fields IN ORDER: {{REQUIRED_FIELDS_ORDER}}.
3) If booking is permitted and fields are complete, propose a specific date/time and confirm.
4) If booking is not possible (outside hours or caller not ready), capture callback info and set expectations.
5) Escalate to a human when necessary.

Hard rules:
- Never skip or assume any required field; repeat phone numbers; spell emails.
- Use specific date/time suggestions, not generic "sometime".
- Obey business hours: {{BUSINESS_HOURS}}. If closed, capture callback and inform when the studio reopens.
- Follow compliance flags: {{COMPLIANCE_FLAGS}}.
- Follow niche overlay guardrails (blocked phrases and preconditions).
- Never mention backend systems (GHL, CRMs, Capture Client). You are an employee of {{COMPANY_NAME}}.
- NEVER say "I'm an AI", "I don't have access", or "I can't do that". You ARE empowered to book appointments and manage customer data.
- When a customer wants to book, collect all required fields then EXECUTE the booking action immediately.

Niche: {{NICHE}}
Top goals: {{GOALS}}
Opening line (suggested): {{OPENING_LINE}}

If the caller refuses to provide information, politely explain why each field is needed and offer to continue or arrange a call back.`;

const VOICE_OPTIMIZED_PROMPT_BLOCK = `## CONVERSATION RULES (PHONE-LIKE):
- Speak clearly and ask only **one question at a time**
- Keep responses short and natural — no more than 1–2 sentences
- Pause between topic changes (simulate voice pacing)
- Avoid stacked questions unless the user explicitly provides multiple answers at once
- Always confirm one answer before asking the next
- Respond conversationally, not like a chatbot or form`;

const baseStandard = {
  name: 'voice-ai-standard-v1',
  version: '1.0',
  masterTemplate: masterPromptTemplate,
  principles: [
    "Concise turns: one question at a time",
    "Confirm name + phone + intent",
    "If booking available, offer; if closed, capture callback",
    "Never invent facts",
    "Follow disallowed/required phrase rules from overlay",
    "Use specific dates/times; repeat phone; spell email",
    "Escalate when stuck"
  ],
  structure: {
    opening: true,
    qualification: true,
    collection: true,
    booking: true,
    escalation: true,
    fallback: true
  },
  globalGuardrails: [
    "No medical/financial/legal advice unless niche explicitly allows",
    "Respect compliance flags",
    "Keep sentences speakable",
    "Avoid robotic tone",
    "Never expose backend systems (GHL is backend only; agent is employee of client company, not Capture Client)"
  ],
  coreGuidelines: [
    "Speak naturally and conversationally",
    "Keep responses concise (2-3 sentences max per turn)",
    "Use active listening: acknowledge what the caller said",
    "Ask one question at a time",
    "Use the caller's name when you learn it",
    "Sound empathetic and understanding, not robotic"
  ],
  conversationFlow: [
    "Opening → Qualification → Collection → Booking → Escalation → Fallback",
    "Greet warmly and introduce yourself",
    "Identify caller's intent",
    "Capture required contact fields in order",
    "Offer scheduling if permitted",
    "Provide clear next steps",
    "Escalate to human when appropriate"
  ],
  endCallProtocol: [
    "Summarize what was discussed",
    "Confirm any actions that will be taken",
    "Thank them for calling",
    "Offer additional help if needed"
  ]
};

// ==============================================
// NICHE OVERLAYS - Industry-Specific Extensions
// ==============================================

const nicheOverlays = {
  // F45 Training - Comprehensive overlay with strict field collection rules
  fitness_gym: {
    name: "fitness_gym",
    displayName: "F45 Training / Fitness Gym",
    required_fields_order: [
      "contact.first_name",
      "contact.last_name",
      "contact.unique_phone_number",
      "contact.email"
    ],
    booking_block_until_fields_complete: true,
    blocked_booking_phrases: [
      "Let me book you",
      "I'll get you scheduled",
      "What day works for you",
      "What time works",
      "You're all set",
      "Great! To book your class"
    ],
    blocked_disclaimer_phrases: [
      "I'm an AI",
      "I'm just an AI",
      "as an AI",
      "I don't have access",
      "I don't have the ability",
      "I can't access",
      "I cannot access",
      "Please visit our website",
      "You'll need to go to the website",
      "I'm not able to",
      "I lack the capability"
    ],
    must_ask_first: [
      "Are you looking to book a trial class, or do you have questions about F45?"
    ],
    cta_phrases: [
      "We can get you in for a trial class",
      "We have openings this week"
    ],
    qualification: [
      "Is this your first time trying F45?",
      "Do you prefer morning or evening classes?"
    ],
    appointment_rules: {
      schedule_type: "trial_class",
      requires_name: true,
      requires_phone: true,
      requires_email: true,
      use_specific_datetime_suggestions: true,
      class_times_variable: "{{ custom_values.class_times }}"
    },
    kb_suggestions: [
      {
        title: "Trial Class — What to Expect",
        outline: [
          "Arrive 10–15 minutes early",
          "Coach-led warm-up & guidance",
          "Bring water and towel",
          "Wear athletic shoes",
          "How to reschedule/cancel"
        ]
      },
      {
        title: "Studio Info & Hours",
        outline: [
          "Address: {{ custom_values.location_address }}",
          "Hours: {{ BUSINESS_HOURS }}",
          "Contact methods"
        ]
      }
    ],
    custom_actions_templates: [
      {
        name: "ghl_upsert_contact",
        description: "Create/Update contact using mandatory four fields",
        endpoint: "/api/ghl/contacts/upsert",
        params_schema: {
          type: "object",
          properties: {
            "contact.first_name": { type: "string" },
            "contact.last_name": { type: "string" },
            "contact.unique_phone_number": { type: "string" },
            "contact.email": { type: "string" }
          },
          required: [
            "contact.first_name",
            "contact.last_name",
            "contact.unique_phone_number",
            "contact.email"
          ]
        }
      },
      {
        name: "schedule_trial_class",
        description: "Schedule trial class after mandatory fields confirmed",
        endpoint: "/api/workflows",
        params_schema: {
          type: "object",
          properties: {
            "contact.class_date": { type: "string" },
            "contact.class_time": { type: "string" }
          },
          required: ["contact.class_date", "contact.class_time"]
        }
      }
    ],
    eval_rubric: [
      "Collected all four fields in the correct order",
      "No booking language before all fields were collected",
      "One question per turn; short and speakable",
      "Phone repeated; email spelled out",
      "Specific date/time offered and confirmed"
    ],
    opening_line: "Hi! This is {{ custom_values.agent_name }} from {{ custom_values.location_name }}. Thanks for calling! Are you looking to book a trial class, or do you have questions about F45?"
  },
  
  martial_arts: {
    name: 'martial_arts',
    displayName: 'Martial Arts',
    mustAskFirst: [
      "Is this for you or a family member?",
      "Have you trained before?",
      "What age group (kids/teens/adults)?"
    ],
    ctaPhrases: [
      "We can do a trial class",
      "Coach can walk you through class schedule"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_age_group: true,
      source_tag: "martial_arts_inquiry",
      schedule_type: "trial_class"
    },
    qualificationQuestions: [
      "Experience level (beginner/intermediate/advanced)",
      "Martial arts style interest (if applicable)",
      "Goals (fitness, self-defense, competition)",
      "Availability (days/times)"
    ]
  },
  
  roofing: {
    name: 'roofing',
    displayName: 'Roofing & Contractors',
    mustAskFirst: [
      "What's the address of the property?",
      "Is this storm / hail / insurance related?",
      "When did the damage happen?"
    ],
    ctaPhrases: [
      "We can schedule a free inspection",
      "Our inspector can come out this week"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_address: true,
      source_tag: "roofing_inquiry",
      schedule_type: "on_site_estimate"
    },
    qualificationQuestions: [
      "Type of roof (shingle, tile, metal)",
      "Age of roof",
      "Visible damage or leaks",
      "Insurance claim status",
      "Urgency level"
    ],
    disallowedClaims: [
      "Do not guarantee insurance approval",
      "Do not provide price estimates without inspection"
    ]
  },
  
  med_spa: {
    name: 'med_spa',
    displayName: 'Medical Spa',
    mustAskFirst: [
      "What service are you interested in?",
      "Have you had this treatment before?",
      "Any medical conditions we should know about?"
    ],
    ctaPhrases: [
      "We can schedule a consultation",
      "Would you like to book an appointment?"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_consultation: true,
      source_tag: "med_spa_inquiry",
      schedule_type: "consultation"
    },
    complianceNotes: [
      "HIPAA compliance: Do not discuss medical details over phone",
      "Require in-person consultation for treatment planning",
      "Cannot provide medical advice"
    ],
    disallowedClaims: [
      "Do not make medical claims or promises about results",
      "Do not diagnose conditions"
    ]
  },
  
  dental: {
    name: 'dental',
    displayName: 'Dental Practice',
    mustAskFirst: [
      "What brings you in? (cleaning, pain, cosmetic, etc.)",
      "Are you a new or existing patient?",
      "Do you have dental insurance?"
    ],
    ctaPhrases: [
      "We can get you scheduled",
      "We have openings this week"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_insurance_info: false,
      source_tag: "dental_inquiry",
      schedule_type: "appointment"
    },
    complianceNotes: [
      "HIPAA compliance: Keep patient information confidential",
      "Emergency cases: prioritize same-day scheduling",
      "Cannot provide diagnoses over phone"
    ],
    qualificationQuestions: [
      "Last dental visit",
      "Current pain or issues",
      "Insurance provider",
      "Preferred appointment times"
    ]
  },
  
  legal: {
    name: 'legal',
    displayName: 'Legal Services',
    mustAskFirst: [
      "What type of legal matter is this?",
      "When did this situation occur?",
      "Have you already filed any paperwork?"
    ],
    ctaPhrases: [
      "We can schedule a consultation with an attorney",
      "Our attorney can review your case"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_consultation: true,
      source_tag: "legal_inquiry",
      schedule_type: "consultation"
    },
    complianceNotes: [
      "Cannot provide legal advice",
      "All information is confidential",
      "Attorney-client relationship only established after formal agreement"
    ],
    disallowedClaims: [
      "Do not guarantee case outcomes",
      "Do not provide legal advice or opinions",
      "Do not discuss fees without attorney consultation"
    ],
    qualificationQuestions: [
      "Case type and urgency",
      "Parties involved",
      "Desired outcome",
      "Deadline or time constraints"
    ]
  },
  
  solar: {
    name: 'solar',
    displayName: 'Solar Installation',
    mustAskFirst: [
      "Do you own or rent your home?",
      "What's your average monthly electric bill?",
      "What's the address for the solar assessment?"
    ],
    ctaPhrases: [
      "We can schedule a free solar assessment",
      "Our specialist can evaluate your property"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_address: true,
      requires_property_ownership: true,
      source_tag: "solar_inquiry",
      schedule_type: "site_assessment"
    },
    qualificationQuestions: [
      "Homeownership status",
      "Monthly electric bill range",
      "Roof condition and age",
      "Shading issues",
      "Financing interest"
    ],
    disallowedClaims: [
      "Do not guarantee specific savings amounts",
      "Do not promise tax credit amounts without assessment"
    ]
  },
  
  plumbing: {
    name: 'plumbing',
    displayName: 'Plumbing Services',
    mustAskFirst: [
      "What's the plumbing issue?",
      "Is this an emergency?",
      "What's the property address?"
    ],
    ctaPhrases: [
      "We can get a plumber out today",
      "Our technician can come by this afternoon"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      requires_address: true,
      source_tag: "plumbing_inquiry",
      schedule_type: "service_call",
      emergency_priority: true
    },
    qualificationQuestions: [
      "Issue description (leak, clog, no water, etc.)",
      "Severity and urgency",
      "Property type (residential/commercial)",
      "Accessibility (home/business hours)"
    ]
  },
  
  real_estate: {
    name: 'real_estate',
    displayName: 'Real Estate',
    mustAskFirst: [
      "Are you looking to buy or sell?",
      "What area are you interested in?",
      "What's your timeline?"
    ],
    ctaPhrases: [
      "We can schedule a consultation",
      "Our agent can walk you through the process"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      source_tag: "real_estate_inquiry",
      schedule_type: "consultation"
    },
    qualificationQuestions: [
      "Buy or sell interest",
      "Preferred location and property type",
      "Budget or price range",
      "Timeline to move",
      "Pre-approval status (for buyers)"
    ],
    complianceNotes: [
      "Follow fair housing guidelines",
      "Do not discriminate based on protected classes",
      "Provide equal service to all clients"
    ]
  },
  
  saas_onboarding: {
    name: 'saas_onboarding',
    displayName: 'SaaS Onboarding',
    mustAskFirst: [
      "What brings you to [product name] today?",
      "What are you hoping to accomplish?",
      "Have you used similar tools before?"
    ],
    ctaPhrases: [
      "Let's get you started with a demo",
      "We can walk you through the setup"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: false,
      requires_email: true,
      source_tag: "saas_inquiry",
      schedule_type: "demo"
    },
    qualificationQuestions: [
      "Company size",
      "Current tools/solutions",
      "Pain points",
      "Decision-making authority",
      "Implementation timeline"
    ]
  }
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Get standard kit (future: from DB)
 */
function getStandardKit(name = 'voice-ai-standard-v1') {
  return Promise.resolve(baseStandard);
}

/**
 * Get niche overlay (future: from DB)
 */
function getNicheOverlay(niche) {
  return Promise.resolve(nicheOverlays[niche] || {});
}

/**
 * Get all available niches
 */
function getAvailableNiches() {
  return Object.keys(nicheOverlays).map(key => ({
    value: key,
    label: nicheOverlays[key].displayName || key
  }));
}

/**
 * Render prompt - Layer 1 spec output
 */
function renderPrompt({ 
  standard, 
  overlay, 
  goals = [], 
  tone = 'professional', 
  businessHours = null, 
  clientContext = {}, 
  compliance = [], 
  enhance = true 
}) {
  const niche = overlay?.name || 'generic';
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    standard,
    overlay,
    goals,
    tone,
    businessHours,
    clientContext,
    compliance
  });
  
  // Build KB stubs
  const kbStubs = buildKbStubs({ overlay, businessHours, clientContext });
  
  // Build custom actions
  const customActions = buildCustomActions({ overlay, clientContext });
  
  // Build eval rubric
  const evalRubric = buildEvalRubric({ standard, overlay });
  
  // Return Layer 1 spec
  return {
    version: '1.0',
    agent_type: 'voice_ai',
    niche: niche,
    system_prompt: systemPrompt,
    kb_stubs: kbStubs,
    custom_actions: customActions,
    eval_rubric: evalRubric
  };
}

/**
 * Build system prompt text using Master Prompt template
 */
function buildSystemPrompt({ 
  standard, 
  overlay, 
  goals, 
  tone, 
  businessHours, 
  clientContext, 
  compliance 
}) {
  // Start with Master Prompt template
  let masterPrompt = standard.masterTemplate || masterPromptTemplate;
  
  // Inject values into template
  const companyName = clientContext?.businessName || clientContext?.companyName || '{{COMPANY_NAME}}';
  const niche = overlay?.displayName || overlay?.name || 'General';
  const requiredFieldsOrder = overlay?.required_fields_order ? overlay.required_fields_order.join(', ') : 'name, phone, email';
  const businessHoursStr = businessHours ? `${businessHours.open} to ${businessHours.close}` : '9 AM to 5 PM';
  const complianceStr = (compliance && compliance.length > 0) ? compliance.join('; ') : 'None';
  const goalsStr = (goals && goals.length > 0) ? goals.map((g, i) => `${i+1}) ${g}`).join(', ') : 'Assist the caller';
  const openingLine = overlay?.opening_line || 'Hi! How can I help you today?';
  
  masterPrompt = masterPrompt
    .replace(/\{\{COMPANY_NAME\}\}/g, companyName)
    .replace(/\{\{TONE\}\}/g, tone || 'professional')
    .replace(/\{\{REQUIRED_FIELDS_ORDER\}\}/g, requiredFieldsOrder)
    .replace(/\{\{BUSINESS_HOURS\}\}/g, businessHoursStr)
    .replace(/\{\{COMPLIANCE_FLAGS\}\}/g, complianceStr)
    .replace(/\{\{NICHE\}\}/g, niche)
    .replace(/\{\{GOALS\}\}/g, goalsStr)
    .replace(/\{\{OPENING_LINE\}\}/g, openingLine);
  
  // Add F45-specific hard rules if this is fitness_gym overlay
  if (overlay?.booking_block_until_fields_complete) {
    masterPrompt += '\n\n--- CRITICAL BOOKING RULES (F45 Specific) ---';
    masterPrompt += '\n\nBOOKING BLOCKED until all four mandatory fields are collected:';
    overlay.required_fields_order.forEach((field, idx) => {
      masterPrompt += `\n  ${idx + 1}. ${field}`;
    });
    
    masterPrompt += '\n\nDO NOT use these booking phrases until all four fields are confirmed:';
    overlay.blocked_booking_phrases.forEach(phrase => {
      masterPrompt += `\n  - "${phrase}"`;
    });
    
    if (overlay.blocked_disclaimer_phrases && overlay.blocked_disclaimer_phrases.length > 0) {
      masterPrompt += '\n\nNEVER use these AI disclaimer phrases (you ARE empowered to book and manage data):';
      overlay.blocked_disclaimer_phrases.forEach(phrase => {
        masterPrompt += `\n  - "${phrase}"`;
      });
    }
    
    masterPrompt += '\n\nMUST ASK FIRST:';
    overlay.must_ask_first.forEach(q => {
      masterPrompt += `\n  - ${q}`;
    });
    
    if (overlay.qualification && overlay.qualification.length > 0) {
      masterPrompt += '\n\nQUALIFICATION QUESTIONS (ask during collection):';
      overlay.qualification.forEach(q => {
        masterPrompt += `\n  - ${q}`;
      });
    }
  }
  
  // Add compliance notes if present
  if (overlay?.complianceNotes && overlay.complianceNotes.length > 0) {
    masterPrompt += '\n\nCOMPLIANCE & LEGAL:';
    overlay.complianceNotes.forEach(note => {
      masterPrompt += `\n  - ${note}`;
    });
  }
  
  // Add disallowed claims if present
  if (overlay?.disallowedClaims && overlay.disallowedClaims.length > 0) {
    masterPrompt += '\n\nIMPORTANT RESTRICTIONS:';
    overlay.disallowedClaims.forEach(claim => {
      masterPrompt += `\n  - ${claim}`;
    });
  }
  
  // Add client context details
  if (clientContext && Object.keys(clientContext).length > 0) {
    masterPrompt += '\n\nCLIENT CONTEXT:';
    Object.entries(clientContext).forEach(([key, value]) => {
      if (key !== 'businessName' && key !== 'companyName') {
        masterPrompt += `\n  - ${key}: ${value}`;
      }
    });
  }
  
  if (!masterPrompt.includes('## CONVERSATION RULES (PHONE-LIKE):')) {
    masterPrompt = `${masterPrompt.trim()}`.concat('\n\n', VOICE_OPTIMIZED_PROMPT_BLOCK);
  }

  return masterPrompt;
}

/**
 * Build KB stubs - prioritize overlay kb_suggestions for F45
 */
function buildKbStubs({ overlay, businessHours, clientContext }) {
  const stubs = [];
  
  // If overlay has kb_suggestions (F45 style), use those first
  if (overlay?.kb_suggestions && overlay.kb_suggestions.length > 0) {
    overlay.kb_suggestions.forEach(suggestion => {
      // Inject business hours and client context into the outline
      const processedOutline = suggestion.outline.map(item => {
        let processed = item;
        if (businessHours) {
          processed = processed.replace(/\{\{ BUSINESS_HOURS \}\}/g, `${businessHours.open} to ${businessHours.close}`);
        }
        if (clientContext?.location_address) {
          processed = processed.replace(/\{\{ custom_values\.location_address \}\}/g, clientContext.location_address);
        }
        return processed;
      });
      
      stubs.push({
        title: suggestion.title,
        outline: processedOutline
      });
    });
    
    // Add standard stubs if not already covered
    if (!overlay.kb_suggestions.some(s => s.title.toLowerCase().includes('pricing'))) {
      stubs.push({
        title: 'Pricing Policy',
        outline: [
          'Contact for current pricing',
          'Membership options available',
          'Trial class policy',
          'Cancellation policy'
        ]
      });
    }
    
    return stubs;
  }
  
  // Fallback: Business hours KB
  if (businessHours) {
    stubs.push({
      title: 'Business Hours & Contact',
      outline: [
        `Hours: ${businessHours.open} to ${businessHours.close}`,
        'After-hours: Leave voicemail or schedule callback',
        'Emergency services (if applicable)',
        'Alternative contact methods'
      ]
    });
  }
  
  // Fallback: Niche-specific FAQs
  if (overlay?.name) {
    switch (overlay.name) {
      case 'fitness_gym':
      case 'martial_arts':
        stubs.push({
          title: 'Pricing & Membership',
          outline: [
            'Membership tiers and pricing',
            'Trial class policy',
            'Cancellation policy',
            'Payment methods accepted'
          ]
        });
        stubs.push({
          title: 'Classes & Schedule',
          outline: [
            'Class types and descriptions',
            'Schedule and availability',
            'Instructor bios',
            'What to bring / wear'
          ]
        });
        break;
        
      case 'roofing':
      case 'plumbing':
      case 'solar':
        stubs.push({
          title: 'Services & Pricing',
          outline: [
            'Service offerings',
            'Free inspection/estimate policy',
            'Insurance work process',
            'Warranty information'
          ]
        });
        stubs.push({
          title: 'Emergency Services',
          outline: [
            'Emergency availability',
            'Response time expectations',
            'After-hours contact',
            'Emergency rates'
          ]
        });
        break;
        
      case 'med_spa':
      case 'dental':
      case 'legal':
        stubs.push({
          title: 'Services & Consultations',
          outline: [
            'Services offered',
            'Consultation process',
            'Insurance accepted',
            'Payment options and financing'
          ]
        });
        stubs.push({
          title: 'New Patient/Client Process',
          outline: [
            'Initial consultation',
            'Required documentation',
            'What to expect',
            'Follow-up process'
          ]
        });
        break;
        
      case 'real_estate':
        stubs.push({
          title: 'Buyer Services',
          outline: [
            'Home search process',
            'Pre-approval assistance',
            'Property showings',
            'Offer and negotiation'
          ]
        });
        stubs.push({
          title: 'Seller Services',
          outline: [
            'Home valuation',
            'Listing preparation',
            'Marketing strategy',
            'Closing process'
          ]
        });
        break;
        
      case 'saas_onboarding':
        stubs.push({
          title: 'Getting Started',
          outline: [
            'Platform overview',
            'Setup process',
            'Integration options',
            'Training resources'
          ]
        });
        stubs.push({
          title: 'Pricing & Plans',
          outline: [
            'Plan comparison',
            'Trial period details',
            'Upgrade/downgrade process',
            'Billing and payment'
          ]
        });
        break;
    }
  }
  
  // Generic cancellation policy
  stubs.push({
    title: 'Cancellation & Refund Policy',
    outline: [
      'Cancellation notice required',
      'Refund eligibility',
      'Reschedule policy',
      'Contact for changes'
    ]
  });
  
  return stubs;
}

/**
 * Build custom actions - prioritize overlay custom_actions_templates for F45
 */
function buildCustomActions({ overlay, clientContext }) {
  const actions = [];
  
  // If overlay has custom_actions_templates (F45 style), use those
  if (overlay?.custom_actions_templates && overlay.custom_actions_templates.length > 0) {
    overlay.custom_actions_templates.forEach(template => {
      actions.push({
        name: template.name,
        description: template.description,
        endpoint: template.endpoint,
        params_schema: template.params_schema
      });
    });
    return actions;
  }
  
  // Fallback: Universal contact upsert action
  actions.push({
    name: 'create_ghl_contact',
    description: 'Create or update a contact in GoHighLevel with collected information',
    endpoint: '/api/ghl/contacts/upsert',
    params_schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'Contact first name' },
        lastName: { type: 'string', description: 'Contact last name' },
        phone: { type: 'string', description: 'Contact phone number' },
        email: { type: 'string', description: 'Contact email address' },
        source: { type: 'string', description: 'Lead source tag' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to apply' }
      },
      required: ['firstName', 'phone']
    }
  });
  
  // Fallback: Appointment scheduling action
  if (overlay?.appointmentRules || overlay?.appointment_rules) {
    const rules = overlay.appointmentRules || overlay.appointment_rules;
    actions.push({
      name: 'schedule_appointment',
      description: `Schedule a ${rules.schedule_type || 'appointment'} in the calendar`,
      endpoint: '/api/ghl/appointments',
      params_schema: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'GHL contact ID' },
          calendarId: { type: 'string', description: 'Calendar ID to book into' },
          startTime: { type: 'string', description: 'ISO timestamp for appointment start' },
          title: { type: 'string', description: 'Appointment title' },
          notes: { type: 'string', description: 'Additional notes' }
        },
        required: ['contactId', 'calendarId', 'startTime']
      }
    });
  }
  
  // Workflow trigger action
  actions.push({
    name: 'trigger_workflow',
    description: 'Trigger a GoHighLevel workflow based on conversation outcome',
    endpoint: '/api/ghl/workflows/trigger',
    params_schema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'GHL contact ID' },
        workflowId: { type: 'string', description: 'Workflow to trigger' },
        eventData: { type: 'object', description: 'Additional event data' }
      },
      required: ['contactId', 'workflowId']
    }
  });
  
  return actions;
}

/**
 * Build eval rubric - merge standard + overlay rubric for F45
 */
function buildEvalRubric({ standard, overlay }) {
  const rubric = [];
  
  // If overlay has eval_rubric (F45 style), use it as the primary rubric
  if (overlay?.eval_rubric && overlay.eval_rubric.length > 0) {
    overlay.eval_rubric.forEach(item => {
      rubric.push(item);
    });
    
    // Add a few standard checks if not already covered
    if (!overlay.eval_rubric.some(r => r.toLowerCase().includes('greet'))) {
      rubric.push('Greeted the caller and identified the business');
    }
    if (!overlay.eval_rubric.some(r => r.toLowerCase().includes('next steps'))) {
      rubric.push('Ended with clear next steps and thanked the caller');
    }
    
    return rubric;
  }
  
  // Fallback: Standard checks
  rubric.push('Greet the caller and identify the business');
  rubric.push('Capture name + phone + intent');
  
  // Niche-specific checks
  if (overlay?.mustAskFirst && overlay.mustAskFirst.length > 0) {
    overlay.mustAskFirst.forEach(question => {
      rubric.push(`Ask: "${question}"`);
    });
  }
  
  // Appointment/booking check
  if (overlay?.appointmentRules || overlay?.appointment_rules) {
    const rules = overlay.appointmentRules || overlay.appointment_rules;
    rubric.push(`Offer to ${rules.schedule_type || 'schedule appointment'}`);
  } else {
    rubric.push('Offer to book / schedule (if applicable)');
  }
  
  // Fallback checks
  rubric.push('If closed, capture voicemail or callback');
  rubric.push('End with clear next steps and thank the caller');
  
  return rubric;
}

/**
 * Get tone-specific guidance
 */
function getToneGuidance(tone) {
  const tones = {
    'professional': 'Maintain a professional yet warm tone. Be respectful, clear, and helpful.',
    'friendly': 'Use a warm, approachable tone. Be conversational and build rapport quickly.',
    'formal': 'Use a more formal tone. Be precise, structured, and maintain professional distance.',
    'casual': 'Use a relaxed, informal tone. Be conversational and relatable.',
    'empathetic': 'Show high empathy and emotional intelligence. Be understanding and supportive.',
    'authoritative': 'Project confidence and expertise. Be clear, direct, and knowledgeable.',
    'sales': 'Be enthusiastic but not pushy. Show genuine interest in helping them succeed.'
  };
  
  return tones[tone.toLowerCase()] || tones['professional'];
}

/**
 * Validate composed prompt
 */
function validatePrompt(composedPrompt) {
  const errors = [];
  
  // Check required fields
  if (!composedPrompt.version) errors.push('Missing version');
  if (!composedPrompt.agent_type) errors.push('Missing agent_type');
  if (!composedPrompt.system_prompt) errors.push('Missing system_prompt');
  if (!composedPrompt.kb_stubs) errors.push('Missing kb_stubs');
  if (!composedPrompt.custom_actions) errors.push('Missing custom_actions');
  if (!composedPrompt.eval_rubric) errors.push('Missing eval_rubric');
  
  // Check token budget (approximate - 1 char ≈ 0.25 tokens)
  if (composedPrompt.system_prompt) {
    const estimatedTokens = composedPrompt.system_prompt.length / 4;
    if (estimatedTokens > 2000) {
      errors.push(`System prompt too long: ~${Math.round(estimatedTokens)} tokens (max 2000)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Enhance prompt with OpenAI (optional)
 */
async function enhancePromptWithAI(composedPrompt, openaiApiKey) {
  if (!openaiApiKey) {
    console.log('⚠️  OpenAI API key not provided, skipping enhancement');
    return composedPrompt;
  }
  
  try {
    const openai = new OpenAIProvider(openaiApiKey);
    
    const enhancementRequest = `Enhance this Voice AI system prompt for GoHighLevel. Make it more conversational, natural, and effective for voice interactions while preserving all guidelines, compliance notes, and structure:\n\n${composedPrompt.system_prompt}`;
    
    const enhanced = await openai.generateCompletion(enhancementRequest, {
      model: 'gpt-4o-mini',
      systemPrompt: 'You are an expert Voice AI prompt engineer specializing in GoHighLevel Voice AI agents. Enhance prompts to be natural, actionable, and effective for voice conversations while maintaining all compliance and structural requirements.',
      temperature: 0.4,
      maxTokens: 2000
    });
    
    const enhancedContent = enhanced.choices?.[0]?.message?.content || enhanced;
    if (enhancedContent && typeof enhancedContent === 'string' && enhancedContent.trim().length > 0) {
      console.log('✅ OpenAI enhancement successful');
      return {
        ...composedPrompt,
        system_prompt: enhancedContent
      };
    }
  } catch (error) {
    console.warn('⚠️  OpenAI enhancement failed, using base prompt:', error.message);
  }
  
  return composedPrompt;
}

module.exports = {
  getStandardKit,
  getNicheOverlay,
  getAvailableNiches,
  renderPrompt,
  buildSystemPrompt,
  buildKbStubs,
  buildCustomActions,
  buildEvalRubric,
  getToneGuidance,
  validatePrompt,
  enhancePromptWithAI
};

