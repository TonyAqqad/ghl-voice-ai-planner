// Workflow Templates for GHL Voice AI Agent Planner

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_qualification' | 'appointment_booking' | 'follow_up' | 'customer_service' | 'sales';
  type: 'traditional' | 'ai_custom_actions';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
  steps: Array<{
    type: string;
    name: string;
    description: string;
    config: Record<string, any>;
  }>;
  preview: {
    trigger: string;
    actions: string[];
    outcome: string;
  };
}

export const workflowTemplates: WorkflowTemplate[] = [
  // LEAD QUALIFICATION TEMPLATES
  {
    id: 'hot_lead_follow_up',
    name: 'Hot Lead Follow-Up',
    description: 'Automatically call high-intent leads within 5 minutes of form submission',
    category: 'lead_qualification',
    type: 'traditional',
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    tags: ['lead-qualification', 'follow-up', 'sales'],
    steps: [
      {
        type: 'trigger',
        name: 'Form Submitted',
        description: 'Trigger when contact submits lead form',
        config: {
          triggerType: 'form_submitted',
          formId: 'lead_form',
          conditions: {
            leadScore: { operator: 'greater_than', value: '75' }
          }
        }
      },
      {
        type: 'filter',
        name: 'High Intent Filter',
        description: 'Only process high-intent leads',
        config: {
          conditions: [
            { field: 'lead_score', operator: 'greater_than', value: '75' },
            { field: 'source', operator: 'equals', value: 'website' }
          ]
        }
      },
      {
        type: 'action',
        name: 'Add Hot Lead Tag',
        description: 'Tag contact as hot lead',
        config: {
          actionType: 'add_tag',
          tagName: 'Hot Lead',
          tagColor: '#ff4444'
        }
      },
      {
        type: 'action',
        name: 'Create Task',
        description: 'Create follow-up task for sales team',
        config: {
          actionType: 'create_task',
          taskTitle: 'Call Hot Lead - {{contact_name}}',
          taskDescription: 'High-intent lead submitted form. Call within 5 minutes.',
          assignedTo: 'sales_team',
          dueDate: '5 minutes'
        }
      },
      {
        type: 'action',
        name: 'Send SMS Notification',
        description: 'Notify sales team via SMS',
        config: {
          actionType: 'send_sms',
          message: '🔥 HOT LEAD: {{contact_name}} just submitted form. Call now!',
          to: 'sales_team_phone'
        }
      }
    ],
    preview: {
      trigger: 'Form submission with high lead score',
      actions: ['Add hot lead tag', 'Create follow-up task', 'Send SMS alert'],
      outcome: 'Sales team immediately notified to call high-intent leads'
    }
  },

  // APPOINTMENT BOOKING TEMPLATES
  {
    id: 'appointment_reminder_sequence',
    name: 'Appointment Reminder Sequence',
    description: 'Automated reminder calls before appointments to reduce no-shows',
    category: 'appointment_booking',
    type: 'traditional',
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    tags: ['appointments', 'reminders', 'reduces-no-shows'],
    steps: [
      {
        type: 'trigger',
        name: 'Appointment Booked',
        description: 'Trigger when appointment is scheduled',
        config: {
          triggerType: 'customer_booked_appointment',
          calendarId: 'main_calendar',
          appointmentType: 'consultation'
        }
      },
      {
        type: 'action',
        name: '24-Hour Reminder',
        description: 'Schedule reminder call 24 hours before',
        config: {
          actionType: 'delay',
          delayType: 'scheduled',
          delayValue: '24 hours before appointment'
        }
      },
      {
        type: 'action',
        name: 'Send Reminder Call',
        description: 'Make reminder call',
        config: {
          actionType: 'make_call',
          callType: 'voice_ai',
          agentId: 'appointment_reminder_agent',
          script: 'appointment_reminder_script'
        }
      },
      {
        type: 'condition',
        name: 'Check Confirmation',
        description: 'Check if appointment confirmed',
        config: {
          conditionType: 'call_outcome',
          conditions: [
            { field: 'appointment_confirmed', operator: 'equals', value: 'true' }
          ]
        }
      },
      {
        type: 'action',
        name: 'Send Confirmation Email',
        description: 'Send confirmation email if confirmed',
        config: {
          actionType: 'send_email',
          templateId: 'appointment_confirmed',
          to: '{{contact_email}}'
        }
      }
    ],
    preview: {
      trigger: 'Appointment booking',
      actions: ['Schedule 24h reminder', 'Make reminder call', 'Send confirmation'],
      outcome: 'Reduced no-shows through automated reminder system'
    }
  },

  // AI CUSTOM ACTIONS TEMPLATES
  {
    id: 'real_time_sentiment_analysis',
    name: 'Real-Time Sentiment Analysis',
    description: 'Analyze caller sentiment during live calls and trigger appropriate responses',
    category: 'customer_service',
    type: 'ai_custom_actions',
    difficulty: 'advanced',
    estimatedTime: '20 minutes',
    tags: ['sentiment-analysis', 'real-time', 'customer-service'],
    steps: [
      {
        type: 'trigger',
        name: 'Transcript Ready',
        description: 'Trigger when transcript segment is available',
        config: {
          trigger: 'transcript_ready',
          webhookUrl: 'https://your-sentiment-api.com/analyze',
          method: 'POST',
          payload: {
            transcript: '{{transcript}}',
            call_id: '{{call_id}}',
            contact_id: '{{contact_id}}'
          }
        }
      },
      {
        type: 'condition',
        name: 'Sentiment Check',
        description: 'Check if sentiment is negative',
        config: {
          conditions: [
            { field: 'sentiment_score', operator: 'less_than', value: '0.3' }
          ]
        }
      },
      {
        type: 'action',
        name: 'Alert Supervisor',
        description: 'Alert supervisor for negative sentiment',
        config: {
          webhookUrl: 'https://your-alert-system.com/notify',
          method: 'POST',
          payload: {
            alert_type: 'negative_sentiment',
            call_id: '{{call_id}}',
            contact_name: '{{contact_name}}',
            sentiment_score: '{{sentiment_score}}',
            transcript: '{{transcript}}'
          }
        }
      }
    ],
    preview: {
      trigger: 'Real-time transcript analysis',
      actions: ['Analyze sentiment', 'Alert supervisor if negative'],
      outcome: 'Proactive customer service intervention'
    }
  },

  {
    id: 'intent_based_routing',
    name: 'Intent-Based Call Routing',
    description: 'Route calls to appropriate departments based on detected intent',
    category: 'customer_service',
    type: 'ai_custom_actions',
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    tags: ['intent-detection', 'call-routing', 'automation'],
    steps: [
      {
        type: 'trigger',
        name: 'Intent Detected',
        description: 'Trigger when AI detects caller intent',
        config: {
          trigger: 'intent_detected',
          webhookUrl: 'https://your-intent-api.com/route',
          method: 'POST',
          payload: {
            intent: '{{intent}}',
            confidence: '{{confidence}}',
            call_id: '{{call_id}}',
            contact_id: '{{contact_id}}'
          }
        }
      },
      {
        type: 'condition',
        name: 'Sales Intent',
        description: 'Check if intent is sales-related',
        config: {
          conditions: [
            { field: 'intent', operator: 'equals', value: 'sales_inquiry' },
            { field: 'confidence', operator: 'greater_than', value: '0.8' }
          ]
        }
      },
      {
        type: 'action',
        name: 'Route to Sales',
        description: 'Transfer to sales team',
        config: {
          webhookUrl: 'https://your-crm.com/transfer',
          method: 'POST',
          payload: {
            action: 'transfer_call',
            department: 'sales',
            call_id: '{{call_id}}',
            reason: 'Sales inquiry detected'
          }
        }
      }
    ],
    preview: {
      trigger: 'Intent detection during call',
      actions: ['Analyze intent', 'Route to appropriate department'],
      outcome: 'Efficient call routing based on caller needs'
    }
  },

  // FOLLOW-UP TEMPLATES
  {
    id: 'post_call_follow_up',
    name: 'Post-Call Follow-Up',
    description: 'Automated follow-up sequence after Voice AI calls',
    category: 'follow_up',
    type: 'traditional',
    difficulty: 'beginner',
    estimatedTime: '12 minutes',
    tags: ['follow-up', 'post-call', 'nurturing'],
    steps: [
      {
        type: 'trigger',
        name: 'Call Completed',
        description: 'Trigger when call ends',
        config: {
          triggerType: 'call_status',
          status: 'completed',
          callType: 'voice_ai'
        }
      },
      {
        type: 'condition',
        name: 'Check Call Outcome',
        description: 'Check if appointment was booked',
        config: {
          conditions: [
            { field: 'appointment_booked', operator: 'equals', value: 'true' }
          ]
        }
      },
      {
        type: 'action',
        name: 'Send Confirmation Email',
        description: 'Send appointment confirmation',
        config: {
          actionType: 'send_email',
          templateId: 'appointment_confirmation',
          to: '{{contact_email}}'
        }
      },
      {
        type: 'action',
        name: 'Add Follow-Up Task',
        description: 'Create follow-up task',
        config: {
          actionType: 'create_task',
          taskTitle: 'Follow up with {{contact_name}}',
          taskDescription: 'Post-call follow-up for appointment booked',
          dueDate: '1 day'
        }
      }
    ],
    preview: {
      trigger: 'Call completion',
      actions: ['Check outcome', 'Send confirmation', 'Create follow-up task'],
      outcome: 'Seamless post-call experience'
    }
  }
];

export const getTemplatesByCategory = (category: string) => {
  return workflowTemplates.filter(template => template.category === category);
};

export const getTemplatesByType = (type: 'traditional' | 'ai_custom_actions') => {
  return workflowTemplates.filter(template => template.type === type);
};

export const getTemplateById = (id: string) => {
  return workflowTemplates.find(template => template.id === id);
};
