// Advanced Voice AI Agent Templates for Full Automation
export interface VoiceAgentTemplate {
  id: string;
  name: string;
  description: string;
  industry: 'fitness' | 'martial_arts' | 'legal' | 'contractors' | 'plumbing' | 'towing' | 'construction';
  useCase: 'lead_qualification' | 'appointment_booking' | 'customer_service' | 'sales' | 'follow_up' | 'survey' | 'support';
  automationLevel: 'basic' | 'intermediate' | 'advanced' | 'enterprise';
  estimatedSetupTime: string;
  features: string[];
  scripts: {
    greeting: string;
    main: string;
    fallback: string;
    transfer: string;
    goodbye: string;
  };
  intents: Array<{
    name: string;
    keywords: string[];
    confidence: number;
    response: string;
    actions: string[];
    automation: {
      ghlAction: string;
      webhookUrl?: string;
      customField?: string;
      tag?: string;
    };
  }>;
  transferRules: Array<{
    condition: string;
    target: 'human' | 'voicemail' | 'other_agent';
    priority: number;
    automation: {
      ghlWorkflow: string;
      notificationSms?: string;
      emailAlert?: string;
    };
  }>;
  ghlIntegration: {
    customFields: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select';
      required: boolean;
      options?: string[];
    }>;
    mergeTags: string[];
    workflows: string[];
    webhooks: Array<{
      event: string;
      url: string;
      method: string;
      payload: Record<string, any>;
    }>;
  };
  analytics: {
    kpis: string[];
    reports: string[];
    alerts: Array<{
      metric: string;
      threshold: number;
      action: string;
    }>;
  };
  deployment: {
    readinessChecks: string[];
    testingScenarios: string[];
    goLiveSteps: string[];
  };
}

