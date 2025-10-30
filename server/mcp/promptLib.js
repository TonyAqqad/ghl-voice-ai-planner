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

const baseStandard = {
  name: 'voice-ai-standard-v1',
  version: '1.0',
  principles: [
    "Be concise. 1–2 sentences per turn.",
    "Ask exactly 1 question at a time.",
    "Always confirm name + phone + intent.",
    "If booking is available, offer it.",
    "If business is closed, capture callback."
  ],
  structure: {
    opening: true,
    qualification: true,
    booking: true,
    escalation: true,
    fallback: true
  },
  coreGuidelines: [
    "Speak naturally and conversationally, as if talking to a friend",
    "Keep responses concise (2-3 sentences max per turn)",
    "Use active listening: acknowledge what the caller said before responding",
    "Ask one question at a time",
    "Use the caller's name when you learn it",
    "Sound empathetic and understanding, not robotic"
  ],
  ghlCapabilities: [
    "Capture and update contact information in GoHighLevel",
    "Schedule appointments and add to calendars",
    "Answer questions about products/services",
    "Qualify leads and gather information",
    "Transfer to human agent if requested or if situation requires it"
  ],
  conversationFlow: [
    "Greet warmly and introduce yourself",
    "Ask how you can help",
    "Listen actively and take notes on key information",
    "Ask clarifying questions when needed",
    "Provide helpful information or complete requested actions",
    "Confirm next steps before ending the call"
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
  fitness_gym: {
    name: 'fitness_gym',
    displayName: 'Fitness Gym',
    mustAskFirst: [
      "What's your fitness goal right now?",
      "Have you ever done group training before?"
    ],
    ctaPhrases: [
      "We can get you in for a free class",
      "We have openings this week"
    ],
    appointmentRules: {
      requires_name: true,
      requires_phone: true,
      source_tag: "fitness_gym_inquiry",
      schedule_type: "free_trial_class"
    },
    qualificationQuestions: [
      "Current fitness level",
      "Any injuries or limitations",
      "Preferred training times",
      "Previous gym membership experience"
    ],
    complianceNotes: [
      "Mention liability waivers for trial classes",
      "Ask about any health conditions that might affect training"
    ]
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
 * Build system prompt text
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
  let parts = [];
  
  // Header
  parts.push('You are an expert Voice AI agent for GoHighLevel (GHL).');
  parts.push('');
  
  // Core principles
  if (standard?.coreGuidelines) {
    parts.push('CORE PRINCIPLES:');
    standard.coreGuidelines.forEach(guideline => {
      parts.push(`- ${guideline}`);
    });
    parts.push('');
  }
  
  // Niche-specific intro
  if (overlay?.displayName) {
    parts.push(`INDUSTRY CONTEXT: ${overlay.displayName}`);
    parts.push('');
  }
  
  // Goals
  if (goals && goals.length > 0) {
    parts.push('YOUR PRIMARY GOALS:');
    goals.forEach((goal, index) => {
      parts.push(`${index + 1}. ${goal}`);
    });
    parts.push('');
  }
  
  // Business hours
  if (businessHours) {
    parts.push('BUSINESS OPERATIONS:');
    parts.push(`- Business hours: ${businessHours.open} to ${businessHours.close}`);
    parts.push('- If caller contacts outside business hours, offer to: schedule a callback, leave a message, or direct them to 24/7 resources');
    parts.push('');
  }
  
  // Niche-specific must-ask questions
  if (overlay?.mustAskFirst && overlay.mustAskFirst.length > 0) {
    parts.push('CRITICAL QUESTIONS TO ASK:');
    overlay.mustAskFirst.forEach(question => {
      parts.push(`- ${question}`);
    });
    parts.push('');
  }
  
  // Qualification questions
  if (overlay?.qualificationQuestions && overlay.qualificationQuestions.length > 0) {
    parts.push('QUALIFICATION INFORMATION TO GATHER:');
    overlay.qualificationQuestions.forEach(question => {
      parts.push(`- ${question}`);
    });
    parts.push('');
  }
  
  // CTA phrases
  if (overlay?.ctaPhrases && overlay.ctaPhrases.length > 0) {
    parts.push('CALL-TO-ACTION PHRASES:');
    overlay.ctaPhrases.forEach(phrase => {
      parts.push(`- "${phrase}"`);
    });
    parts.push('');
  }
  
  // Compliance and disclaimers
  if (overlay?.complianceNotes && overlay.complianceNotes.length > 0) {
    parts.push('COMPLIANCE & LEGAL:');
    overlay.complianceNotes.forEach(note => {
      parts.push(`- ${note}`);
    });
    parts.push('');
  }
  
  if (overlay?.disallowedClaims && overlay.disallowedClaims.length > 0) {
    parts.push('IMPORTANT RESTRICTIONS:');
    overlay.disallowedClaims.forEach(claim => {
      parts.push(`- ${claim}`);
    });
    parts.push('');
  }
  
  // Additional compliance
  if (compliance && compliance.length > 0) {
    parts.push('ADDITIONAL COMPLIANCE REQUIREMENTS:');
    compliance.forEach(req => {
      parts.push(`- ${req}`);
    });
    parts.push('');
  }
  
  // Client context
  if (clientContext && Object.keys(clientContext).length > 0) {
    parts.push('CLIENT-SPECIFIC INFORMATION:');
    Object.entries(clientContext).forEach(([key, value]) => {
      parts.push(`- ${key}: ${value}`);
    });
    parts.push('');
  }
  
  // GHL capabilities
  if (standard?.ghlCapabilities) {
    parts.push('YOUR CAPABILITIES:');
    standard.ghlCapabilities.forEach(capability => {
      parts.push(`- ${capability}`);
    });
    parts.push('');
  }
  
  // Conversation flow
  if (standard?.conversationFlow) {
    parts.push('CONVERSATION FLOW:');
    standard.conversationFlow.forEach((step, index) => {
      parts.push(`${index + 1}. ${step}`);
    });
    parts.push('');
  }
  
  // End call protocol
  if (standard?.endCallProtocol) {
    parts.push('END CALL PROTOCOL:');
    standard.endCallProtocol.forEach(step => {
      parts.push(`- ${step}`);
    });
  }
  
  // Tone guidance
  parts.push('');
  parts.push('COMMUNICATION STYLE:');
  parts.push(getToneGuidance(tone));
  
  return parts.join('\n');
}

/**
 * Build KB stubs
 */
function buildKbStubs({ overlay, businessHours, clientContext }) {
  const stubs = [];
  
  // Business hours KB
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
  
  // Niche-specific FAQs
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
 * Build custom actions
 */
function buildCustomActions({ overlay, clientContext }) {
  const actions = [];
  
  // Contact upsert action (universal)
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
  
  // Appointment scheduling action
  if (overlay?.appointmentRules) {
    actions.push({
      name: 'schedule_appointment',
      description: `Schedule a ${overlay.appointmentRules.schedule_type || 'appointment'} in the calendar`,
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
 * Build eval rubric
 */
function buildEvalRubric({ standard, overlay }) {
  const rubric = [];
  
  // Standard checks
  rubric.push('Greet the caller and identify the business');
  rubric.push('Capture name + phone + intent');
  
  // Niche-specific checks
  if (overlay?.mustAskFirst && overlay.mustAskFirst.length > 0) {
    overlay.mustAskFirst.forEach(question => {
      rubric.push(`Ask: "${question}"`);
    });
  }
  
  // Appointment/booking check
  if (overlay?.appointmentRules) {
    rubric.push(`Offer to ${overlay.appointmentRules.schedule_type || 'schedule appointment'}`);
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
      model: 'gpt-4',
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