export const voiceAgentTemplates: VoiceAgentTemplate[] = [
  // F45 FITNESS STUDIO AGENT
  {
    id: 'f45_fitness_trial_booking',
    name: 'F45 Fitness Trial Booking Agent',
    description: 'Automated F45 trial class booking and membership qualification system',
    industry: 'fitness',
    useCase: 'appointment_booking',
    automationLevel: 'enterprise',
    estimatedSetupTime: '10 minutes',
    features: [
      'Trial class booking automation',
      'Fitness level assessment',
      'Goal identification',
      'Membership qualification',
      'Class schedule integration',
      'Payment processing',
      'Follow-up automation'
    ],
    scripts: {
      greeting: `Hey {{contact_name}}! This is {{agent_name}} from F45 Training {{location_name}}. I'm calling because you recently expressed interest in trying F45. Do you have a few minutes to chat about your fitness goals?`,
      main: `Awesome! F45 is all about functional fitness in a group setting - it's 45 minutes of high-intensity training that's different every day.

Let me ask you a few quick questions to find the perfect class for you:

1. What's your current fitness level - are you just starting out, moderately active, or pretty fit?
2. What are your main fitness goals - weight loss, muscle building, general health, or something specific?
3. Do you prefer morning, afternoon, or evening workouts?
4. Have you done any group fitness classes before?

Perfect! Based on what you've told me, I think our {{recommended_class}} class would be perfect for you. It's designed for {{fitness_level}} and focuses on {{goal_focus}}.

I'd love to get you in for a FREE trial class this week. We have spots available {{available_times}}. What works best for you?

The trial is completely free, no commitment required. You'll get to experience the full F45 workout and see if it's the right fit for your goals.`,
      fallback: `I understand you might have questions about F45 or group fitness in general. Let me connect you with one of our trainers who can answer all your questions about our classes, membership options, and how F45 can help you reach your fitness goals.`,
      transfer: `I'm transferring you to {{trainer_name}}, one of our certified F45 trainers. They'll be able to answer all your questions about our workouts and help you find the perfect class.`,
      goodbye: `Perfect! I've got you booked for the {{class_name}} trial class on {{appointment_date}} at {{appointment_time}}. You'll receive a confirmation text with all the details and what to bring. 

Just a heads up - make sure to arrive 10 minutes early for a quick orientation, and bring a water bottle and towel. We can't wait to see you crush your first F45 workout!`
    },
    intents: [
      {
        name: 'interested_in_trial',
        keywords: ['trial', 'try', 'free', 'class', 'workout', 'interested', 'book'],
        confidence: 0.9,
        response: 'That\'s fantastic! A trial class is the perfect way to experience F45. Let me find the best class time for you.',
        actions: ['check_schedule', 'offer_times', 'book_trial'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'trial_interest',
          tag: 'Trial Interested'
        }
      },
      {
        name: 'fitness_goals',
        keywords: ['lose weight', 'get fit', 'muscle', 'strength', 'cardio', 'health', 'goals'],
        confidence: 0.85,
        response: 'I love that you have specific goals! F45 is perfect for that. Let me recommend the best class type for your goals.',
        actions: ['assess_goals', 'recommend_class', 'explain_benefits'],
        automation: {
          ghlAction: 'add_note',
          customField: 'fitness_goals'
        }
      },
      {
        name: 'schedule_concerns',
        keywords: ['time', 'schedule', 'busy', 'work', 'morning', 'evening', 'weekend'],
        confidence: 0.8,
        response: 'I totally understand being busy! That\'s why F45 is only 45 minutes and we have classes throughout the day. Let me show you our schedule.',
        actions: ['show_schedule', 'find_best_time', 'explain_flexibility'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'preferred_time'
        }
      },
      {
        name: 'cost_concerns',
        keywords: ['cost', 'price', 'expensive', 'money', 'afford', 'membership'],
        confidence: 0.9,
        response: 'I understand cost is important! The great news is your first class is completely free, and we have flexible membership options. Let me explain our pricing.',
        actions: ['explain_pricing', 'offer_promotions', 'discuss_value'],
        automation: {
          ghlAction: 'add_note',
          customField: 'pricing_concern'
        }
      }
    ],
    transferRules: [
      {
        condition: 'injury_concerns OR medical_questions',
        target: 'human',
        priority: 1,
        automation: {
          ghlWorkflow: 'transfer_to_trainer',
          notificationSms: 'F45 lead has medical questions - {{contact_name}}',
          emailAlert: 'trainers@f45.com'
        }
      },
      {
        condition: 'membership_questions OR payment_issues',
        target: 'human',
        priority: 2,
        automation: {
          ghlWorkflow: 'transfer_to_sales',
          notificationSms: 'F45 membership inquiry - {{contact_name}}'
        }
      }
    ],
    ghlIntegration: {
      customFields: [
        {
          key: 'fitness_level',
          label: 'Current Fitness Level',
          type: 'select',
          required: true,
          options: ['Beginner', 'Intermediate', 'Advanced', 'Athlete']
        },
        {
          key: 'fitness_goals',
          label: 'Primary Fitness Goals',
          type: 'select',
          required: true,
          options: ['Weight Loss', 'Muscle Building', 'General Health', 'Athletic Performance', 'Stress Relief']
        },
        {
          key: 'preferred_time',
          label: 'Preferred Workout Time',
          type: 'select',
          required: false,
          options: ['Early Morning (5-7am)', 'Morning (7-10am)', 'Afternoon (12-3pm)', 'Evening (5-8pm)', 'Weekend']
        },
        {
          key: 'trial_class',
          label: 'Trial Class Booked',
          type: 'select',
          required: false,
          options: ['Yes', 'No', 'Rescheduled']
        },
        {
          key: 'class_type',
          label: 'Recommended Class Type',
          type: 'select',
          required: false,
          options: ['F45', 'F45 Core', 'F45 Cardio', 'F45 Strength', 'F45 Hybrid']
        },
        {
          key: 'membership_interest',
          label: 'Membership Interest Level',
          type: 'select',
          required: false,
          options: ['High', 'Medium', 'Low', 'Not Interested']
        }
      ],
      mergeTags: [
        '{{contact_name}}',
        '{{location_name}}',
        '{{class_name}}',
        '{{appointment_date}}',
        '{{appointment_time}}',
        '{{trainer_name}}',
        '{{fitness_level}}',
        '{{fitness_goals}}',
        '{{recommended_class}}'
      ],
      workflows: [
        'f45_trial_booking',
        'fitness_assessment',
        'membership_follow_up',
        'class_reminder_sequence'
      ],
      webhooks: [
        {
          event: 'trial_booked',
          url: 'https://api.f45.com/webhooks/trial-booking',
          method: 'POST',
          payload: {
            contact_id: '{{contact_id}}',
            class_name: '{{class_name}}',
            appointment_date: '{{appointment_date}}',
            fitness_level: '{{fitness_level}}',
            goals: '{{fitness_goals}}'
          }
        }
      ]
    },
    analytics: {
      kpis: [
        'Trial booking rate',
        'Fitness level distribution',
        'Goal achievement tracking',
        'Membership conversion rate',
        'Class attendance rate'
      ],
      reports: [
        'Daily trial bookings',
        'Fitness goal analysis',
        'Membership conversion funnel',
        'Class popularity metrics'
      ],
      alerts: [
        {
          metric: 'trial_booking_rate',
          threshold: 0.20,
          action: 'optimize_trial_script'
        },
        {
          metric: 'membership_conversion',
          threshold: 0.15,
          action: 'review_follow_up_process'
        }
      ]
    },
    deployment: {
      readinessChecks: [
        'F45 class schedule integrated',
        'Trainer availability confirmed',
        'Payment system configured',
        'Trial class capacity verified'
      ],
      testingScenarios: [
        'Trial class booking flow',
        'Fitness goal assessment',
        'Schedule flexibility handling',
        'Membership qualification'
      ],
      goLiveSteps: [
        'Deploy to F45 location',
        'Train staff on new system',
        'Monitor first 20 trial bookings',
        'Optimize based on feedback',
        'Full rollout to all locations'
      ]
    }
  },

  // MARTIAL ARTS ACADEMY AGENT
  {
    id: 'martial_arts_trial_booking',
    name: 'Martial Arts Trial Class Agent',
    description: 'Automated martial arts trial class booking and belt level assessment',
    industry: 'martial_arts',
    useCase: 'appointment_booking',
    automationLevel: 'advanced',
    estimatedSetupTime: '12 minutes',
    features: [
      'Belt level assessment',
      'Age-appropriate class matching',
      'Trial class scheduling',
      'Discipline selection',
      'Safety requirements check',
      'Family package qualification'
    ],
    scripts: {
      greeting: `Hello {{contact_name}}! This is {{agent_name}} from {{dojo_name}} Martial Arts Academy. I'm calling because you expressed interest in our martial arts programs. Do you have a few minutes to discuss which program might be right for you?`,
      main: `Excellent! Martial arts is an incredible journey that builds discipline, confidence, and physical fitness.

Let me ask you a few questions to find the perfect program:

1. What's your age? (This helps us determine the right class level)
2. Do you have any previous martial arts experience?
3. What's your main interest - self-defense, fitness, competition, or personal development?
4. Are you looking for yourself, your child, or the whole family?

Based on your answers, I'd recommend our {{recommended_program}} program. It's perfect for {{age_group}} and focuses on {{program_focus}}.

We'd love to get you started with a FREE trial class. This gives you a chance to experience our teaching style and see if it's the right fit.

We have trial classes available {{available_times}}. What works best for your schedule?

The trial is completely free and no experience is necessary. You'll learn basic techniques and get a feel for our academy's atmosphere.`,
      fallback: `I understand you might have questions about martial arts training or our specific programs. Let me connect you with one of our instructors who can explain the different disciplines we offer and help you choose the right path.`,
      transfer: `I'm transferring you to {{instructor_name}}, one of our certified martial arts instructors. They'll be able to answer all your questions about our programs and help you find the perfect class.`,
      goodbye: `Perfect! I've got you scheduled for the {{program_name}} trial class on {{appointment_date}} at {{appointment_time}}. 

Please arrive 15 minutes early to fill out a brief waiver and get fitted for a uniform. Wear comfortable clothes and bring a water bottle. We can't wait to welcome you to the {{dojo_name}} family!`
    },
    intents: [
      {
        name: 'interested_in_trial',
        keywords: ['trial', 'try', 'free', 'class', 'lesson', 'interested', 'book'],
        confidence: 0.9,
        response: 'That\'s fantastic! A trial class is the perfect way to experience martial arts. Let me find the best program and time for you.',
        actions: ['assess_level', 'recommend_program', 'book_trial'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'trial_interest',
          tag: 'Trial Interested'
        }
      },
      {
        name: 'self_defense_focus',
        keywords: ['self defense', 'protection', 'safety', 'defend', 'security'],
        confidence: 0.9,
        response: 'Self-defense is one of the most practical benefits of martial arts! Our programs teach real-world techniques that could save your life.',
        actions: ['explain_self_defense', 'recommend_program', 'address_concerns'],
        automation: {
          ghlAction: 'add_note',
          customField: 'primary_interest',
          tag: 'Self-Defense Focus'
        }
      },
      {
        name: 'family_program',
        keywords: ['family', 'kids', 'children', 'together', 'parent', 'child'],
        confidence: 0.9,
        response: 'Family martial arts is amazing! It\'s a great way to bond while learning valuable life skills together. We have family programs for all ages.',
        actions: ['explain_family_programs', 'check_ages', 'recommend_schedule'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'program_type',
          tag: 'Family Program'
        }
      },
      {
        name: 'belt_system_questions',
        keywords: ['belt', 'rank', 'level', 'advancement', 'promotion', 'testing'],
        confidence: 0.8,
        response: 'Great question! Our belt system provides clear goals and recognition for your progress. Let me explain how advancement works in our program.',
        actions: ['explain_belt_system', 'show_timeline', 'discuss_requirements'],
        automation: {
          ghlAction: 'add_note',
          customField: 'belt_interest'
        }
      }
    ],
    transferRules: [
      {
        condition: 'injury_concerns OR medical_questions',
        target: 'human',
        priority: 1,
        automation: {
          ghlWorkflow: 'transfer_to_instructor',
          notificationSms: 'Martial arts lead has medical questions - {{contact_name}}',
          emailAlert: 'instructors@martialarts.com'
        }
      },
      {
        condition: 'competition_questions OR advanced_training',
        target: 'human',
        priority: 2,
        automation: {
          ghlWorkflow: 'transfer_to_head_instructor',
          notificationSms: 'Advanced martial arts inquiry - {{contact_name}}'
        }
      }
    ],
    ghlIntegration: {
      customFields: [
        {
          key: 'age_group',
          label: 'Age Group',
          type: 'select',
          required: true,
          options: ['Kids (4-7)', 'Youth (8-12)', 'Teens (13-17)', 'Adults (18+)', 'Seniors (55+)']
        },
        {
          key: 'experience_level',
          label: 'Martial Arts Experience',
          type: 'select',
          required: true,
          options: ['None', 'Beginner (0-6 months)', 'Intermediate (6 months - 2 years)', 'Advanced (2+ years)']
        },
        {
          key: 'primary_interest',
          label: 'Primary Interest',
          type: 'select',
          required: true,
          options: ['Self-Defense', 'Fitness', 'Competition', 'Personal Development', 'Family Activity']
        },
        {
          key: 'program_type',
          label: 'Program Type',
          type: 'select',
          required: false,
          options: ['Individual', 'Family', 'Kids Only', 'Adults Only', 'Mixed Ages']
        },
        {
          key: 'belt_level',
          label: 'Current Belt Level',
          type: 'select',
          required: false,
          options: ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black']
        },
        {
          key: 'trial_scheduled',
          label: 'Trial Class Scheduled',
          type: 'boolean',
          required: false
        }
      ],
      mergeTags: [
        '{{contact_name}}',
        '{{dojo_name}}',
        '{{program_name}}',
        '{{appointment_date}}',
        '{{appointment_time}}',
        '{{instructor_name}}',
        '{{age_group}}',
        '{{recommended_program}}'
      ],
      workflows: [
        'martial_arts_trial_booking',
        'belt_level_assessment',
        'family_program_qualification',
        'instructor_assignment'
      ],
      webhooks: [
        {
          event: 'trial_booked',
          url: 'https://api.martialarts.com/webhooks/trial-booking',
          method: 'POST',
          payload: {
            contact_id: '{{contact_id}}',
            program_name: '{{program_name}}',
            appointment_date: '{{appointment_date}}',
            age_group: '{{age_group}}',
            experience_level: '{{experience_level}}'
          }
        }
      ]
    },
    analytics: {
      kpis: [
        'Trial booking rate',
        'Age group distribution',
        'Program type preferences',
        'Belt advancement rate',
        'Family program adoption'
      ],
      reports: [
        'Daily trial bookings',
        'Program popularity analysis',
        'Student progression tracking',
        'Family enrollment metrics'
      ],
      alerts: [
        {
          metric: 'trial_booking_rate',
          threshold: 0.18,
          action: 'optimize_trial_script'
        },
        {
          metric: 'family_enrollment',
          threshold: 0.25,
          action: 'promote_family_programs'
        }
      ]
    },
    deployment: {
      readinessChecks: [
        'Class schedule integrated',
        'Instructor availability confirmed',
        'Safety waivers prepared',
        'Uniform sizing available'
      ],
      testingScenarios: [
        'Trial class booking flow',
        'Age-appropriate program matching',
        'Family program qualification',
        'Belt level assessment'
      ],
      goLiveSteps: [
        'Deploy to martial arts academy',
        'Train instructors on system',
        'Monitor first 15 trial bookings',
        'Adjust program recommendations',
        'Full academy rollout'
      ]
    }
  },

  // LEGAL CONSULTATION AGENT
  {
    id: 'legal_consultation_booking',
    name: 'Legal Consultation Booking Agent',
    description: 'Automated legal consultation booking and case type qualification',
    industry: 'legal',
    useCase: 'appointment_booking',
    automationLevel: 'enterprise',
    estimatedSetupTime: '15 minutes',
    features: [
      'Case type qualification',
      'Urgency assessment',
      'Attorney matching',
      'Consultation scheduling',
      'Conflict check',
      'Fee structure explanation'
    ],
    scripts: {
      greeting: `Hello {{contact_name}}, this is {{agent_name}} from {{law_firm_name}}. I'm calling because you recently requested information about our legal services. Do you have a few minutes to discuss your legal matter?`,
      main: `I'd be happy to help you understand how we can assist with your legal needs. Let me ask you a few questions to ensure we connect you with the right attorney:

1. What type of legal matter are you dealing with? (Personal injury, family law, business, criminal, etc.)
2. How urgent is your situation - is this something that needs immediate attention?
3. Have you consulted with any other attorneys about this matter?
4. Are you looking for a consultation, representation, or just general advice?

Based on your situation, I believe our {{recommended_attorney}} would be the best fit for your case. They specialize in {{practice_area}} and have extensive experience with cases like yours.

I'd like to schedule a confidential consultation for you. This initial meeting is {{consultation_fee}} and typically lasts about 30-45 minutes. During this time, our attorney will:
- Review the details of your case
- Explain your legal options
- Discuss potential outcomes
- Answer all your questions
- Provide a clear fee structure if you decide to proceed

What day and time works best for you this week?`,
      fallback: `I understand you may have sensitive legal questions that require careful consideration. Let me connect you directly with one of our attorneys who can provide the confidential guidance you need.`,
      transfer: `I'm transferring you to {{attorney_name}}, one of our experienced attorneys who specializes in {{practice_area}}. They'll be able to provide the legal guidance you need.`,
      goodbye: `Perfect! I've scheduled your consultation with {{attorney_name}} for {{appointment_date}} at {{appointment_time}}. 

You'll receive a confirmation email with all the details, including our office location and what documents to bring. Please arrive 10 minutes early to complete any necessary paperwork. We look forward to helping you with your legal matter.`
    },
    intents: [
      {
        name: 'personal_injury',
        keywords: ['accident', 'injury', 'hurt', 'negligence', 'compensation', 'damages'],
        confidence: 0.9,
        response: 'I\'m sorry to hear about your accident. Personal injury cases require immediate attention to preserve evidence and meet filing deadlines. Let me connect you with our personal injury specialist.',
        actions: ['assess_urgency', 'check_statute_limitations', 'schedule_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'case_type',
          tag: 'Personal Injury Case'
        }
      },
      {
        name: 'family_law',
        keywords: ['divorce', 'custody', 'child support', 'alimony', 'separation', 'family'],
        confidence: 0.9,
        response: 'Family law matters are often emotionally challenging. Our family law attorneys are experienced in handling these sensitive cases with compassion and expertise.',
        actions: ['assess_family_situation', 'explain_process', 'schedule_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'case_type',
          tag: 'Family Law Case'
        }
      },
      {
        name: 'business_law',
        keywords: ['business', 'contract', 'partnership', 'corporate', 'startup', 'commercial'],
        confidence: 0.9,
        response: 'Business legal matters require specialized knowledge. Our business attorneys can help protect your interests and ensure compliance with all regulations.',
        actions: ['assess_business_needs', 'explain_services', 'schedule_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'case_type',
          tag: 'Business Law Case'
        }
      },
      {
        name: 'criminal_defense',
        keywords: ['arrested', 'charged', 'criminal', 'court', 'defense', 'prosecution'],
        confidence: 0.95,
        response: 'Criminal charges are serious and require immediate legal representation. Our criminal defense attorneys are available 24/7 for urgent matters.',
        actions: ['assess_urgency', 'check_availability', 'schedule_urgent_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'case_type',
          tag: 'Criminal Defense Case'
        }
      }
    ],
    transferRules: [
      {
        condition: 'urgent_matter OR emergency',
        target: 'human',
        priority: 1,
        automation: {
          ghlWorkflow: 'transfer_to_urgent_attorney',
          notificationSms: 'URGENT: Legal matter needs immediate attention - {{contact_name}}',
          emailAlert: 'urgent@lawfirm.com'
        }
      },
      {
        condition: 'conflict_of_interest OR existing_client',
        target: 'human',
        priority: 2,
        automation: {
          ghlWorkflow: 'transfer_to_managing_partner',
          notificationSms: 'Potential conflict of interest - {{contact_name}}'
        }
      }
    ],
    ghlIntegration: {
      customFields: [
        {
          key: 'case_type',
          label: 'Legal Case Type',
          type: 'select',
          required: true,
          options: ['Personal Injury', 'Family Law', 'Business Law', 'Criminal Defense', 'Estate Planning', 'Real Estate', 'Other']
        },
        {
          key: 'urgency_level',
          label: 'Urgency Level',
          type: 'select',
          required: true,
          options: ['Emergency (24 hours)', 'Urgent (1-3 days)', 'Standard (1-2 weeks)', 'Non-urgent (2+ weeks)']
        },
        {
          key: 'previous_attorney',
          label: 'Previous Attorney Consultation',
          type: 'boolean',
          required: false
        },
        {
          key: 'consultation_type',
          label: 'Consultation Type',
          type: 'select',
          required: false,
          options: ['Initial Consultation', 'Case Review', 'Second Opinion', 'Emergency Consultation']
        },
        {
          key: 'attorney_specialty',
          label: 'Required Attorney Specialty',
          type: 'select',
          required: false,
          options: ['Personal Injury', 'Family Law', 'Business Law', 'Criminal Defense', 'Estate Planning', 'Real Estate']
        },
        {
          key: 'conflict_check',
          label: 'Conflict Check Status',
          type: 'select',
          required: false,
          options: ['Pending', 'Clear', 'Conflict Found', 'Needs Review']
        }
      ],
      mergeTags: [
        '{{contact_name}}',
        '{{law_firm_name}}',
        '{{attorney_name}}',
        '{{appointment_date}}',
        '{{appointment_time}}',
        '{{practice_area}}',
        '{{consultation_fee}}',
        '{{recommended_attorney}}'
      ],
      workflows: [
        'legal_consultation_booking',
        'case_type_qualification',
        'attorney_matching',
        'conflict_check_process'
      ],
      webhooks: [
        {
          event: 'consultation_booked',
          url: 'https://api.lawfirm.com/webhooks/consultation-booking',
          method: 'POST',
          payload: {
            contact_id: '{{contact_id}}',
            case_type: '{{case_type}}',
            attorney_name: '{{attorney_name}}',
            appointment_date: '{{appointment_date}}',
            urgency_level: '{{urgency_level}}'
          }
        }
      ]
    },
    analytics: {
      kpis: [
        'Consultation booking rate',
        'Case type distribution',
        'Attorney matching accuracy',
        'Urgency level assessment',
        'Conflict check efficiency'
      ],
      reports: [
        'Daily consultation bookings',
        'Case type analysis',
        'Attorney workload distribution',
        'Client satisfaction metrics'
      ],
      alerts: [
        {
          metric: 'consultation_booking_rate',
          threshold: 0.12,
          action: 'optimize_consultation_script'
        },
        {
          metric: 'urgent_cases',
          threshold: 0.20,
          action: 'increase_urgent_attorney_availability'
        }
      ]
    },
    deployment: {
      readinessChecks: [
        'Attorney schedules integrated',
        'Conflict check system configured',
        'Consultation fees set',
        'Confidentiality protocols verified'
      ],
      testingScenarios: [
        'Case type qualification flow',
        'Urgency assessment process',
        'Attorney matching logic',
        'Conflict check automation'
      ],
      goLiveSteps: [
        'Deploy to law firm',
        'Train staff on legal protocols',
        'Monitor first 10 consultations',
        'Refine attorney matching',
        'Full firm implementation'
      ]
    }
  },

  // PLUMBING EMERGENCY AGENT
  {
    id: 'plumbing_emergency_booking',
    name: 'Plumbing Emergency Booking Agent',
    description: 'Automated plumbing emergency response and service booking system',
    industry: 'plumbing',
    useCase: 'appointment_booking',
    automationLevel: 'enterprise',
    estimatedSetupTime: '8 minutes',
    features: [
      'Emergency priority assessment',
      'Service type identification',
      'Technician dispatch',
      'Pricing estimation',
      'Emergency response tracking',
      'Follow-up scheduling'
    ],
    scripts: {
      greeting: `Hi {{contact_name}}, this is {{agent_name}} from {{company_name}} Plumbing. I'm calling because you requested emergency plumbing service. What's the nature of your plumbing emergency?`,
      main: `I understand you're dealing with a plumbing issue. Let me quickly assess the situation to get you the right help:

1. What type of problem are you experiencing? (Leak, clog, no water, water damage, etc.)
2. Is water currently flooding or causing damage to your property?
3. Do you have water shut off, or do you need us to shut it off?
4. What's your address so we can dispatch the nearest technician?

Based on your description, this sounds like a {{service_type}} issue. Our emergency response team can have a licensed plumber at your location within {{response_time}}.

For emergency service, our call-out fee is ${{callout_fee}}, and then we'll provide a detailed estimate for the repair work. We accept all major credit cards and can provide financing options for larger repairs.

I can dispatch a technician right now. What's your preferred arrival time - within the next hour or do you have a specific time preference?`,
      fallback: `I understand this is urgent and you need immediate assistance. Let me connect you directly with our emergency dispatch team who can get a technician to your location as quickly as possible.`,
      transfer: `I'm transferring you to {{dispatcher_name}}, our emergency dispatch coordinator. They'll get a technician dispatched to your location immediately.`,
      goodbye: `Perfect! I've dispatched {{technician_name}} to your location at {{address}}. They'll arrive within {{response_time}} and will call you 15 minutes before arrival.

You'll receive a text message with the technician's information and tracking link. The call-out fee is ${{callout_fee}}, and they'll provide a detailed estimate for any repair work needed.

Is there anything else I can help you with while you wait for the technician?`
    },
    intents: [
      {
        name: 'water_emergency',
        keywords: ['flooding', 'leak', 'burst', 'overflowing', 'water damage', 'emergency'],
        confidence: 0.95,
        response: 'This sounds like a water emergency! We need to get a technician there immediately to prevent further damage. Let me dispatch our emergency team right now.',
        actions: ['assess_urgency', 'dispatch_emergency', 'provide_instructions'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Water Emergency'
        }
      },
      {
        name: 'no_water',
        keywords: ['no water', 'water off', 'pressure', 'dry', 'shut off'],
        confidence: 0.9,
        response: 'No water is definitely an emergency! This could be a main line issue or a problem with your water heater. Let me get a technician out there quickly.',
        actions: ['check_main_line', 'dispatch_technician', 'explain_possibilities'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'No Water Emergency'
        }
      },
      {
        name: 'clog_issue',
        keywords: ['clogged', 'backed up', 'drain', 'toilet', 'slow', 'blocked'],
        confidence: 0.85,
        response: 'Clogs can cause serious problems if not addressed quickly. Our technicians have the right equipment to clear even the toughest blockages.',
        actions: ['assess_clog_type', 'schedule_service', 'explain_process'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Clog Issue'
        }
      },
      {
        name: 'water_heater',
        keywords: ['water heater', 'hot water', 'heater', 'tank', 'boiler'],
        confidence: 0.9,
        response: 'Water heater issues can be complex and potentially dangerous. Our certified technicians can diagnose and repair all types of water heaters safely.',
        actions: ['assess_heater_type', 'check_safety', 'schedule_service'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Water Heater Issue'
        }
      }
    ],
    transferRules: [
      {
        condition: 'gas_leak OR safety_hazard',
        target: 'human',
        priority: 1,
        automation: {
          ghlWorkflow: 'transfer_to_emergency_dispatch',
          notificationSms: 'SAFETY HAZARD: Gas leak or safety issue - {{contact_name}}',
          emailAlert: 'emergency@plumbing.com'
        }
      },
      {
        condition: 'insurance_claim OR major_damage',
        target: 'human',
        priority: 2,
        automation: {
          ghlWorkflow: 'transfer_to_insurance_coordinator',
          notificationSms: 'Insurance claim needed - {{contact_name}}'
        }
      }
    ],
    ghlIntegration: {
      customFields: [
        {
          key: 'service_type',
          label: 'Plumbing Service Type',
          type: 'select',
          required: true,
          options: ['Water Emergency', 'No Water', 'Clog Issue', 'Water Heater', 'Leak Repair', 'Installation', 'Maintenance']
        },
        {
          key: 'urgency_level',
          label: 'Urgency Level',
          type: 'select',
          required: true,
          options: ['Emergency (1 hour)', 'Urgent (2-4 hours)', 'Same Day', 'Next Day']
        },
        {
          key: 'property_type',
          label: 'Property Type',
          type: 'select',
          required: false,
          options: ['Residential', 'Commercial', 'Apartment', 'Condo', 'Mobile Home']
        },
        {
          key: 'water_shutoff',
          label: 'Water Shut Off Available',
          type: 'boolean',
          required: false
        },
        {
          key: 'insurance_claim',
          label: 'Insurance Claim Needed',
          type: 'boolean',
          required: false
        },
        {
          key: 'technician_assigned',
          label: 'Technician Assigned',
          type: 'text',
          required: false
        }
      ],
      mergeTags: [
        '{{contact_name}}',
        '{{company_name}}',
        '{{technician_name}}',
        '{{dispatcher_name}}',
        '{{service_type}}',
        '{{response_time}}',
        '{{callout_fee}}',
        '{{address}}'
      ],
      workflows: [
        'plumbing_emergency_dispatch',
        'technician_assignment',
        'service_completion_followup',
        'insurance_claim_assistance'
      ],
      webhooks: [
        {
          event: 'technician_dispatched',
          url: 'https://api.plumbing.com/webhooks/dispatch',
          method: 'POST',
          payload: {
            contact_id: '{{contact_id}}',
            service_type: '{{service_type}}',
            technician_name: '{{technician_name}}',
            address: '{{address}}',
            urgency_level: '{{urgency_level}}'
          }
        }
      ]
    },
    analytics: {
      kpis: [
        'Emergency response time',
        'Service type distribution',
        'Technician dispatch efficiency',
        'Customer satisfaction rate',
        'Repeat customer rate'
      ],
      reports: [
        'Daily emergency calls',
        'Response time analysis',
        'Technician performance',
        'Service completion rates'
      ],
      alerts: [
        {
          metric: 'response_time',
          threshold: 60,
          action: 'optimize_technician_routing'
        },
        {
          metric: 'emergency_calls',
          threshold: 10,
          action: 'increase_emergency_crew'
        }
      ]
    },
    deployment: {
      readinessChecks: [
        'Technician schedules integrated',
        'Emergency response protocols verified',
        'Pricing structure configured',
        'Insurance claim process ready'
      ],
      testingScenarios: [
        'Emergency dispatch flow',
        'Service type identification',
        'Technician assignment logic',
        'Safety hazard handling'
      ],
      goLiveSteps: [
        'Deploy to plumbing company',
        'Train dispatchers on system',
        'Monitor first 20 emergency calls',
        'Optimize response times',
        'Full service area rollout'
      ]
    }
  },

  // TOWING SERVICE AGENT
  {
    id: 'towing_service_booking',
    name: 'Towing Service Booking Agent',
    description: 'Automated towing service dispatch and emergency response system',
    industry: 'towing',
    useCase: 'appointment_booking',
    automationLevel: 'enterprise',
    estimatedSetupTime: '6 minutes',
    features: [
      'Emergency dispatch automation',
      'Vehicle type identification',
      'Location tracking',
      'Pricing estimation',
      'ETA calculation',
      'Service completion tracking'
    ],
    scripts: {
      greeting: `Hi {{contact_name}}, this is {{agent_name}} from {{company_name}} Towing. I'm calling because you requested towing service. What's your current situation?`,
      main: `I understand you need towing assistance. Let me get the details to dispatch the right truck:

1. What type of vehicle needs to be towed? (Car, truck, motorcycle, RV, etc.)
2. What's the problem - breakdown, accident, lockout, or other issue?
3. What's your exact location and address?
4. Is the vehicle in a safe location or blocking traffic?

Based on your information, I can dispatch a {{truck_type}} to your location. Our estimated arrival time is {{eta}} minutes.

For {{service_type}} service, our rate is ${{base_rate}} plus ${{per_mile}} per mile. We accept all major credit cards and can provide a receipt for insurance purposes.

I can dispatch a tow truck right now. Is this location accessible for a tow truck, or do we need any special equipment?`,
      fallback: `I understand this is urgent and you need immediate assistance. Let me connect you directly with our dispatch team who can get a tow truck to your location as quickly as possible.`,
      transfer: `I'm transferring you to {{dispatcher_name}}, our dispatch coordinator. They'll get a tow truck dispatched to your location immediately.`,
      goodbye: `Perfect! I've dispatched {{driver_name}} in a {{truck_type}} to your location at {{address}}. They'll arrive within {{eta}} minutes and will call you when they're 5 minutes away.

You'll receive a text message with the driver's information and tracking link. The estimated cost is ${{estimated_cost}} based on your location and service type.

Is there anything else I can help you with while you wait for the tow truck?`
    },
    intents: [
      {
        name: 'breakdown_service',
        keywords: ['breakdown', 'won\'t start', 'engine', 'battery', 'mechanical', 'stranded'],
        confidence: 0.9,
        response: 'I understand your vehicle has broken down. We can get a tow truck to your location to either fix it on-site or tow it to a repair shop.',
        actions: ['assess_vehicle_type', 'check_location', 'dispatch_tow_truck'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Breakdown Service'
        }
      },
      {
        name: 'accident_towing',
        keywords: ['accident', 'collision', 'crashed', 'damaged', 'wreck', 'insurance'],
        confidence: 0.95,
        response: 'I\'m sorry to hear about your accident. We can tow your vehicle to a repair shop or insurance-approved facility. Do you need police assistance as well?',
        actions: ['assess_damage', 'check_insurance', 'dispatch_specialized_truck'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Accident Towing'
        }
      },
      {
        name: 'lockout_service',
        keywords: ['locked out', 'keys', 'locked', 'unlock', 'keyless entry'],
        confidence: 0.9,
        response: 'We can help with lockout service! Our technicians can unlock most vehicles without damage. This is usually much faster and cheaper than towing.',
        actions: ['assess_vehicle_type', 'check_unlock_capability', 'dispatch_unlock_service'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Lockout Service'
        }
      },
      {
        name: 'jump_start',
        keywords: ['jump start', 'battery', 'dead battery', 'won\'t start', 'jump'],
        confidence: 0.9,
        response: 'We can provide jump start service! This is usually a quick fix and much more affordable than towing. Let me dispatch a technician with jump start equipment.',
        actions: ['assess_battery_issue', 'dispatch_jump_service', 'explain_process'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'service_type',
          tag: 'Jump Start Service'
        }
      }
    ],
    transferRules: [
      {
        condition: 'hazardous_location OR traffic_blocking',
        target: 'human',
        priority: 1,
        automation: {
          ghlWorkflow: 'transfer_to_emergency_dispatch',
          notificationSms: 'URGENT: Vehicle blocking traffic - {{contact_name}}',
          emailAlert: 'emergency@towing.com'
        }
      },
      {
        condition: 'insurance_claim OR legal_issues',
        target: 'human',
        priority: 2,
        automation: {
          ghlWorkflow: 'transfer_to_insurance_coordinator',
          notificationSms: 'Insurance claim towing - {{contact_name}}'
        }
      }
    ],
    ghlIntegration: {
      customFields: [
        {
          key: 'service_type',
          label: 'Towing Service Type',
          type: 'select',
          required: true,
          options: ['Breakdown Service', 'Accident Towing', 'Lockout Service', 'Jump Start', 'Flat Tire', 'Fuel Delivery', 'Other']
        },
        {
          key: 'vehicle_type',
          label: 'Vehicle Type',
          type: 'select',
          required: true,
          options: ['Car', 'Truck', 'SUV', 'Motorcycle', 'RV', 'Commercial Vehicle', 'Other']
        },
        {
          key: 'urgency_level',
          label: 'Urgency Level',
          type: 'select',
          required: true,
          options: ['Emergency (30 min)', 'Urgent (1 hour)', 'Standard (2-4 hours)', 'Scheduled']
        },
        {
          key: 'location_type',
          label: 'Location Type',
          type: 'select',
          required: false,
          options: ['Highway', 'City Street', 'Parking Lot', 'Private Property', 'Hazardous Location']
        },
        {
          key: 'insurance_claim',
          label: 'Insurance Claim',
          type: 'boolean',
          required: false
        },
        {
          key: 'driver_assigned',
          label: 'Driver Assigned',
          type: 'text',
          required: false
        }
      ],
      mergeTags: [
        '{{contact_name}}',
        '{{company_name}}',
        '{{driver_name}}',
        '{{dispatcher_name}}',
        '{{truck_type}}',
        '{{service_type}}',
        '{{eta}}',
        '{{base_rate}}',
        '{{per_mile}}',
        '{{estimated_cost}}',
        '{{address}}'
      ],
      workflows: [
        'towing_service_dispatch',
        'driver_assignment',
        'service_completion_tracking',
        'insurance_claim_processing'
      ],
      webhooks: [
        {
          event: 'tow_truck_dispatched',
          url: 'https://api.towing.com/webhooks/dispatch',
          method: 'POST',
          payload: {
            contact_id: '{{contact_id}}',
            service_type: '{{service_type}}',
            driver_name: '{{driver_name}}',
            address: '{{address}}',
            eta: '{{eta}}'
          }
        }
      ]
    },
    analytics: {
      kpis: [
        'Response time (ETA accuracy)',
        'Service type distribution',
        'Driver dispatch efficiency',
        'Customer satisfaction rate',
        'Repeat customer rate'
      ],
      reports: [
        'Daily towing requests',
        'Response time analysis',
        'Driver performance metrics',
        'Service completion rates'
      ],
      alerts: [
        {
          metric: 'response_time',
          threshold: 45,
          action: 'optimize_driver_routing'
        },
        {
          metric: 'emergency_calls',
          threshold: 15,
          action: 'increase_emergency_fleet'
        }
      ]
    },
    deployment: {
      readinessChecks: [
        'Driver schedules integrated',
        'Fleet tracking system configured',
        'Pricing structure set',
        'Insurance claim process ready'
      ],
      testingScenarios: [
        'Emergency dispatch flow',
        'Service type identification',
        'Driver assignment logic',
        'Hazardous location handling'
      ],
      goLiveSteps: [
        'Deploy to towing company',
        'Train dispatchers on system',
        'Monitor first 25 towing requests',
        'Optimize response times',
        'Full service area rollout'
      ]
    }
  },

  // CONSTRUCTION CONSULTATION AGENT
  {
    id: 'construction_consultation_booking',
    name: 'Construction Consultation Booking Agent',
    description: 'Automated construction project consultation and estimate booking system',
    industry: 'construction',
    useCase: 'appointment_booking',
    automationLevel: 'advanced',
    estimatedSetupTime: '12 minutes',
    features: [
      'Project type qualification',
      'Budget assessment',
      'Timeline evaluation',
      'Contractor matching',
      'Site visit scheduling',
      'Estimate delivery'
    ],
    scripts: {
      greeting: `Hello {{contact_name}}, this is {{agent_name}} from {{company_name}} Construction. I'm calling because you requested information about our construction services. Do you have a few minutes to discuss your project?`,
      main: `I'd be happy to help you with your construction project. Let me ask you a few questions to understand what you're looking for:

1. What type of construction project are you planning? (New build, renovation, addition, repair, etc.)
2. What's the approximate size or scope of the project?
3. What's your target budget range for this project?
4. When are you hoping to start construction?
5. Do you have architectural plans, or do you need design services as well?

Based on your project details, I believe our {{recommended_contractor}} would be the best fit. They specialize in {{project_type}} and have extensive experience with projects like yours.

I'd like to schedule a free consultation and site visit for you. During this meeting, our contractor will:
- Assess your property and project requirements
- Review any existing plans or ideas you have
- Provide a detailed project timeline
- Give you a comprehensive cost estimate
- Answer all your questions about the construction process

What day and time works best for you this week?`,
      fallback: `I understand you may have complex questions about your construction project. Let me connect you directly with one of our project managers who can provide detailed information about our services and help you plan your project.`,
      transfer: `I'm transferring you to {{project_manager_name}}, one of our experienced project managers. They'll be able to answer all your questions about construction timelines, costs, and processes.`,
      goodbye: `Perfect! I've scheduled your consultation with {{contractor_name}} for {{appointment_date}} at {{appointment_time}}. 

They'll meet you at {{project_address}} to assess your project. Please have any plans, photos, or ideas ready to discuss. You'll receive a confirmation email with all the details and what to expect during the consultation.

We look forward to helping you bring your construction project to life!`
    },
    intents: [
      {
        name: 'new_construction',
        keywords: ['new build', 'new construction', 'build house', 'custom home', 'ground up'],
        confidence: 0.9,
        response: 'New construction is exciting! We specialize in custom homes and can handle everything from design to completion. Let me connect you with our new construction specialist.',
        actions: ['assess_project_scope', 'check_budget', 'schedule_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'project_type',
          tag: 'New Construction'
        }
      },
      {
        name: 'renovation',
        keywords: ['renovation', 'remodel', 'update', 'modernize', 'upgrade', 'refresh'],
        confidence: 0.9,
        response: 'Renovations can transform your space! We handle everything from kitchen remodels to whole-house renovations. Let me assess your specific needs.',
        actions: ['assess_renovation_scope', 'check_structural_issues', 'schedule_site_visit'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'project_type',
          tag: 'Renovation Project'
        }
      },
      {
        name: 'addition',
        keywords: ['addition', 'add on', 'extend', 'expand', 'extra room', 'more space'],
        confidence: 0.9,
        response: 'Additions are a great way to get more space! We can help design and build additions that seamlessly integrate with your existing home.',
        actions: ['assess_addition_scope', 'check_zoning', 'schedule_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'project_type',
          tag: 'Addition Project'
        }
      },
      {
        name: 'commercial_construction',
        keywords: ['commercial', 'business', 'office', 'retail', 'warehouse', 'industrial'],
        confidence: 0.9,
        response: 'Commercial construction requires specialized expertise! We have extensive experience with commercial projects and can handle all the permits and regulations.',
        actions: ['assess_commercial_scope', 'check_permits', 'schedule_consultation'],
        automation: {
          ghlAction: 'update_contact_field',
          customField: 'project_type',
          tag: 'Commercial Construction'
        }
      }
    ],
    transferRules: [
      {
        condition: 'complex_permits OR zoning_issues',
        target: 'human',
        priority: 1,
        automation: {
          ghlWorkflow: 'transfer_to_project_manager',
          notificationSms: 'Complex construction project - {{contact_name}}',
          emailAlert: 'projectmanagers@construction.com'
        }
      },
      {
        condition: 'high_budget_project OR custom_design',
        target: 'human',
        priority: 2,
        automation: {
          ghlWorkflow: 'transfer_to_senior_contractor',
          notificationSms: 'High-value construction project - {{contact_name}}'
        }
      }
    ],
    ghlIntegration: {
      customFields: [
        {
          key: 'project_type',
          label: 'Construction Project Type',
          type: 'select',
          required: true,
          options: ['New Construction', 'Renovation', 'Addition', 'Commercial', 'Repair', 'Maintenance']
        },
        {
          key: 'project_scope',
          label: 'Project Scope',
          type: 'select',
          required: true,
          options: ['Small (<$50k)', 'Medium ($50k-$200k)', 'Large ($200k-$500k)', 'XLarge ($500k+)']
        },
        {
          key: 'timeline',
          label: 'Desired Start Date',
          type: 'select',
          required: false,
          options: ['Immediately', '1-3 months', '3-6 months', '6-12 months', 'Flexible']
        },
        {
          key: 'budget_range',
          label: 'Budget Range',
          type: 'select',
          required: false,
          options: ['Under $25k', '$25k-$50k', '$50k-$100k', '$100k-$250k', '$250k-$500k', '$500k+']
        },
        {
          key: 'has_plans',
          label: 'Has Architectural Plans',
          type: 'boolean',
          required: false
        },
        {
          key: 'contractor_assigned',
          label: 'Contractor Assigned',
          type: 'text',
          required: false
        }
      ],
      mergeTags: [
        '{{contact_name}}',
        '{{company_name}}',
        '{{contractor_name}}',
        '{{project_manager_name}}',
        '{{project_type}}',
        '{{appointment_date}}',
        '{{appointment_time}}',
        '{{project_address}}',
        '{{recommended_contractor}}'
      ],
      workflows: [
        'construction_consultation_booking',
        'project_type_qualification',
        'contractor_matching',
        'site_visit_scheduling'
      ],
      webhooks: [
        {
          event: 'consultation_booked',
          url: 'https://api.construction.com/webhooks/consultation-booking',
          method: 'POST',
          payload: {
            contact_id: '{{contact_id}}',
            project_type: '{{project_type}}',
            contractor_name: '{{contractor_name}}',
            appointment_date: '{{appointment_date}}',
            project_scope: '{{project_scope}}'
          }
        }
      ]
    },
    analytics: {
      kpis: [
        'Consultation booking rate',
        'Project type distribution',
        'Contractor matching accuracy',
        'Budget range analysis',
        'Timeline adherence'
      ],
      reports: [
        'Daily consultation bookings',
        'Project type analysis',
        'Contractor performance',
        'Budget conversion rates'
      ],
      alerts: [
        {
          metric: 'consultation_booking_rate',
          threshold: 0.15,
          action: 'optimize_consultation_script'
        },
        {
          metric: 'high_value_projects',
          threshold: 0.30,
          action: 'assign_senior_contractors'
        }
      ]
    },
    deployment: {
      readinessChecks: [
        'Contractor schedules integrated',
        'Project management system configured',
        'Permit process documented',
        'Estimate templates prepared'
      ],
      testingScenarios: [
        'Project type qualification flow',
        'Budget assessment process',
        'Contractor matching logic',
        'Site visit scheduling'
      ],
      goLiveSteps: [
        'Deploy to construction company',
        'Train project managers on system',
        'Monitor first 15 consultations',
        'Refine contractor matching',
        'Full company implementation'
      ]
    }
  }
];

export const getTemplatesByIndustry = (industry: string) => {
  return voiceAgentTemplates.filter(template => template.industry === industry);
};

export const getTemplatesByUseCase = (useCase: string) => {
  return voiceAgentTemplates.filter(template => template.useCase === useCase);
};

export const getTemplateById = (id: string) => {
  return voiceAgentTemplates.find(template => template.id === id);
};
